import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { conditions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/conditions').methods({
  GET: async ({ request }) => {
    try {
      // Get all active conditions ordered by their order field
      const allConditions = await db
        .select({
          id: conditions.id,
          name: conditions.name,
          description: conditions.description,
          order: conditions.order
        })
        .from(conditions)
        .where(eq(conditions.isActive, true))
        .orderBy(asc(conditions.order), asc(conditions.name));
      
      return new Response(JSON.stringify({
        success: true,
        conditions: allConditions
      }), {
        status: 200,
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
  }
});