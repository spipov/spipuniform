import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { attributeValues, attributes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/attribute-values/').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const attributeId = url.searchParams.get('attributeId');

      let query = db
        .select({
          id: attributeValues.id,
          attributeId: attributeValues.attributeId,
          value: attributeValues.value,
          displayName: attributeValues.displayName,
          sortOrder: attributeValues.sortOrder,
          isActive: attributeValues.isActive,
          createdAt: attributeValues.createdAt,
          updatedAt: attributeValues.updatedAt,
          attributeName: attributes.name,
          attributeSlug: attributes.slug
        })
        .from(attributeValues)
        .leftJoin(attributes, eq(attributeValues.attributeId, attributes.id));

      if (attributeId) {
        query = query.where(eq(attributeValues.attributeId, attributeId));
      }

      const values = await query.orderBy(attributeValues.sortOrder, attributeValues.displayName);

      return new Response(JSON.stringify({
        success: true,
        attributeValues: values
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching attribute values:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch attribute values' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { attributeId, value, displayName, sortOrder, isActive } = body;

      if (!attributeId || !value || !displayName) {
        return new Response(
          JSON.stringify({ success: false, error: 'Attribute ID, value, and display name are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const created = await db
        .insert(attributeValues)
        .values({
          attributeId,
          value,
          displayName,
          sortOrder: sortOrder || 0,
          isActive: isActive !== undefined ? isActive : true
        })
        .returning();

      return new Response(JSON.stringify({
        success: true,
        attributeValue: created[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error creating attribute value:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create attribute value' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});