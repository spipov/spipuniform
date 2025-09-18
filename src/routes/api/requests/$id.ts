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
  counties
} from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const updateRequestSchema = z.object({
  productTypeId: z.string().uuid().optional(),
  schoolId: z.string().uuid().optional(),
  size: z.string().optional(),
  conditionPreference: z.string().optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  maxPrice: z.coerce.number().min(0).max(10000).optional(),
  status: z.enum(['open', 'fulfilled', 'closed']).optional()
});

export const ServerRoute = createServerFileRoute('/api/requests/$id').methods({
  GET: async ({ params, request }) => {
    try {
      const requestId = params.id;
      
      if (!requestId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get session to determine if user is owner
      const session = await auth.api.getSession({ headers: request.headers });
      const currentUserId = session?.user?.id;

      // Get request with related data
      const [requestData] = await db
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
          }
        })
        .from(requests)
        .leftJoin(schools, eq(requests.schoolId, schools.id))
        .leftJoin(productTypes, eq(requests.productTypeId, productTypes.id))
        .leftJoin(productCategories, eq(productTypes.categoryId, productCategories.id))
        .leftJoin(localities, eq(requests.localityId, localities.id))
        .leftJoin(counties, eq(localities.countyId, counties.id))
        .where(eq(requests.id, requestId))
        .limit(1);

      if (!requestData) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if request is visible (public for open requests, private for closed/fulfilled)
      const isOwner = currentUserId === requestData.request.userId;
      if (!isOwner && requestData.request.status !== 'open') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get potential matches (if user is owner)
      let potentialMatches = [];
      if (isOwner) {
        potentialMatches = await db
          .select({
            match: matches,
            listing: {
              id: listings.id,
              title: listings.title,
              price: listings.price,
              isFree: listings.isFree,
              status: listings.status,
              createdAt: listings.createdAt
            },
            listingSchool: {
              id: schools.id,
              name: schools.name
            }
          })
          .from(matches)
          .leftJoin(listings, eq(matches.listingId, listings.id))
          .leftJoin(schools, eq(listings.schoolId, schools.id))
          .where(eq(matches.requestId, requestId))
          .orderBy(desc(matches.matchedAt));
      }

      // Format response
      const requestWithDetails = {
        ...requestData.request,
        school: requestData.school,
        productType: requestData.productType,
        category: requestData.category,
        locality: requestData.locality,
        county: requestData.county,
        // Hide sensitive info if not owner
        userId: isOwner ? requestData.request.userId : null,
        potentialMatches: isOwner ? potentialMatches.map(m => ({
          id: m.match.id,
          matchedAt: m.match.matchedAt,
          notified: m.match.notified,
          contactExchanged: m.match.contactExchanged,
          listing: {
            ...m.listing,
            school: m.listingSchool
          }
        })) : []
      };
      
      return new Response(JSON.stringify({
        success: true,
        request: requestWithDetails,
        isOwner
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching request:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch request'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  PUT: async ({ params, request }) => {
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
      const requestId = params.id;

      if (!requestId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verify ownership
      const [existingRequest] = await db
        .select()
        .from(requests)
        .where(and(
          eq(requests.id, requestId),
          eq(requests.userId, userId)
        ))
        .limit(1);

      if (!existingRequest) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request not found or access denied'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const validatedData = updateRequestSchema.parse(body);
      
      // Build update object
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      if (validatedData.productTypeId) updateData.productTypeId = validatedData.productTypeId;
      if (validatedData.schoolId !== undefined) updateData.schoolId = validatedData.schoolId;
      if (validatedData.size !== undefined) updateData.size = validatedData.size;
      if (validatedData.conditionPreference !== undefined) updateData.conditionPreference = validatedData.conditionPreference;
      if (validatedData.description !== undefined) updateData.description = validatedData.description;
      if (validatedData.maxPrice !== undefined) updateData.maxPrice = validatedData.maxPrice?.toString();
      if (validatedData.status) updateData.status = validatedData.status;
      
      // Update the request
      const [updatedRequest] = await db
        .update(requests)
        .set(updateData)
        .where(eq(requests.id, requestId))
        .returning();
      
      return new Response(JSON.stringify({
        success: true,
        request: updatedRequest
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error updating request:', error);
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
        error: 'Failed to update request'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  DELETE: async ({ params, request }) => {
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
      const requestId = params.id;

      if (!requestId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Delete the request (this will cascade to matches)
      const [deletedRequest] = await db
        .delete(requests)
        .where(and(
          eq(requests.id, requestId),
          eq(requests.userId, userId)
        ))
        .returning();

      if (!deletedRequest) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request not found or access denied'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Request deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error deleting request:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete request'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});