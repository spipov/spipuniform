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
  userProfiles
} from '@/db/schema';
import { eq, and, or, desc, asc, sql, ilike, gte, lte, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Validation schema for search parameters
const searchSchema = z.object({
  // Text search
  q: z.string().optional(),
  
  // Category and product type filters
  categoryId: z.string().uuid().optional(),
  productTypeId: z.string().uuid().optional(),
  
  // School and location filters
  schoolId: z.string().uuid().optional(),
  localityId: z.string().uuid().optional(),
  countyId: z.string().uuid().optional(),
  radius: z.coerce.number().min(1).max(100).optional(), // km radius for location search
  
  // Price filters
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  includeFree: z.coerce.boolean().default(true),
  
  // Condition filter
  conditionIds: z.array(z.string().uuid()).optional(),
  
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
          // Get primary image
          primaryImage: sql<string | null>`(
            SELECT ${listingImages.filePath} 
            FROM ${listingImages} 
            WHERE ${listingImages.listingId} = ${listings.id} 
            ORDER BY ${listingImages.order} ASC 
            LIMIT 1
          )`,
          // Get image count
          imageCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${listingImages} 
            WHERE ${listingImages.listingId} = ${listings.id}
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
      const whereConditions = [
        // Only show active listings
        validatedParams.availableOnly ? eq(listings.status, 'active') : undefined,
        
        // Exclude expired listings
        or(
          eq(listings.expiredAt, null),
          gte(listings.expiredAt, new Date().toISOString())
        ),
        
        // Text search across title, description, school name
        validatedParams.q ? or(
          ilike(listings.title, `%${validatedParams.q}%`),
          ilike(listings.description, `%${validatedParams.q}%`),
          ilike(schools.name, `%${validatedParams.q}%`)
        ) : undefined,
        
        // Category filter
        validatedParams.categoryId ? eq(productCategories.id, validatedParams.categoryId) : undefined,
        
        // Product type filter
        validatedParams.productTypeId ? eq(listings.productTypeId, validatedParams.productTypeId) : undefined,
        
        // School filter
        validatedParams.schoolId ? eq(listings.schoolId, validatedParams.schoolId) : undefined,
        
        // Location filters
        validatedParams.localityId ? eq(listings.localityId, validatedParams.localityId) : undefined,
        validatedParams.countyId ? eq(localities.countyId, validatedParams.countyId) : undefined,
        
        // Price filters
        validatedParams.minPrice !== undefined ? or(
          and(eq(listings.isFree, false), gte(sql`CAST(${listings.price} AS DECIMAL)`, validatedParams.minPrice)),
          validatedParams.includeFree ? eq(listings.isFree, true) : sql`FALSE`
        ) : undefined,
        
        validatedParams.maxPrice !== undefined ? or(
          and(eq(listings.isFree, false), lte(sql`CAST(${listings.price} AS DECIMAL)`, validatedParams.maxPrice)),
          validatedParams.includeFree ? eq(listings.isFree, true) : sql`FALSE`
        ) : undefined,
        
        // Condition filters
        validatedParams.conditionIds && validatedParams.conditionIds.length > 0 
          ? inArray(listings.conditionId, validatedParams.conditionIds) 
          : undefined,
          
        // Advanced filters
        validatedParams.hasImages ? sql`EXISTS (SELECT 1 FROM ${listingImages} WHERE ${listingImages.listingId} = ${listings.id})` : undefined,
        validatedParams.allowOffers !== undefined ? eq(listings.allowOffers, validatedParams.allowOffers) : undefined
      ].filter(Boolean);
      
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