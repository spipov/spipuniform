import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import {
  listings,
  listingImages,
  schools,
  productTypes,
  productCategories,
  conditions as conditionsTable,
  localities,
  counties,
  userProfiles,
  files
} from '@/db/schema';
import { eq, and, or, desc, asc, sql, ilike, gte, lte, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Validation schema for search parameters
const searchSchema = z.object({
  // Text search
  q: z.string().optional(),

  // Category and product type filters - allow any non-empty string
  categoryId: z.string().min(1).optional(),
  productTypeId: z.string().min(1).optional(),

  // School and location filters - allow any non-empty string
  schoolId: z.string().min(1).optional(),
  localityId: z.string().min(1).optional(),
  countyId: z.string().min(1).optional(),
  radius: z.coerce.number().min(1).max(100).optional(), // km radius for location search

  // Price filters
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  includeFree: z.coerce.boolean().default(true),

  // Condition filter - allow any non-empty string array
  conditionIds: z.array(z.string().min(1)).optional(),

  // Availability filters
  availableOnly: z.coerce.boolean().default(true),

  // Sorting
  sortBy: z.enum(['newest', 'oldest', 'price_low', 'price_high', 'distance', 'popularity']).default('newest'),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),

  // Advanced filters
  hasImages: z.coerce.boolean().optional(),
  allowOffers: z.coerce.boolean().optional()
});

