import { createServerFileRoute } from '@tanstack/react-start/server';
import { db } from '@/db';
import { counties } from '@/db/schema';
import { asc } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/counties').methods({
  GET: async ({ request }) => {
    try {
      // Get all counties ordered by name
      const allCounties = await db
        .select({
          id: counties.id,
          name: counties.name,
          createdAt: counties.createdAt
        })
        .from(counties)
        .orderBy(asc(counties.name));
      
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