import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { localities, counties } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/spipuniform/localities/').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const countyId = url.searchParams.get('countyId');
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      if (!countyId) {
        return new Response(
          JSON.stringify({ success: false, error: 'County ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify county exists
      const county = await db
        .select({ id: counties.id, name: counties.name })
        .from(counties)
        .where(eq(counties.id, countyId))
        .limit(1);

      if (!county.length) {
        return new Response(
          JSON.stringify({ success: false, error: 'County not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get localities for the county
      const result = await db
        .select({
          id: localities.id,
          name: localities.name,
          countyId: localities.countyId,
          createdAt: localities.createdAt,
          updatedAt: localities.updatedAt
        })
        .from(localities)
        .where(eq(localities.countyId, countyId))
        .orderBy(localities.name)
        .limit(limit)
        .offset(offset);

      // Get total count
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(localities)
        .where(eq(localities.countyId, countyId));

      const totalCount = countResult[0] || { count: '0' };

      return new Response(JSON.stringify({
        success: true,
        localities: result,
        pagination: {
          total: parseInt(totalCount.count as string),
          limit,
          offset,
          hasMore: (offset + limit) < parseInt(totalCount.count as string)
        }
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
  }
});