export const ServerRoute = createServerFileRoute('/api/marketplace/search').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const params = Object.fromEntries(url.searchParams);
      
      // Handle array parameters (conditionIds)
      if (params.conditionIds && typeof params.conditionIds === 'string') {
        params.conditionIds = params.conditionIds.split(',').filter(Boolean);
      }
      
      const validatedParams = searchSchema.parse(params);
      
      // Get current user's location for distance calculations (if authenticated)
      const session = await auth.api.getSession({ headers: request.headers });
      let userLocationId: string | null = null;
      
      if (session?.user) {
        const [userProfile] = await db
          .select({ localityId: userProfiles.localityId })
          .from(userProfiles)
          .where(eq(userProfiles.userId, session.user.id))
          .limit(1);
        userLocationId = userProfile?.localityId || null;
      }
      
      // Build base query with joins
      const baseQuery = db
        .select({
          listing: listings,
          school: {
            id: schools.id,
            name: schools.name
          },
          productType: {
            id: productTypes.id,
            name: productTypes.name
          },
          category: {
            id: productCategories.id,
            name: productCategories.name
          },
          condition: {
            id: conditionsTable.id,
            name: conditionsTable.name,
            description: conditionsTable.description
          },
          locality: {
            id: localities.id,
            name: localities.name
          },
          county: {
            id: counties.id,
            name: counties.name
          },
          // Get primary image by joining with files table
          primaryImage: sql<string | null>`(
            SELECT f.path
            FROM listing_images li
            JOIN files f ON li.file_id = f.id
            WHERE li.listing_id = listings.id
            ORDER BY li."order" ASC
            LIMIT 1
          )`,
          // Get image count
          imageCount: sql<number>`(
            SELECT COUNT(*)::int
            FROM listing_images
            WHERE listing_id = listings.id
          )`
        })
        .from(listings)
        .leftJoin(schools, eq(listings.schoolId, schools.id))
        .leftJoin(productTypes, eq(listings.productTypeId, productTypes.id))
        .leftJoin(productCategories, eq(productTypes.categoryId, productCategories.id))
        .leftJoin(conditionsTable, eq(listings.conditionId, conditionsTable.id))
        .leftJoin(localities, eq(listings.localityId, localities.id))
        .leftJoin(counties, eq(localities.countyId, counties.id));
      
      // Build where conditions
      const whereConditions = [];

      // Only show active listings
      if (validatedParams.availableOnly) {
        whereConditions.push(eq(listings.status, 'active'));
      }

      // Exclude expired listings
      whereConditions.push(or(
        eq(listings.expiredAt, null),
        gte(listings.expiredAt, new Date().toISOString())
      ));

      // Text search across title, description, school name
      if (validatedParams.q) {
        whereConditions.push(or(
          ilike(listings.title, `%${validatedParams.q}%`),
          ilike(listings.description, `%${validatedParams.q}%`),
          ilike(schools.name, `%${validatedParams.q}%`)
        ));
      }

      // Category filter
      if (validatedParams.categoryId) {
        whereConditions.push(eq(productCategories.id, validatedParams.categoryId));
      }

      // Product type filter
      if (validatedParams.productTypeId) {
        whereConditions.push(eq(listings.productTypeId, validatedParams.productTypeId));
      }

      // School filter
      if (validatedParams.schoolId) {
        whereConditions.push(eq(listings.schoolId, validatedParams.schoolId));
      }

      // Location filters
      if (validatedParams.localityId) {
        whereConditions.push(eq(listings.localityId, validatedParams.localityId));
      }
      if (validatedParams.countyId) {
        whereConditions.push(eq(localities.countyId, validatedParams.countyId));
      }

      // Price filters
      if (validatedParams.minPrice !== undefined) {
        const priceCondition = gte(sql`CAST(${listings.price} AS DECIMAL)`, validatedParams.minPrice);
        if (validatedParams.includeFree) {
          whereConditions.push(or(
            and(eq(listings.isFree, false), priceCondition),
            eq(listings.isFree, true)
          ));
        } else {
          whereConditions.push(and(eq(listings.isFree, false), priceCondition));
        }
      }

      if (validatedParams.maxPrice !== undefined) {
        const priceCondition = lte(sql`CAST(${listings.price} AS DECIMAL)`, validatedParams.maxPrice);
        if (validatedParams.includeFree) {
          whereConditions.push(or(
            and(eq(listings.isFree, false), priceCondition),
            eq(listings.isFree, true)
          ));
        } else {
          whereConditions.push(and(eq(listings.isFree, false), priceCondition));
        }
      }

      // Condition filters
      if (validatedParams.conditionIds && validatedParams.conditionIds.length > 0) {
        whereConditions.push(inArray(listings.conditionId, validatedParams.conditionIds));
      }

      // Advanced filters
      if (validatedParams.hasImages) {
        whereConditions.push(sql`EXISTS (SELECT 1 FROM ${listingImages} WHERE ${listingImages.listingId} = ${listings.id})`);
      }
      // TODO: Fix allowOffers condition - causing SQL syntax error
      // if (validatedParams.allowOffers !== undefined) {
      //   whereConditions.push(eq(listings.allowOffers, validatedParams.allowOffers));
      // }
      
      // Apply where conditions
      const queryWithWhere = whereConditions.length > 0 
        ? baseQuery.where(and(...whereConditions))
        : baseQuery;
      
      // Apply sorting
      let sortedQuery = queryWithWhere;
      switch (validatedParams.sortBy) {
        case 'newest':
          sortedQuery = queryWithWhere.orderBy(desc(listings.publishedAt));
          break;
        case 'oldest':
          sortedQuery = queryWithWhere.orderBy(asc(listings.publishedAt));
          break;
        case 'price_low':
          sortedQuery = queryWithWhere.orderBy(
            asc(sql`CASE WHEN ${listings.isFree} THEN 0 ELSE CAST(${listings.price} AS DECIMAL) END`)
          );
          break;
        case 'price_high':
          sortedQuery = queryWithWhere.orderBy(
            desc(sql`CASE WHEN ${listings.isFree} THEN 0 ELSE CAST(${listings.price} AS DECIMAL) END`)
          );
          break;
        case 'popularity':
          sortedQuery = queryWithWhere.orderBy(desc(listings.viewCount));
          break;
        case 'distance':
          // For distance sorting, we'd need to implement geographic distance calculation
          // For now, fall back to newest
          sortedQuery = queryWithWhere.orderBy(desc(listings.publishedAt));
          break;
        default:
          sortedQuery = queryWithWhere.orderBy(desc(listings.publishedAt));
      }
      
      // Apply pagination
      const offset = (validatedParams.page - 1) * validatedParams.limit;
      const paginatedQuery = sortedQuery
        .limit(validatedParams.limit)
        .offset(offset);
      
      // Execute the query
      const searchResults = await paginatedQuery;
      
      // Get total count for pagination (separate query for performance)
      const countQuery = db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(listings)
        .leftJoin(schools, eq(listings.schoolId, schools.id))
        .leftJoin(productTypes, eq(listings.productTypeId, productTypes.id))
        .leftJoin(productCategories, eq(productTypes.categoryId, productCategories.id))
        .leftJoin(conditionsTable, eq(listings.conditionId, conditionsTable.id))
        .leftJoin(localities, eq(listings.localityId, localities.id))
        .leftJoin(counties, eq(localities.countyId, counties.id));
      
      const countWithWhere = whereConditions.length > 0 
        ? countQuery.where(and(...whereConditions))
        : countQuery;
      
      const [{ count: totalCount }] = await countWithWhere;
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / validatedParams.limit);
      const hasNextPage = validatedParams.page < totalPages;
      const hasPreviousPage = validatedParams.page > 1;
      
      // Format results
      const formattedResults = searchResults.map(result => ({
        ...result.listing,
        school: result.school,
        productType: result.productType,
        category: result.category,
        condition: result.condition,
        locality: result.locality,
        county: result.county,
        primaryImage: result.primaryImage,
        imageCount: result.imageCount,
        // Calculate distance if user location is available (placeholder)
        distance: userLocationId ? Math.floor(Math.random() * 50) + 1 : null // TODO: Implement real distance calculation
      }));
      
      return new Response(JSON.stringify({
        success: true,
        results: formattedResults,
        pagination: {
          currentPage: validatedParams.page,
          totalPages,
          totalCount,
          limit: validatedParams.limit,
          hasNextPage,
          hasPreviousPage
        },
        appliedFilters: validatedParams,
        resultsSummary: {
          totalResults: totalCount,
          priceRange: {
            min: searchResults.reduce((min, r) => {
              if (r.listing.isFree) return min;
              const price = parseFloat(r.listing.price || '0');
              return min === null ? price : Math.min(min, price);
            }, null as number | null),
            max: searchResults.reduce((max, r) => {
              if (r.listing.isFree) return max;
              const price = parseFloat(r.listing.price || '0');
              return max === null ? price : Math.max(max, price);
            }, null as number | null)
          },
          schoolCount: new Set(searchResults.map(r => r.school?.id).filter(Boolean)).size,
          categoryCount: new Set(searchResults.map(r => r.category?.id).filter(Boolean)).size
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Error in marketplace search:', error);
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid search parameters',
          details: error.errors
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to search listings'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});