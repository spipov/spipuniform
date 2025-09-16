import { createServerFileRoute } from '@tanstack/react-start/server'
import { db } from '@/db'
import { shops, shopProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'

const updateShopProfileSchema = z.object({
  businessRegistrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  openingHours: z.record(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  socialMedia: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  deliveryOptions: z
    .object({
      pickup: z.boolean().optional(),
      delivery: z.boolean().optional(),
      postal: z.boolean().optional(),
      radius: z.string().optional(),
    })
    .optional(),
  paymentMethods: z.array(z.string()).optional(),
})

export const ServerRoute = createServerFileRoute('/api/profiles/shop').methods({
  GET: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers })
      if (!session) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const userId = session.user.id

      const [shop] = await db.select().from(shops).where(eq(shops.userId, userId)).limit(1)
      if (!shop) {
        // No shop registered yet for this user. Return success with nulls so the UI can show an empty state
        return new Response(
          JSON.stringify({ success: true, shop: null, shopProfile: null }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      let [profile] = await db
        .select()
        .from(shopProfiles)
        .where(eq(shopProfiles.shopId, shop.id))
        .limit(1)

      if (!profile) {
        // Create a default profile for the shop if it doesn't exist yet
        ;[profile] = await db
          .insert(shopProfiles)
          .values({ shopId: shop.id })
          .returning()
      }

      return new Response(
        JSON.stringify({ success: true, shop, shopProfile: profile }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    } catch (error) {
      console.error('Error fetching shop profile:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch shop profile' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  },

  PUT: async ({ request }) => {
    try {
      const session = await auth.api.getSession({ headers: request.headers })
      if (!session) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const userId = session.user.id

      const [shop] = await db.select().from(shops).where(eq(shops.userId, userId)).limit(1)
      if (!shop) {
        return new Response(
          JSON.stringify({ success: false, error: 'No shop found for this user' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const body = await request.json()
      const validated = updateShopProfileSchema.parse(body)

      const [existingProfile] = await db
        .select()
        .from(shopProfiles)
        .where(eq(shopProfiles.shopId, shop.id))
        .limit(1)

      let updatedProfile
      if (existingProfile) {
        ;[updatedProfile] = await db
          .update(shopProfiles)
          .set({
            ...validated,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(shopProfiles.shopId, shop.id))
          .returning()
      } else {
        ;[updatedProfile] = await db
          .insert(shopProfiles)
          .values({ shopId: shop.id, ...validated })
          .returning()
      }

      return new Response(
        JSON.stringify({ success: true, shop, shopProfile: updatedProfile }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    } catch (error) {
      console.error('Error updating shop profile:', error)
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid data', details: error.errors }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update shop profile' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  },
})

