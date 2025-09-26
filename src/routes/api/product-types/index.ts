import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { productTypes, productCategories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/product-types/').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const categoryId = url.searchParams.get('categoryId');

      let whereCondition = eq(productTypes.isActive, true);

      if (categoryId) {
        whereCondition = and(whereCondition, eq(productTypes.categoryId, categoryId))!;
      }

      const types = await db
        .select({
          id: productTypes.id,
          categoryId: productTypes.categoryId,
          name: productTypes.name,
          slug: productTypes.slug,
          categoryName: productCategories.name
        })
        .from(productTypes)
        .leftJoin(productCategories, eq(productTypes.categoryId, productCategories.id))
        .where(whereCondition)
        .orderBy(productCategories.sortOrder, productTypes.name);

      return new Response(JSON.stringify({
        success: true,
        productTypes: types
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching product types:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch product types' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});