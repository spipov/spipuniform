import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { attributes, attributeValues, productTypes } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

export const ServerRoute = createServerFileRoute('/api/product-types/$id/attributes').methods({
  GET: async ({ params, request }) => {
    try {
      const productTypeId = params.id;
      
      if (!productTypeId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Product type ID is required'
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validate that the product type exists
      const [productType] = await db
        .select()
        .from(productTypes)
        .where(eq(productTypes.id, productTypeId))
        .limit(1);

      if (!productType) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Product type not found'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get attributes with their values
      const attributesWithValues = await db
        .select({
          attribute: {
            id: attributes.id,
            name: attributes.name,
            slug: attributes.slug,
            inputType: attributes.inputType,
            required: attributes.required,
            order: attributes.order,
            placeholder: attributes.placeholder,
            helpText: attributes.helpText
          },
          value: {
            id: attributeValues.id,
            value: attributeValues.value,
            displayName: attributeValues.displayName,
            sortOrder: attributeValues.sortOrder
          }
        })
        .from(attributes)
        .leftJoin(attributeValues, eq(attributes.id, attributeValues.attributeId))
        .where(eq(attributes.productTypeId, productTypeId))
        .orderBy(
          asc(attributes.order),
          asc(attributes.name),
          asc(attributeValues.sortOrder),
          asc(attributeValues.displayName)
        );

      // Group attribute values by attribute
      const attributesMap = new Map();
      
      attributesWithValues.forEach(row => {
        const { attribute, value } = row;
        
        if (!attributesMap.has(attribute.id)) {
          attributesMap.set(attribute.id, {
            ...attribute,
            values: []
          });
        }
        
        if (value.id) {
          attributesMap.get(attribute.id).values.push({
            id: value.id,
            value: value.value,
            displayName: value.displayName,
            sortOrder: value.sortOrder
          });
        }
      });

      const attributesList = Array.from(attributesMap.values());
      
      return new Response(JSON.stringify({
        success: true,
        attributes: attributesList,
        productType: {
          id: productType.id,
          name: productType.name,
          slug: productType.slug
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching product type attributes:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch product type attributes'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});