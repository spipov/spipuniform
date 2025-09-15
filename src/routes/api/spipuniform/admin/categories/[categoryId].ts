import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { productCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/admin/categories/categoryId').methods({
  GET: async ({ params }) => {
    try {
      const category = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, params.categoryId))
        .limit(1);

      if (!category[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Category not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        category: category[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch category' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  PUT: async ({ params, request }) => {
    try {
      const body = await request.json();
      const { name, slug, description, sortOrder, isActive } = body;

      if (!name || !slug) {
        return new Response(
          JSON.stringify({ success: false, error: 'Name and slug are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const updated = await db
        .update(productCategories)
        .set({
          name,
          slug,
          description,
          sortOrder: sortOrder || 0,
          isActive: isActive !== undefined ? isActive : true,
          updatedAt: new Date().toISOString()
        })
        .where(eq(productCategories.id, params.categoryId))
        .returning();

      if (!updated[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Category not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        category: updated[0]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error updating category:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update category' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  DELETE: async ({ params }) => {
    try {
      const deleted = await db
        .delete(productCategories)
        .where(eq(productCategories.id, params.categoryId))
        .returning();

      if (!deleted[0]) {
        return new Response(
          JSON.stringify({ success: false, error: 'Category not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Category deleted successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete category' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
});