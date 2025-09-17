import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { listings, listingImages, listingAttributeValues, userProfiles, schools, productTypes, conditions as conditionsTable } from '@/db/schema';
import { eq, desc, and, or, asc } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Validation schema for creating listings
const createListingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  schoolId: z.string().uuid('Valid school is required'),
  categoryId: z.string().uuid('Category is required'),
  productTypeId: z.string().uuid('Product type is required'),
  conditionId: z.string().uuid('Condition is required'),
  
  // Pricing
  price: z.number().positive().optional().nullable(),
  isFree: z.boolean().default(false),
  
  // Attributes
  attributes: z.record(z.string()).optional().default({}),
  
  // Images
  images: z.array(z.object({
    fileId: z.string().uuid(),
    altText: z.string().optional(),
    order: z.number().default(0)
  })).min(1, 'At least one image is required'),
  
  // Status
  status: z.enum(['draft', 'pending', 'active']).default('active'),
  
  // Advanced options
  allowOffers: z.boolean().default(true),
  autoRenew: z.boolean().default(false)
});

const updateListingSchema = createListingSchema.partial();

export const ServerRoute = createServerFileRoute('/api/listings').methods({
  GET: async ({ request }) => {
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
      const url = new URL(request.url);
      
      // Query parameters
      const status = url.searchParams.get('status');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const includeInactive = url.searchParams.get('includeInactive') === 'true';

      // Build query conditions
      const conditions = [eq(listings.userId, userId)];
      
      if (status) {
        conditions.push(eq(listings.status, status as any));
      }
      
      if (!includeInactive) {
        conditions.push(or(
          eq(listings.status, 'active'),
          eq(listings.status, 'pending')
        ));
      }

      // Get user's listings with related data
      const userListings = await db
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
        .where(and(...conditions))
        .orderBy(desc(listings.createdAt))
        .limit(limit)
        .offset(offset);

      // Get images for these listings
      const listingIds = userListings.map(l => l.listing.id);
      const images = listingIds.length > 0 ? await db
        .select()
        .from(listingImages)
        .where(eq(listingImages.listingId, listingIds[0])) // This needs to be improved for multiple listings
        .orderBy(asc(listingImages.order)) : [];

      // Format response
      const listingsWithDetails = userListings.map(item => ({
        ...item.listing,
        school: item.school,
        productType: item.productType,
        condition: item.condition,
        images: images.filter(img => img.listingId === item.listing.id)
      }));
      
      return new Response(JSON.stringify({
        success: true,
        listings: listingsWithDetails,
        pagination: {
          limit,
          offset,
          total: userListings.length // This should be a separate count query for true pagination
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching listings:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch listings'
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
      const validatedData = createListingSchema.parse(body);

      // Get user's profile to get their locality
      const [userProfile] = await db
        .select({ localityId: userProfiles.localityId })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (!userProfile || !userProfile.localityId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Please complete your profile with location information before creating listings'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create the listing
      const [newListing] = await db
        .insert(listings)
        .values({
          userId,
          title: validatedData.title,
          description: validatedData.description,
          schoolId: validatedData.schoolId,
          categoryId: validatedData.categoryId,
          productTypeId: validatedData.productTypeId,
          conditionId: validatedData.conditionId,
          price: validatedData.isFree ? null : validatedData.price?.toString(),
          isFree: validatedData.isFree,
          localityId: userProfile.localityId,
          status: validatedData.status,
          publishedAt: validatedData.status === 'active' ? new Date().toISOString() : null,
          // Set expiration date (e.g., 60 days from now)
          expiredAt: validatedData.status === 'active' 
            ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() 
            : null
        })
        .returning();

      // Add images
      if (validatedData.images.length > 0) {
        const imageData = validatedData.images.map(img => ({
          listingId: newListing.id,
          fileId: img.fileId,
          altText: img.altText || `Image for ${validatedData.title}`,
          order: img.order
        }));

        await db.insert(listingImages).values(imageData);
      }

      // Add attribute values
      if (Object.keys(validatedData.attributes).length > 0) {
        const attributeData = Object.entries(validatedData.attributes)
          .filter(([_, value]) => value && value.trim())
          .map(([slug, value]) => ({
            listingId: newListing.id,
            // We need to get the attribute ID from the slug - this is a simplified version
            attributeId: '00000000-0000-0000-0000-000000000000', // This should be looked up
            customValue: value
          }));

        if (attributeData.length > 0) {
          // Note: This needs to be improved to properly map slug to attributeId
          console.log('Attributes to save:', attributeData);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        listing: newListing,
        message: validatedData.status === 'draft' 
          ? 'Listing saved as draft' 
          : validatedData.status === 'pending'
          ? 'Listing submitted for review'
          : 'Listing published successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error creating listing:', error);
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
        error: 'Failed to create listing'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});