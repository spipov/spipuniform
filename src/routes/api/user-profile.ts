import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Constants
const MAX_SCHOOLS_WITHOUT_APPROVAL = 3;

// Validation schema
const updateUserProfileSchema = z.object({
  phone: z.string().optional(),
  primarySchoolId: z.string().uuid().optional().nullable(),
  additionalSchools: z.array(z.string().uuid()).max(MAX_SCHOOLS_WITHOUT_APPROVAL, 'Cannot select more than 3 additional schools without admin approval').optional(),
  localityId: z.string().uuid().optional().nullable(),
  preferredContactMethod: z.enum(['phone', 'email', 'app']).optional(),
  availability: z.string().optional(),
  specificArea: z.string().optional(),
  preferredBrands: z.array(z.string()).optional(),
  preferredConditions: z.array(z.string().uuid()).optional(),
  notificationPreferences: z.object({
    emailNotifications: z.boolean().optional(),
    appNotifications: z.boolean().optional(),
    matchFound: z.boolean().optional(),
    requestFulfilled: z.boolean().optional(),
    messageReceived: z.boolean().optional()
  }).optional()
});

export const ServerRoute = createServerFileRoute('/api/user-profile').methods({
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

      const [profile] = await db
        .select({
          id: userProfiles.id,
          userId: userProfiles.userId,
          phone: userProfiles.phone,
          primarySchoolId: userProfiles.primarySchoolId,
          additionalSchools: userProfiles.additionalSchools,
          localityId: userProfiles.localityId,
          preferredContactMethod: userProfiles.preferredContactMethod,
          availability: userProfiles.availability,
          specificArea: userProfiles.specificArea,
          preferredBrands: userProfiles.preferredBrands,
          preferredConditions: userProfiles.preferredConditions,
          notificationPreferences: userProfiles.notificationPreferences,
          verificationStatus: userProfiles.verificationStatus,
          totalRating: userProfiles.totalRating,
          ratingCount: userProfiles.ratingCount,
          createdAt: userProfiles.createdAt,
          updatedAt: userProfiles.updatedAt
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      
      if (!profile) {
        // Create a basic profile if one doesn't exist
        const [newProfile] = await db
          .insert(userProfiles)
          .values({
            userId,
            verificationStatus: 'unverified',
            totalRating: '0',
            ratingCount: 0
          })
          .returning();
        
        return new Response(JSON.stringify({
          success: true,
          profile: newProfile
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        profile
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch user profile'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  PUT: async ({ request }) => {
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
      const validatedData = updateUserProfileSchema.parse(body);
      
      // Additional validation for school limits
      if (validatedData.additionalSchools || validatedData.primarySchoolId !== undefined) {
        const totalSchools = [];
        if (validatedData.primarySchoolId) {
          totalSchools.push(validatedData.primarySchoolId);
        }
        if (validatedData.additionalSchools) {
          totalSchools.push(...validatedData.additionalSchools);
        }
        
        // Check for duplicates
        const uniqueSchools = [...new Set(totalSchools)];
        if (uniqueSchools.length !== totalSchools.length) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Cannot select the same school multiple times'
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Check total school limit (primary + additional should not exceed 3)
        if (uniqueSchools.length > MAX_SCHOOLS_WITHOUT_APPROVAL) {
          return new Response(JSON.stringify({
            success: false,
            error: `Cannot select more than ${MAX_SCHOOLS_WITHOUT_APPROVAL} schools without admin approval. Please use the additional school request feature.`,
            maxSchools: MAX_SCHOOLS_WITHOUT_APPROVAL,
            selectedCount: uniqueSchools.length
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Check if profile exists
      const [existingProfile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      
      let updatedProfile;
      
      if (existingProfile) {
        // Update existing profile
        [updatedProfile] = await db
          .update(userProfiles)
          .set({
            ...validatedData,
            updatedAt: new Date().toISOString()
          })
          .where(eq(userProfiles.userId, userId))
          .returning();
      } else {
        // Create new profile
        [updatedProfile] = await db
          .insert(userProfiles)
          .values({
            userId,
            ...validatedData,
            verificationStatus: 'unverified',
            totalRating: '0',
            ratingCount: 0
          })
          .returning();
      }
      
      return new Response(JSON.stringify({
        success: true,
        profile: updatedProfile
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
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
        error: 'Failed to update user profile'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});