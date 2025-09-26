import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { conditions } from '@/db/schema/spipuniform';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/conditions/reorder').methods({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { conditionOrders } = body;

      if (!conditionOrders || !Array.isArray(conditionOrders)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'conditionOrders array is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Update each condition's order
      const promises = conditionOrders.map(({ id, order }: { id: string; order: number }) =>
        db
          .update(conditions)
          .set({
            order,
            updatedAt: new Date().toISOString()
          })
          .where(eq(conditions.id, id))
          .returning()
      );

      const updatedConditions = await Promise.all(promises);

      return new Response(JSON.stringify({
        success: true,
        message: 'Conditions reordered successfully',
        conditions: updatedConditions.map(result => result[0]).filter(Boolean)
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error reordering conditions:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to reorder conditions'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
