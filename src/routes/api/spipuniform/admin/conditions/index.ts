import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { conditions } from '@/db/schema/spipuniform';
import { eq, asc } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/conditions/').methods({
  GET: async ({ request }) => {
    try {
      const conditionsData = await db
        .select()
        .from(conditions)
        .orderBy(asc(conditions.order), asc(conditions.name));

      return new Response(JSON.stringify({
        success: true,
        conditions: conditionsData
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching conditions:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch conditions'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { name, description, order, isActive } = body;

      if (!name || !name.trim()) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Name is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if name already exists
      const existing = await db
        .select()
        .from(conditions)
        .where(eq(conditions.name, name.trim()))
        .limit(1);

      if (existing.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'A condition with this name already exists'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const [newCondition] = await db
        .insert(conditions)
        .values({
          name: name.trim(),
          description: description?.trim() || null,
          order: order || 0,
          isActive: isActive !== false
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        condition: newCondition
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error creating condition:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create condition'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
