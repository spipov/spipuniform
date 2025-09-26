import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { conditions } from '@/db/schema/spipuniform';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/conditions/$id').methods({
  PUT: async ({ request, params }) => {
    try {
      const id = params.id;
      if (!id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Condition ID is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const body = await request.json();
      const { name, description, order, isActive } = body;

      // Check if name already exists for other conditions
      if (name && name.trim()) {
        const existing = await db
          .select()
          .from(conditions)
          .where(eq(conditions.name, name.trim()))
          .limit(1);

        if (existing.length > 0 && existing[0].id !== id) {
          return new Response(JSON.stringify({
            success: false,
            error: 'A condition with this name already exists'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name?.trim() || null;
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (order !== undefined) updateData.order = order;
      if (isActive !== undefined) updateData.isActive = isActive;
      updateData.updatedAt = new Date().toISOString();

      const [updatedCondition] = await db
        .update(conditions)
        .set(updateData)
        .where(eq(conditions.id, id))
        .returning();

      if (!updatedCondition) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Condition not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        condition: updatedCondition
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error updating condition:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update condition'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  DELETE: async ({ params }) => {
    try {
      const id = params.id;
      if (!id) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Condition ID is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const [deletedCondition] = await db
        .delete(conditions)
        .where(eq(conditions.id, id))
        .returning();

      if (!deletedCondition) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Condition not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Condition deleted successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error('Error deleting condition:', error);
      // Check if it's a foreign key constraint error
      if (error?.code === '23503') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Cannot delete condition as it is being used by existing listings'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete condition'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
