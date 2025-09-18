import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { 
  requests, 
  matches,
  listings,
  schools, 
  productTypes, 
  productCategories,
  conditions as conditionsTable,
  localities,
  counties,
  userProfiles
} from '@/db/schema';
import { eq, desc, asc, and, or, sql, gte, lte, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Validation schemas
const createRequestSchema = z.object({
  productTypeId: z.string().uuid('Valid product type is required'),
  schoolId: z.string().uuid().optional(),
  size: z.string().optional(),
  conditionPreference: z.string().optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  maxPrice: z.coerce.number().min(0).max(10000).optional(),
});

const updateRequestSchema = createRequestSchema.partial().extend({
  status: z.enum(['open', 'fulfilled', 'closed']).optional()
});

const searchRequestsSchema = z.object({
  // Text search
  q: z.string().optional(),
  
  // Filters
  productTypeId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  schoolId: z.string().uuid().optional(),
  localityId: z.string().uuid().optional(),
  countyId: z.string().uuid().optional(),
  status: z.enum(['open', 'fulfilled', 'closed']).optional(),
  
  // Price range
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  
  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  
  // Sorting
  sortBy: z.enum(['newest', 'oldest', 'price_low', 'price_high']).default('newest'),
  
  // Include user's own requests
  includeOwn: z.coerce.boolean().default(false)
});

export const ServerRoute = createServerFileRoute('/api/requests').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const params = Object.fromEntries(url.searchParams);
      const validatedParams = searchRequestsSchema.parse(params);
      
      // Get current user (optional for public browsing)
      const session = await auth.api.getSession({ headers: request.headers });
      const currentUserId = session?.user?.id;
      
      // Build base query with joins
      const baseQuery = db
        .select({
          request: requests,
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
          locality: {
            id: localities.id,
            name: localities.name
          },
          county: {
            id: counties.id,
            name: counties.name
          },
          // Count matches for this request
          matchCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${matches} 
            WHERE ${matches.requestId} = ${requests.id}
          )`
        })
        .from(requests)
        .leftJoin(schools, eq(requests.schoolId, schools.id))
        .leftJoin(productTypes, eq(requests.productTypeId, productTypes.id))
        .leftJoin(productCategories, eq(productTypes.categoryId, productCategories.id))
        .leftJoin(localities, eq(requests.localityId, localities.id))
        .leftJoin(counties, eq(localities.countyId, counties.id));
      
      // Build where conditions
      const whereConditions = [
        // Only show open requests by default (unless filtering by status)
        validatedParams.status ? eq(requests.status, validatedParams.status) : eq(requests.status, 'open'),
        
        // Exclude user's own requests unless specifically requested
        currentUserId && !validatedParams.includeOwn ? sql`${requests.userId} != ${currentUserId}` : undefined,
        
        // Text search
        validatedParams.q ? or(
          sql`${requests.description} ILIKE ${`%${validatedParams.q}%`}`,
          sql`${schools.name} ILIKE ${`%${validatedParams.q}%`}`,
          sql`${productTypes.name} ILIKE ${`%${validatedParams.q}%`}`
        ) : undefined,
        
        // Filters
        validatedParams.productTypeId ? eq(requests.productTypeId, validatedParams.productTypeId) : undefined,
        validatedParams.categoryId ? eq(productCategories.id, validatedParams.categoryId) : undefined,
        validatedParams.schoolId ? eq(requests.schoolId, validatedParams.schoolId) : undefined,
        validatedParams.localityId ? eq(requests.localityId, validatedParams.localityId) : undefined,
        validatedParams.countyId ? eq(localities.countyId, validatedParams.countyId) : undefined,
        
        // Price range filters
        validatedParams.minPrice !== undefined ? gte(requests.maxPrice, validatedParams.minPrice) : undefined,
        validatedParams.maxPrice !== undefined ? lte(requests.maxPrice, validatedParams.maxPrice) : undefined
      ].filter(Boolean);
      
      // Apply where conditions
      const queryWithWhere = whereConditions.length > 0 
        ? baseQuery.where(and(...whereConditions))
        : baseQuery;
      
      // Apply sorting
      let sortedQuery = queryWithWhere;
      switch (validatedParams.sortBy) {
        case 'newest':
          sortedQuery = queryWithWhere.orderBy(desc(requests.createdAt));
          break;
        case 'oldest':
          sortedQuery = queryWithWhere.orderBy(asc(requests.createdAt));
          break;
        case 'price_low':
          sortedQuery = queryWithWhere.orderBy(asc(requests.maxPrice));
          break;
        case 'price_high':
          sortedQuery = queryWithWhere.orderBy(desc(requests.maxPrice));
          break;
        default:
          sortedQuery = queryWithWhere.orderBy(desc(requests.createdAt));
      }
      
      // Apply pagination
      const offset = (validatedParams.page - 1) * validatedParams.limit;
      const paginatedQuery = sortedQuery
        .limit(validatedParams.limit)
        .offset(offset);
      
      // Execute the query
      const searchResults = await paginatedQuery;
      
      // Get total count for pagination
      const countQuery = db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(requests)
        .leftJoin(schools, eq(requests.schoolId, schools.id))
        .leftJoin(productTypes, eq(requests.productTypeId, productTypes.id))
        .leftJoin(productCategories, eq(productTypes.categoryId, productCategories.id))
        .leftJoin(localities, eq(requests.localityId, localities.id))
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
        ...result.request,
        school: result.school,
        productType: result.productType,
        category: result.category,
        locality: result.locality,
        county: result.county,
        matchCount: result.matchCount,
        // Hide sensitive info if not the requester
        userId: currentUserId === result.request.userId ? result.request.userId : null
      }));
      
      return new Response(JSON.stringify({
        success: true,
        requests: formattedResults,
        pagination: {
          currentPage: validatedParams.page,
          totalPages,
          totalCount,
          limit: validatedParams.limit,
          hasNextPage,
          hasPreviousPage
        },
        appliedFilters: validatedParams
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Error searching requests:', error);
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
        error: 'Failed to search requests'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  POST: async ({ request }) => {
    try {
      // Validate session using Better Auth
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Authentication required'
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const userId = session.user.id;
      const body = await request.json();
      const validatedData = createRequestSchema.parse(body);

      // Get user's profile to get their locality
      const [userProfile] = await db
        .select({ localityId: userProfiles.localityId })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (!userProfile || !userProfile.localityId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Please complete your profile with location information before creating requests'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verify that the product type exists
      const [productType] = await db
        .select()
        .from(productTypes)
        .where(eq(productTypes.id, validatedData.productTypeId))
        .limit(1);

      if (!productType) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Product type not found'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verify school exists if provided
      if (validatedData.schoolId) {
        const [school] = await db
          .select()
          .from(schools)
          .where(eq(schools.id, validatedData.schoolId))
          .limit(1);

        if (!school) {
          return new Response(JSON.stringify({
            success: false,
            error: 'School not found'
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Create the request
      const [newRequest] = await db
        .insert(requests)
        .values({
          userId,
          productTypeId: validatedData.productTypeId,
          schoolId: validatedData.schoolId,
          size: validatedData.size,
          conditionPreference: validatedData.conditionPreference,
          description: validatedData.description,
          maxPrice: validatedData.maxPrice?.toString(),
          localityId: userProfile.localityId,
          status: 'open'
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        request: newRequest,
        message: 'Request created successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error creating request:', error);
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid data',
          details: error.errors
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create request'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});