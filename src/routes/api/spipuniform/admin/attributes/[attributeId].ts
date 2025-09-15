import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { attributes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/attributes/attributeId').methods({
  GET: async ({ params }) => {
    try {
      const attribute = await db
        .select()
        .from(attributes)
        .where(eq(attributes.id, params.attributeId))
        .limit(1);

      if (!attribute[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Attribute not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        attribute: attribute[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching attribute:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch attribute' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ params, request }) => {
    try {
      const body = await request.json();
      const { productTypeId, name, slug, inputType, required, order, placeholder, helpText } = body;

      if (!productTypeId || !name || !slug || !inputType) {
        return new Response(
          JSON.stringify({ success: false, error: 'Product Type ID, name, slug, and input type are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const updated = await db
        .update(attributes)
        .set({
          productTypeId,
          name,
          slug,
          inputType,
          required: required !== undefined ? required : false,
          order: order || 0,
          placeholder: placeholder || null,
          helpText: helpText || null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(attributes.id, params.attributeId))
        .returning();

      if (!updated[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Attribute not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        attribute: updated[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error updating attribute:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update attribute' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ params }) => {
    try {
      const deleted = await db
        .delete(attributes)
        .where(eq(attributes.id, params.attributeId))
        .returning();

      if (!deleted[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Attribute not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Attribute deleted successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error deleting attribute:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete attribute' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});