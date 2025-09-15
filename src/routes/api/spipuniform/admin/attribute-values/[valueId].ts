import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { attributeValues } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/attribute-values/valueId').methods({
  GET: async ({ params }) => {
    try {
      const attributeValue = await db
        .select()
        .from(attributeValues)
        .where(eq(attributeValues.id, params.valueId))
        .limit(1);

      if (!attributeValue[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Attribute value not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        attributeValue: attributeValue[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching attribute value:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch attribute value' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ params, request }) => {
    try {
      const body = await request.json();
      const { attributeId, value, displayName, sortOrder, isActive } = body;

      if (!attributeId || !value || !displayName) {
        return new Response(
          JSON.stringify({ success: false, error: 'Attribute ID, value, and display name are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const updated = await db
        .update(attributeValues)
        .set({
          attributeId,
          value,
          displayName,
          sortOrder: sortOrder || 0,
          isActive: isActive !== undefined ? isActive : true,
          updatedAt: new Date().toISOString()
        })
        .where(eq(attributeValues.id, params.valueId))
        .returning();

      if (!updated[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Attribute value not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        attributeValue: updated[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error updating attribute value:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update attribute value' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ params }) => {
    try {
      const deleted = await db
        .delete(attributeValues)
        .where(eq(attributeValues.id, params.valueId))
        .returning();

      if (!deleted[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Attribute value not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Attribute value deleted successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error deleting attribute value:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete attribute value' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});