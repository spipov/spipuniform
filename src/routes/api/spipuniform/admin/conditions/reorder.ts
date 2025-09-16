import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start/server';
import { db } from '@/db';
import { conditions } from '@/db/schema/spipuniform';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const reorderSchema = z.object({
  conditionOrders: z.array(z.object({
    id: z.string().uuid(),
    order: z.number().int().min(0)
  }))
});

export async function POST({ request }: APIEvent) {
  try {
    const body = await request.json();
    const { conditionOrders } = reorderSchema.parse(body);
    
    // Update each condition's order
    const promises = conditionOrders.map(({ id, order }) => 
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
    
    return json({
      success: true,
      message: 'Conditions reordered successfully',
      conditions: updatedConditions.map(result => result[0]).filter(Boolean)
    });
  } catch (error) {
    console.error('Error reordering conditions:', error);
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      }, { status: 400 });
    }
    return json({
      success: false,
      error: 'Failed to reorder conditions'
    }, { status: 500 });
  }
}