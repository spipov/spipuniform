import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { productTypes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/product-types/typeId').methods({
  GET: async ({ params }) => {
    try {
      const productType = await db
        .select()
        .from(productTypes)
        .where(eq(productTypes.id, (params as any).typeId))
        .limit(1);

      if (!productType[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Product type not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        productType: productType[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching product type:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch product type' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ params, request }) => {
    try {
      const body = await request.json();
      const { categoryId, name, slug, description, isActive, imageFileId } = body;

      if (!categoryId || !name || !slug) {
        return new Response(
          JSON.stringify({ success: false, error: 'Category ID, name, and slug are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const updateData: any = {
        categoryId,
        name,
        slug,
        description,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date().toISOString()
      };

      // Only add imageFileId if provided
      if (imageFileId !== undefined) {
        updateData.imageFileId = imageFileId;
      }

      const updated = await db
        .update(productTypes)
        .set(updateData)
        .where(eq(productTypes.id, (params as any).typeId))
        .returning();

      if (!updated[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Product type not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        productType: updated[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error updating product type:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update product type' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ params }) => {
    try {
      const deleted = await db
        .delete(productTypes)
        .where(eq(productTypes.id, (params as any).typeId))
        .returning();

      if (!deleted[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Product type not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Product type deleted successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error deleting product type:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete product type' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});