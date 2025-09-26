import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { schoolOwners, schools, userProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createSchoolOwnerSchema = z.object({
  userId: z.string(),
  schoolId: z.string(),
  role: z.enum(['owner', 'manager', 'parent']).optional().default('owner')
});

const updateSchoolOwnerSchema = z.object({
  role: z.enum(['owner', 'manager', 'parent']).optional(),
  isActive: z.boolean().optional()
});

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/school-owners/').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const schoolId = url.searchParams.get('schoolId');
      const userId = url.searchParams.get('userId');

      let query = db
        .select({
          id: schoolOwners.id,
          userId: schoolOwners.userId,
          schoolId: schoolOwners.schoolId,
          role: schoolOwners.role,
          isActive: schoolOwners.isActive,
          createdAt: schoolOwners.createdAt,
          updatedAt: schoolOwners.updatedAt,
          // Include user info
          userName: userProfiles.firstName,
          userEmail: userProfiles.phone, // Note: userProfiles doesn't have email, this might need adjustment
          // Include school info
          schoolName: schools.name,
          schoolLevel: schools.level
        })
        .from(schoolOwners)
        .leftJoin(userProfiles, eq(schoolOwners.userId, userProfiles.userId))
        .leftJoin(schools, eq(schoolOwners.schoolId, schools.id));

      const conditions: any[] = [];

      if (schoolId) {
        conditions.push(eq(schoolOwners.schoolId, schoolId));
      }

      if (userId) {
        conditions.push(eq(schoolOwners.userId, userId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query;

      return new Response(JSON.stringify({
        success: true,
        schoolOwners: result
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching school owners:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch school owners'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const validatedData = createSchoolOwnerSchema.parse(body);

      // Check if this user-school combination already exists
      const existing = await db
        .select()
        .from(schoolOwners)
        .where(and(
          eq(schoolOwners.userId, validatedData.userId),
          eq(schoolOwners.schoolId, validatedData.schoolId)
        ));

      if (existing.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User is already assigned to this school'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const [newSchoolOwner] = await db
        .insert(schoolOwners)
        .values({
          userId: validatedData.userId,
          schoolId: validatedData.schoolId,
          role: validatedData.role
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        schoolOwner: newSchoolOwner
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error creating school owner:', error);
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
        error: 'Failed to create school owner'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});