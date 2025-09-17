import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { productCategories, productTypes } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/product-categories').methods({
  GET: async ({ request }) => {
    try {
      // Get all active categories with their product types
      const categoriesWithTypes = await db
        .select({
          category: {
            id: productCategories.id,
            name: productCategories.name,
            slug: productCategories.slug,
            description: productCategories.description,
            sortOrder: productCategories.sortOrder
          },
          productType: {
            id: productTypes.id,
            name: productTypes.name,
            slug: productTypes.slug,
            description: productTypes.description,
            categoryId: productTypes.categoryId
          }
        })
        .from(productCategories)
        .leftJoin(productTypes, eq(productCategories.id, productTypes.categoryId))
        .where(eq(productCategories.isActive, true))
        .orderBy(
          asc(productCategories.sortOrder),
          asc(productCategories.name),
          asc(productTypes.name)
        );

      // Group product types by category
      const categoriesMap = new Map();
      
      categoriesWithTypes.forEach(row => {
        const { category, productType } = row;
        
        if (!categoriesMap.has(category.id)) {
          categoriesMap.set(category.id, {
            ...category,
            productTypes: []
          });
        }
        
        if (productType.id) {
          categoriesMap.get(category.id).productTypes.push({
            id: productType.id,
            name: productType.name,
            slug: productType.slug,
            description: productType.description,
            categoryId: productType.categoryId
          });
        }
      });

      const categories = Array.from(categoriesMap.values());
      
      return new Response(JSON.stringify({
        success: true,
        categories
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching product categories:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch product categories'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});