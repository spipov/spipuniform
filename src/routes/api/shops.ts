import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { shops, localities, schools } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Validation schemas
const createShopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100, 'Shop name must be less than 100 characters'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  localityId: z.string().uuid('Valid locality is required')
});

const updateShopSchema = createShopSchema.partial();

export const ServerRoute = createServerFileRoute('/api/shops').methods({
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

      // Get user's shops
      const userShops = await db
        .select({
          id: shops.id,
          name: shops.name,
          description: shops.description,
          website: shops.website,
          contactEmail: shops.contactEmail,
          phone: shops.phone,
          address: shops.address,
          localityId: shops.localityId,
          membershipStatus: shops.membershipStatus,
          isVerified: shops.isVerified,
          createdAt: shops.createdAt,
          updatedAt: shops.updatedAt
        })
        .from(shops)
        .where(eq(shops.userId, userId));
      
      return new Response(JSON.stringify({
        success: true,
        shops: userShops
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching shops:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch shops'
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
      const validatedData = createShopSchema.parse(body);
      
      // Check if user already has a shop (limit to 1 shop per user for now)
      const [existingShop] = await db
        .select()
        .from(shops)
        .where(eq(shops.userId, userId))
        .limit(1);
      
      if (existingShop) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You can only register one shop per account. Please contact support if you need multiple shops.'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Validate that the locality exists
      const [locality] = await db
        .select()
        .from(localities)
        .where(eq(localities.id, validatedData.localityId))
        .limit(1);
        
      if (!locality) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid locality selected'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // School validation removed for now since supportedSchools field doesn't exist in schema
      
      const [newShop] = await db
        .insert(shops)
        .values({
          userId,
          name: validatedData.name,
          description: validatedData.description,
          website: validatedData.website || null,
          contactEmail: validatedData.contactEmail,
          phone: validatedData.phone,
          address: validatedData.address,
          localityId: validatedData.localityId,
          membershipStatus: 'pending', // New shops start as pending approval
          isVerified: false
        })
        .returning();
      
      return new Response(JSON.stringify({
        success: true,
        shop: newShop,
        message: 'Shop registered successfully! Your shop is pending approval.'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error creating shop:', error);
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
        error: 'Failed to create shop'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});