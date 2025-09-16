import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { familyMembers, userProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const updateFamilyMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  schoolId: z.string().uuid().optional().nullable(),
  schoolYear: z.string().optional(),
  currentSizes: z.record(z.string()).optional(),
  growthNotes: z.string().optional(),
  showInProfile: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const ServerRoute = createServerFileRoute('/api/profiles/familyMember/$id').methods({
  GET: async ({ params, request }) => {
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
      const memberId = params._splat;

      if (!memberId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Family member ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get user's profile ID first
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

      // Get the specific family member (ensuring it belongs to this user)
      const [familyMember] = await db
        .select()
        .from(familyMembers)
        .where(and(
          eq(familyMembers.id, memberId),
          eq(familyMembers.userProfileId, userProfile.id)
        ))
        .limit(1);
      
      if (!familyMember) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Family member not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        familyMember
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching family member:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch family member'
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
      const memberId = params._splat;

      if (!memberId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Family member ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const validatedData = updateFamilyMemberSchema.parse(body);
      
      // Get user's profile ID first
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
      
      // Update the family member (ensuring it belongs to this user)
      const [updatedFamilyMember] = await db
        .update(familyMembers)
        .set({
          ...validatedData,
          updatedAt: new Date().toISOString()
        })
        .where(and(
          eq(familyMembers.id, memberId),
          eq(familyMembers.userProfileId, userProfile.id)
        ))
        .returning();
      
      if (!updatedFamilyMember) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Family member not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        familyMember: updatedFamilyMember
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error updating family member:', error);
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
        error: 'Failed to update family member'
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
      const memberId = params._splat;

      if (!memberId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Family member ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get user's profile ID first
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
      
      // Delete the family member (ensuring it belongs to this user)
      const [deletedFamilyMember] = await db
        .delete(familyMembers)
        .where(and(
          eq(familyMembers.id, memberId),
          eq(familyMembers.userProfileId, userProfile.id)
        ))
        .returning();
      
      if (!deletedFamilyMember) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Family member not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Family member deleted successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error deleting family member:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete family member'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});