import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { productTypes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/product-categories/$categoryId/types').methods({
  GET: async ({ params }) => {
    try {
      const { categoryId } = params;

      const types = await db
        .select({
          id: productTypes.id,
          name: productTypes.name,
          slug: productTypes.slug,
          description: productTypes.description,
          categoryId: productTypes.categoryId
        })
        .from(productTypes)
        .where(eq(productTypes.categoryId, categoryId))
        .orderBy(productTypes.name);

      return new Response(JSON.stringify({
        success: true,
        productTypes: types
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching product types:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch product types'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});