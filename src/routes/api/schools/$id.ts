import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { schools } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSchoolSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  level: z.enum(['primary', 'secondary', 'mixed']).optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const ServerRoute = createServerFileRoute('/api/schools/$id').methods({
  PATCH: async ({ params, request }) => {
    try {
      const { id } = params;
      const body = await request.json();
      const validatedData = updateSchoolSchema.parse(body);

      // Update the school
      const [updatedSchool] = await db
        .update(schools)
        .set(validatedData)
        .where(eq(schools.id, id))
        .returning();

      if (!updatedSchool) {
        return new Response(JSON.stringify({
          success: false,
          error: 'School not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        school: updatedSchool
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error updating school:', error);
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
        error: 'Failed to update school'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
