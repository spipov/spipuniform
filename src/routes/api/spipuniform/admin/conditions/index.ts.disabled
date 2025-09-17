import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
import { createServerFileRoute } from '@tanstack/react-start/server';

import { db } from '@/db';
import { conditions } from '@/db/schema/spipuniform';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const createConditionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

const updateConditionSchema = createConditionSchema.partial();

export async function GET({ request }: APIEvent) {
  try {
    const conditionsData = await db
      .select()
      .from(conditions)
      .orderBy(asc(conditions.order), asc(conditions.name));

    return json({
      success: true,
      conditions: conditionsData
    });
  } catch (error) {
    console.error('Error fetching conditions:', error);
    return json({
      success: false,
      error: 'Failed to fetch conditions'
    }, { status: 500 });
  }
}

export async function POST({ request }: APIEvent) {
  try {
    const body = await request.json();
    const validatedData = createConditionSchema.parse(body);

    // Check if name already exists
    const existingCondition = await db
      .select()
      .from(conditions)
      .where(eq(conditions.name, validatedData.name))
      .limit(1);

    if (existingCondition.length > 0) {
      return json({
        success: false,
        error: 'A condition with this name already exists'
      }, { status: 400 });
    }

    const [newCondition] = await db
      .insert(conditions)
      .values({
        ...validatedData,
        updatedAt: new Date().toISOString()
      })
      .returning();

    return json({
      success: true,
      condition: newCondition
    });
  } catch (error) {
    console.error('Error creating condition:', error);
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to create condition'
    }, { status: 500 });
  }
}

export async function PUT({ request, params }: APIEvent) {
  try {
    const id = params?.id;
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

export async function DELETE({ request, params }: APIEvent) {
  try {
    const id = params?.id;
    if (!id) {
      return json({
        success: false,
        error: 'Condition ID is required'
      }, { status: 400 });
    }

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
    return json({
      success: false,
      error: 'Failed to delete condition'
    }, { status: 500 });

  }
}

// Expose ServerRoute for TanStack Start to register this API route
export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/conditions/').methods({
  GET,
  POST,
  // These exist in this file; expose them to satisfy the router, even if seldom used on this path
  PUT,
  DELETE,
});
