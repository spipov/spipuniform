import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { counties, localities, schools } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/counties/').methods({
  GET: async ({ request }) => {
    try {
      const result = await db
        .select({
          id: counties.id,
          name: counties.name,
          localityCount: sql<number>`COUNT(DISTINCT ${localities.id})`,
          schoolCount: sql<number>`COUNT(DISTINCT ${schools.id})`
        })
        .from(counties)
        .leftJoin(localities, sql`${localities.countyId} = ${counties.id}`)
        .leftJoin(schools, sql`${schools.countyId} = ${counties.id}`)
        .groupBy(counties.id, counties.name)
        .orderBy(counties.name);

      return new Response(JSON.stringify({
        success: true,
        counties: result
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching counties:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch counties' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});