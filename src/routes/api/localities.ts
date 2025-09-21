import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { localities, counties } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

const localitiesQuerySchema = z.object({
  county: z.string().uuid().optional()
});

export const ServerRoute = createServerFileRoute('/api/localities').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        county: url.searchParams.get('county') || undefined
      };

      const validatedParams = localitiesQuerySchema.parse(queryParams);

      // Try to get localities from database
      let allLocalities: any[] = [];

      try {
        // Build query conditions
        const conditions = [];
        if (validatedParams.county) {
          conditions.push(eq(localities.countyId, validatedParams.county));
        }

        // Get localities with county information
        const dbLocalities = await db
          .select({
            id: localities.id,
            name: localities.name,
            countyId: localities.countyId,
            county: {
              id: counties.id,
              name: counties.name
            },
            createdAt: localities.createdAt
          })
          .from(localities)
          .leftJoin(counties, eq(localities.countyId, counties.id))
          .where(conditions.length > 0 ? conditions[0] : undefined)
          .orderBy(asc(localities.name));

        allLocalities = dbLocalities.map(l => ({
          id: l.id,
          name: l.name,
          countyId: l.countyId,
          countyName: l.county?.name,
          createdAt: l.createdAt
        }));

      } catch (dbError) {
        // If database query fails (table doesn't exist, connection issues, etc.)
        // return empty array - the frontend will use fallback data
        console.warn('Database query failed for localities, returning empty results:', dbError);
        allLocalities = [];
      }

      return new Response(JSON.stringify({
        success: true,
        localities: allLocalities
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching localities:', error);
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
        error: 'Failed to fetch localities'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});