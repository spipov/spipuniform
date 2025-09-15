import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { attributes, productTypes, productCategories, attributeValues } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/attributes/').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const productTypeId = url.searchParams.get('productTypeId');

      let query = db
        .select({
          id: attributes.id,
          productTypeId: attributes.productTypeId,
          name: attributes.name,
          slug: attributes.slug,
          inputType: attributes.inputType,
          required: attributes.required,
          order: attributes.order,
          placeholder: attributes.placeholder,
          helpText: attributes.helpText,
          createdAt: attributes.createdAt,
          updatedAt: attributes.updatedAt,
          productTypeName: productTypes.name,
          categoryName: productCategories.name
        })
        .from(attributes)
        .leftJoin(productTypes, eq(attributes.productTypeId, productTypes.id))
        .leftJoin(productCategories, eq(productTypes.categoryId, productCategories.id));

      if (productTypeId) {
        query = query.where(eq(attributes.productTypeId, productTypeId));
      }

      const attrs = await query.orderBy(attributes.order, attributes.name);

      // Get attribute values for each attribute
      const attributesWithValues = await Promise.all(
        attrs.map(async (attr) => {
          const values = await db
            .select({
              id: attributeValues.id,
              value: attributeValues.value,
              displayName: attributeValues.displayName,
              sortOrder: attributeValues.sortOrder,
              isActive: attributeValues.isActive
            })
            .from(attributeValues)
            .where(eq(attributeValues.attributeId, attr.id))
            .orderBy(attributeValues.sortOrder, attributeValues.displayName);
            
          return {
            ...attr,
            valuesCount: values.length,
            values: values
          };
        })
      );

      return new Response(JSON.stringify({
        success: true,
        attributes: attributesWithValues
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching attributes:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch attributes' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { productTypeId, name, slug, inputType, required, order, placeholder, helpText } = body;

      if (!productTypeId || !name || !slug || !inputType) {
        return new Response(
          JSON.stringify({ success: false, error: 'Product Type ID, name, slug, and input type are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const created = await db
        .insert(attributes)
        .values({
          productTypeId,
          name,
          slug,
          inputType,
          required: required || false,
          order: order || 0,
          placeholder: placeholder || null,
          helpText: helpText || null
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        attribute: created[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error creating attribute:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create attribute' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});