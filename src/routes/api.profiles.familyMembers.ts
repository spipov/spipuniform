import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { familyMembers, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

// Validation schemas
const createFamilyMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  schoolId: z.string().uuid().optional().nullable(),
  schoolYear: z.string().optional(),
  currentSizes: z.record(z.string()).optional(), // {"shirt": "Age 7-8", "trousers": "Age 8"}
  growthNotes: z.string().optional(),
  showInProfile: z.boolean().default(true),
  isActive: z.boolean().default(true)
});

const updateFamilyMemberSchema = createFamilyMemberSchema.partial();

export const ServerRoute = createServerFileRoute('/api/profiles/familyMembers').methods({
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

      // First get user's profile to get the profile ID
      const [userProfile] = await db
        .select({ id: userProfiles.id })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      
      if (!userProfile) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User profile not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get all family members for this user profile
      const familyMembersData = await db
        .select()
        .from(familyMembers)
        .where(eq(familyMembers.userProfileId, userProfile.id));
      
      return new Response(JSON.stringify({
        success: true,
        familyMembers: familyMembersData
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching family members:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch family members'
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
      const validatedData = createFamilyMemberSchema.parse(body);
      
      // Get user's profile ID
      const [userProfile] = await db
        .select({ id: userProfiles.id })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      
      if (!userProfile) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User profile not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const [newFamilyMember] = await db
        .insert(familyMembers)
        .values({
          userProfileId: userProfile.id,
          ...validatedData
        })
        .returning();
      
      return new Response(JSON.stringify({
        success: true,
        familyMember: newFamilyMember
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error creating family member:', error);
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
        error: 'Failed to create family member'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});