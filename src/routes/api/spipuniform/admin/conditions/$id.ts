import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
import { createServerFileRoute } from '@tanstack/react-start/server';

import { db } from '@/db';
import { conditions } from '@/db/schema/spipuniform';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateConditionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

export async function GET({ params }: APIEvent) {
  try {
    const id = params.id;
    if (!id) {
      return json({
        success: false,
        error: 'Condition ID is required'
      }, { status: 400 });
    }

    const [condition] = await db
      .select()
      .from(conditions)
      .where(eq(conditions.id, id))
      .limit(1);

    if (!condition) {
      return json({
        success: false,
        error: 'Condition not found'
      }, { status: 404 });
    }

    return json({
      success: true,
      condition
    });
  } catch (error) {
    console.error('Error fetching condition:', error);
    return json({
      success: false,
      error: 'Failed to fetch condition'
    }, { status: 500 });
  }
}

export async function PUT({ request, params }: APIEvent) {
  try {
    const id = params.id;
    if (!id) {
      return json({
        success: false,
        error: 'Condition ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateConditionSchema.parse(body);

    // Check if name already exists for other conditions
    if (validatedData.name) {
      const existingCondition = await db
        .select()
        .from(conditions)
        .where(eq(conditions.name, validatedData.name))
        .limit(1);

      if (existingCondition.length > 0 && existingCondition[0].id !== id) {
        return json({
          success: false,
          error: 'A condition with this name already exists'
        }, { status: 400 });
      }
    }

    const [updatedCondition] = await db
      .update(conditions)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .where(eq(conditions.id, id))
      .returning();

    if (!updatedCondition) {
      return json({
        success: false,
        error: 'Condition not found'
      }, { status: 404 });
    }

    return json({
      success: true,
      condition: updatedCondition
    });
  } catch (error) {
    console.error('Error updating condition:', error);
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to update condition'
    }, { status: 500 });
  }
}

export async function DELETE({ params }: APIEvent) {
  try {
    const id = params.id;
    if (!id) {
      return json({
        success: false,
        error: 'Condition ID is required'
      }, { status: 400 });
    }

    // Check if condition is being used in listings
    // Note: We'll need to import listings table if we want to check usage
    // For now, we'll allow deletion and rely on database constraints

    const [deletedCondition] = await db
      .delete(conditions)
      .where(eq(conditions.id, id))
      .returning();

    if (!deletedCondition) {
      return json({
        success: false,
        error: 'Condition not found'
      }, { status: 404 });
    }

    return json({
      success: true,
      message: 'Condition deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting condition:', error);
    // Check if it's a foreign key constraint error
    if (error.code === '23503') {
      return json({
        success: false,
        error: 'Cannot delete condition as it is being used by existing listings'
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to delete condition'
    }, { status: 500 });

  }
}

// Expose ServerRoute for TanStack Start to register this API route
export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/conditions/$id').methods({
  GET,
  PUT,
  DELETE,
});
