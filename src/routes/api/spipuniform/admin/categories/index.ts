import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { productCategories, productTypes, attributes, attributeValues, conditions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/categories/').methods({
  GET: async ({ request }) => {
    try {
      // Fetch categories with their types
      const categories = await db
        .select({
          id: productCategories.id,
          name: productCategories.name,
          slug: productCategories.slug,
          description: productCategories.description,
          sortOrder: productCategories.sortOrder,
          isActive: productCategories.isActive,
          createdAt: productCategories.createdAt,
          updatedAt: productCategories.updatedAt
        })
        .from(productCategories)
        .orderBy(productCategories.sortOrder);

      // Fetch all product types
      const types = await db
        .select({
          id: productTypes.id,
          categoryId: productTypes.categoryId,
          name: productTypes.name,
          slug: productTypes.slug,
          description: productTypes.description,
          isActive: productTypes.isActive,
          createdAt: productTypes.createdAt,
          updatedAt: productTypes.updatedAt
        })
        .from(productTypes);

      // Fetch all attributes
      const attrs = await db
        .select({
          id: attributes.id,
          productTypeId: attributes.productTypeId,
          name: attributes.name,
          slug: attributes.slug,
          inputType: attributes.inputType,
          required: attributes.required,
          order: attributes.order,
          placeholder: attributes.placeholder,
          helpText: attributes.helpText
        })
        .from(attributes)
        .orderBy(attributes.order);

      // Fetch all attribute values
      const values = await db
        .select({
          id: attributeValues.id,
          attributeId: attributeValues.attributeId,
          value: attributeValues.value,
          displayName: attributeValues.displayName,
          sortOrder: attributeValues.sortOrder,
          isActive: attributeValues.isActive
        })
        .from(attributeValues)
        .where(eq(attributeValues.isActive, true))
        .orderBy(attributeValues.sortOrder);

      // Fetch all conditions
      const conds = await db
        .select({
          id: conditions.id,
          name: conditions.name,
          description: conditions.description,
          order: conditions.order,
          isActive: conditions.isActive
        })
        .from(conditions)
        .where(eq(conditions.isActive, true))
        .orderBy(conditions.order);

      // Build the hierarchical structure
      const enrichedCategories = categories.map(category => ({
        ...category,
        types: types
          .filter(type => type.categoryId === category.id)
          .map(type => ({
            ...type,
            attributes: attrs
              .filter(attr => attr.productTypeId === type.id)
              .map(attr => ({
                ...attr,
                values: values.filter(val => val.attributeId === attr.id)
              }))
          }))
      }));

      return new Response(JSON.stringify({
        success: true,
        categories: enrichedCategories,
        conditions: conds,
        summary: {
          categoriesCount: categories.length,
          typesCount: types.length,
          attributesCount: attrs.length,
          attributeValuesCount: values.length,
          conditionsCount: conds.length
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching product categories:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch product categories' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { name, slug, description, sortOrder } = body;

      if (!name || !slug) {
        return new Response(
          JSON.stringify({ success: false, error: 'Name and slug are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const created = await db
        .insert(productCategories)
        .values({
          name,
          slug,
          description,
          sortOrder: sortOrder || 0,
          isActive: true
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        category: created[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error creating category:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create category' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});
