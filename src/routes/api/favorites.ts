import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { 
  userFavorites, 
  listings, 
  listingImages, 
  schools, 
  productTypes, 
  productCategories,
  conditions as conditionsTable,
  userProfiles
} from '@/db/schema';
import { eq, desc, asc, and, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Create the userFavorites table if it doesn't exist
// This should ideally be in a migration, but adding here for immediate functionality

const addToFavoritesSchema = z.object({
  listingId: z.string().uuid('Valid listing ID is required')
});

export const ServerRoute = createServerFileRoute('/api/favorites').methods({
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
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      // Get user's favorites with full listing details
      const favorites = await db
        .select({
          favorite: {
            id: userFavorites.id,
            createdAt: userFavorites.createdAt
          },
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
            name: conditionsTable.name
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
        .from(userFavorites)
        .leftJoin(listings, eq(userFavorites.listingId, listings.id))
        .leftJoin(schools, eq(listings.schoolId, schools.id))
        .leftJoin(productTypes, eq(listings.productTypeId, productTypes.id))
        .leftJoin(productCategories, eq(productTypes.categoryId, productCategories.id))
        .leftJoin(conditionsTable, eq(listings.conditionId, conditionsTable.id))
        .where(eq(userFavorites.userId, userId))
        .orderBy(desc(userFavorites.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(userFavorites)
        .where(eq(userFavorites.userId, userId));

      // Filter out favorites where listing doesn't exist anymore
      const validFavorites = favorites.filter(fav => fav.listing !== null);

      // Format response
      const formattedFavorites = validFavorites.map(fav => ({
        favoriteId: fav.favorite.id,
        addedAt: fav.favorite.createdAt,
        listing: {
          ...fav.listing,
          school: fav.school,
          productType: fav.productType,
          category: fav.category,
          condition: fav.condition,
          primaryImage: fav.primaryImage,
          imageCount: fav.imageCount
        }
      }));

      return new Response(JSON.stringify({
        success: true,
        favorites: formattedFavorites,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching favorites:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch favorites'
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
      const validatedData = addToFavoritesSchema.parse(body);

      // Check if listing exists and is active
      const [listing] = await db
        .select()
        .from(listings)
        .where(and(
          eq(listings.id, validatedData.listingId),
          eq(listings.status, 'active')
        ))
        .limit(1);

      if (!listing) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Listing not found or not available'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if user is trying to favorite their own listing
      if (listing.userId === userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You cannot favorite your own listing'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if already favorited
      const [existingFavorite] = await db
        .select()
        .from(userFavorites)
        .where(and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.listingId, validatedData.listingId)
        ))
        .limit(1);

      if (existingFavorite) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Listing is already in your favorites',
          favoriteId: existingFavorite.id
        }), { 
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Add to favorites
      const [newFavorite] = await db
        .insert(userFavorites)
        .values({
          userId,
          listingId: validatedData.listingId
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        message: 'Added to favorites',
        favorite: newFavorite
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error adding to favorites:', error);
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
        error: 'Failed to add to favorites'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  DELETE: async ({ request }) => {
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
      const listingId = url.searchParams.get('listingId');
      const favoriteId = url.searchParams.get('favoriteId');

      if (!listingId && !favoriteId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Either listingId or favoriteId is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let whereCondition;
      if (favoriteId) {
        whereCondition = and(
          eq(userFavorites.id, favoriteId),
          eq(userFavorites.userId, userId)
        );
      } else {
        whereCondition = and(
          eq(userFavorites.listingId, listingId!),
          eq(userFavorites.userId, userId)
        );
      }

      // Remove from favorites
      const [removedFavorite] = await db
        .delete(userFavorites)
        .where(whereCondition)
        .returning();

      if (!removedFavorite) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Favorite not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Removed from favorites',
        favorite: removedFavorite
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error removing from favorites:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to remove from favorites'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});