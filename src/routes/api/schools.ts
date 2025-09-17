import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { schools } from '@/db/schema';
import { asc, ilike, or, and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for school search
const schoolSearchSchema = z.object({
  query: z.string().optional(),
  county: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0)
});

export const ServerRoute = createServerFileRoute('/api/schools').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        query: url.searchParams.get('query') || undefined,
        county: url.searchParams.get('county') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '50'),
        offset: parseInt(url.searchParams.get('offset') || '0')
      };

      const validatedParams = schoolSearchSchema.parse(queryParams);

      // Build query conditions
      const conditions = [];
      
      // Only show active schools
      conditions.push(eq(schools.isActive, true));

      // Search by name or address if query provided
      if (validatedParams.query) {
        conditions.push(
          or(
            ilike(schools.name, `%${validatedParams.query}%`),
            ilike(schools.address, `%${validatedParams.query}%`)
          )
        );
      }

      // Filter by county if provided
      if (validatedParams.county) {
        conditions.push(eq(schools.county, validatedParams.county));
      }

      // Get schools with pagination
      const schoolResults = await db
        .select({
          id: schools.id,
          name: schools.name,
          address: schools.address,
          county: schools.county,
          type: schools.type,
          uniformShop: schools.uniformShop,
          website: schools.website,
          createdAt: schools.createdAt
        })
        .from(schools)
        .where(and(...conditions))
        .orderBy(asc(schools.name))
        .limit(validatedParams.limit)
        .offset(validatedParams.offset);

      // Get total count for pagination
      const [totalCount] = await db
        .select({ count: sql`count(*)` })
        .from(schools)
        .where(and(...conditions));

      return new Response(JSON.stringify({
        success: true,
        schools: schoolResults,
        pagination: {
          total: parseInt(totalCount.count),
          limit: validatedParams.limit,
          offset: validatedParams.offset,
          hasMore: (validatedParams.offset + validatedParams.limit) < parseInt(totalCount.count)
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching schools:', error);
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid parameters',
          details: error.errors
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch schools'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});