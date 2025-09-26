import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { schoolStock, schoolStockImages, schoolOwners, schools, productTypes, productCategories, conditions, files, user as userTable } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const createSchoolStockSchema = z.object({
  schoolId: z.string(),
  productTypeId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  categoryId: z.string(),
  attributes: z.record(z.string()).optional(),
  conditionId: z.string(),
  quantity: z.number().min(1).optional().default(1),
  price: z.number().min(0).optional(),
  isFree: z.boolean().optional().default(false),
  hasSchoolCrest: z.boolean().optional().default(false),
  images: z.array(z.object({
    fileId: z.string(),
    altText: z.string().optional(),
    order: z.number()
  })).optional()
});

const updateSchoolStockSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  size: z.string().optional(),
  conditionId: z.string().optional(),
  quantity: z.number().min(1).optional(),
  price: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  status: z.enum(['active', 'sold', 'removed']).optional()
});

export const ServerRoute = createServerFileRoute('/api/spipuniform/school-stock/').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const schoolId = url.searchParams.get('schoolId');
      const managedByUserId = url.searchParams.get('managedByUserId');
      const status = url.searchParams.get('status') || 'active';

      if (!schoolId || !managedByUserId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'schoolId and managedByUserId are required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if user is admin - admins can access all schools
      const [userRecord] = await db
        .select({ role: userTable.role, email: userTable.email })
        .from(userTable)
        .where(eq(userTable.id, managedByUserId))
        .limit(1);

      const isAdmin = userRecord?.role?.toLowerCase() === 'admin' || userRecord?.email === 'admin@admin.com';

      if (!isAdmin) {
        // Verify the user is authorized to manage this school's stock
        const ownerCheck = await db
          .select()
          .from(schoolOwners)
          .where(and(
            eq(schoolOwners.userId, managedByUserId),
            eq(schoolOwners.schoolId, schoolId),
            eq(schoolOwners.isActive, true)
          ));

        if (ownerCheck.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Unauthorized: User is not a school owner for this school'
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Get school stock with related data
      const stockItems = await db
        .select({
          id: schoolStock.id,
          schoolId: schoolStock.schoolId,
          managedByUserId: schoolStock.managedByUserId,
          productTypeId: schoolStock.productTypeId,
          title: schoolStock.title,
          description: schoolStock.description,
          categoryId: schoolStock.categoryId,
          attributes: schoolStock.attributes,
          hasSchoolCrest: schoolStock.hasSchoolCrest,
          conditionId: schoolStock.conditionId,
          quantity: schoolStock.quantity,
          price: schoolStock.price,
          isFree: schoolStock.isFree,
          status: schoolStock.status,
          viewCount: schoolStock.viewCount,
          createdAt: schoolStock.createdAt,
          updatedAt: schoolStock.updatedAt,
          // Related data
          schoolName: schools.name,
          productTypeName: productTypes.name,
          categoryName: productCategories.name,
          conditionName: conditions.name,
          // Image count
          imageCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${schoolStockImages}
            WHERE ${schoolStockImages.schoolStockId} = ${schoolStock.id}
          )`
        })
        .from(schoolStock)
        .leftJoin(schools, eq(schoolStock.schoolId, schools.id))
        .leftJoin(productTypes, eq(schoolStock.productTypeId, productTypes.id))
        .leftJoin(productCategories, eq(schoolStock.categoryId, productCategories.id))
        .leftJoin(conditions, eq(schoolStock.conditionId, conditions.id))
        .where(and(
          eq(schoolStock.schoolId, schoolId),
          eq(schoolStock.status, status)
        ))
        .orderBy(schoolStock.createdAt);

      return new Response(JSON.stringify({
        success: true,
        stock: stockItems
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching school stock:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch school stock'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const validatedData = createSchoolStockSchema.parse(body);

      // Check if user is admin - admins can manage all schools
      const managedByUserId = body.managedByUserId;
      const [userRecord] = await db
        .select({ role: userTable.role, email: userTable.email })
        .from(userTable)
        .where(eq(userTable.id, managedByUserId))
        .limit(1);

      const isAdmin = userRecord?.role?.toLowerCase() === 'admin' || userRecord?.email === 'admin@admin.com';

      if (!isAdmin) {
        // Verify the user is authorized to manage this school's stock
        const ownerCheck = await db
          .select()
          .from(schoolOwners)
          .where(and(
            eq(schoolOwners.userId, managedByUserId),
            eq(schoolOwners.schoolId, validatedData.schoolId),
            eq(schoolOwners.isActive, true)
          ));

        if (ownerCheck.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Unauthorized: User is not a school owner for this school'
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      const [newStock] = await db
        .insert(schoolStock)
        .values({
          schoolId: validatedData.schoolId,
          managedByUserId: managedByUserId,
          productTypeId: validatedData.productTypeId,
          title: validatedData.title,
          description: validatedData.description,
          categoryId: validatedData.categoryId,
          attributes: validatedData.attributes,
          conditionId: validatedData.conditionId,
          quantity: validatedData.quantity,
          price: validatedData.price ? validatedData.price.toString() : null,
          isFree: validatedData.isFree,
          hasSchoolCrest: validatedData.hasSchoolCrest,
          status: 'active'
        })
        .returning();

      // Handle images if provided
      if (validatedData.images && validatedData.images.length > 0) {
        await db.insert(schoolStockImages).values(
          validatedData.images.map(image => ({
            schoolStockId: newStock.id,
            fileId: image.fileId,
            altText: image.altText,
            order: image.order
          }))
        );
      }

      return new Response(JSON.stringify({
        success: true,
        stock: newStock
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error creating school stock:', error);
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid data',
          details: error.errors
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create school stock'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});