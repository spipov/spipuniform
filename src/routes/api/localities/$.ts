import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { localities, schools } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/localities/$').methods({
  GET: async ({ request, params }) => {
    try {
      const countyId = params._;

      const result = await db
        .select({
          id: localities.id,
          name: localities.name,
          schoolCount: sql<number>`COUNT(DISTINCT ${schools.id})`
        })
        .from(localities)
        .leftJoin(schools, eq(schools.localityId, localities.id))
        .where(eq(localities.countyId, countyId))
        .groupBy(localities.id, localities.name)
        .orderBy(localities.name);

      return new Response(JSON.stringify({
        success: true,
        localities: result
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching localities:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch localities' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});