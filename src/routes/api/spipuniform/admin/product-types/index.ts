import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { productTypes, productCategories, attributes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/product-types/').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const categoryId = url.searchParams.get('categoryId');

      let query = db
        .select({
          id: productTypes.id,
          categoryId: productTypes.categoryId,
          name: productTypes.name,
          slug: productTypes.slug,
          description: productTypes.description,
          isActive: productTypes.isActive,
          createdAt: productTypes.createdAt,
          updatedAt: productTypes.updatedAt,
          categoryName: productCategories.name
        })
        .from(productTypes)
        .leftJoin(productCategories, eq(productTypes.categoryId, productCategories.id));

      if (categoryId) {
        query = query.where(eq(productTypes.categoryId, categoryId));
      }

      const types = await query.orderBy(productCategories.sortOrder, productTypes.name);

      // Get attributes count for each type
      const typesWithAttributes = await Promise.all(
        types.map(async (type) => {
          const attributesCount = await db
            .select()
            .from(attributes)
            .where(eq(attributes.productTypeId, type.id));
            
          return {
            ...type,
            attributesCount: attributesCount.length
          };
        })
      );

      return new Response(JSON.stringify({
        success: true,
        productTypes: typesWithAttributes
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
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { categoryId, name, slug, description } = body;

      if (!categoryId || !name || !slug) {
        return new Response(
          JSON.stringify({ success: false, error: 'Category ID, name, and slug are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const created = await db
        .insert(productTypes)
        .values({
          categoryId,
          name,
          slug,
          description,
          isActive: true
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        productType: created[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error creating product type:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create product type' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});