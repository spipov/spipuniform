import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { counties } from '@/db/schema';
import { asc } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/counties').methods({
  GET: async ({ request }) => {
    try {
      // Try to get counties from database
      let allCounties: any[] = [];

      try {
        allCounties = await db
          .select({
            id: counties.id,
            name: counties.name,
            createdAt: counties.createdAt
          })
          .from(counties)
          .orderBy(asc(counties.name));
      } catch (dbError) {
        // If database query fails (table doesn't exist, connection issues, etc.)
        // return empty array - the frontend will use fallback data
        console.warn('Database query failed for counties, returning empty results:', dbError);
        allCounties = [];
      }

      return new Response(JSON.stringify({
        success: true,
        counties: allCounties
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error fetching counties:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch counties'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});