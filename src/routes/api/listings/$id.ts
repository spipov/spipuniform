import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { listings, listingImages, listingAttributeValues, schools, productTypes, conditions as conditionsTable } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const ServerRoute = createServerFileRoute('/api/listings/$id').methods({
  GET: async ({ params, request }) => {
    try {
      const listingId = params.id;
      
      if (!listingId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Listing ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get session to determine if user is owner
      const session = await auth.api.getSession({ headers: request.headers });
      const currentUserId = session?.user?.id;

      // Get listing with related data
      const [listingData] = await db
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
          condition: {
            id: conditionsTable.id,
            name: conditionsTable.name
          }
        })
        .from(listings)
        .leftJoin(schools, eq(listings.schoolId, schools.id))
        .leftJoin(productTypes, eq(listings.productTypeId, productTypes.id))
        .leftJoin(conditionsTable, eq(listings.conditionId, conditionsTable.id))
        .where(eq(listings.id, listingId))
        .limit(1);

      if (!listingData) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Listing not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if listing is active or user is owner
      const isOwner = currentUserId === listingData.listing.userId;
      if (!isOwner && listingData.listing.status !== 'active') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Listing not available'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get images for this listing
      const images = await db
        .select()
        .from(listingImages)
        .where(eq(listingImages.listingId, listingId))
        .orderBy(asc(listingImages.order));

      // Get attribute values for this listing
      const attributeValues = await db
        .select()
        .from(listingAttributeValues)
        .where(eq(listingAttributeValues.listingId, listingId));

      // Increment view count if not owner
      if (!isOwner && session) {
        await db
          .update(listings)
          .set({
            viewCount: (listingData.listing.viewCount || 0) + 1,
            updatedAt: new Date().toISOString()
          })
          .where(eq(listings.id, listingId));
      }

      // Format response
      const listingWithDetails = {
        ...listingData.listing,
        school: listingData.school,
        productType: listingData.productType,
        condition: listingData.condition,
        images: images.map(img => ({
          id: img.id,
          url: img.filePath || img.fileId, // Use filePath if available, fallback to fileId
          altText: img.altText,
          order: img.order
        })),
        attributes: attributeValues
      };
      
      return new Response(JSON.stringify({
        success: true,
        listing: listingWithDetails,
        isOwner
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching listing:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch listing'
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
      const listingId = params.id;

      if (!listingId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Listing ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verify ownership
      const [existingListing] = await db
        .select()
        .from(listings)
        .where(and(
          eq(listings.id, listingId),
          eq(listings.userId, userId)
        ))
        .limit(1);

      if (!existingListing) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Listing not found or access denied'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      
      // Update the listing
      const [updatedListing] = await db
        .update(listings)
        .set({
          ...body,
          updatedAt: new Date().toISOString()
        })
        .where(eq(listings.id, listingId))
        .returning();
      
      return new Response(JSON.stringify({
        success: true,
        listing: updatedListing
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error updating listing:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update listing'
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
      const listingId = params.id;

      if (!listingId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Listing ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Delete the listing (this will cascade to images and attributes)
      const [deletedListing] = await db
        .delete(listings)
        .where(and(
          eq(listings.id, listingId),
          eq(listings.userId, userId)
        ))
        .returning();

      if (!deletedListing) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Listing not found or access denied'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Listing deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error deleting listing:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete listing'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});