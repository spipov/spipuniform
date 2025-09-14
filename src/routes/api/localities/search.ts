import { createServerFileRoute } from '@tanstack/react-start/server';
import { searchPlacesInCounty, fetchTownsForCounty } from '@/lib/overpass';
import { db } from '@/db';
import { counties } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const ServerRoute = createServerFileRoute('/api/localities/search').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const countyId = url.searchParams.get('countyId');
      const query = url.searchParams.get('q');

      if (!countyId) {
        return new Response(
          JSON.stringify({ success: false, error: 'County ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get county name
      const county = await db
        .select({ name: counties.name })
        .from(counties)
        .where(eq(counties.id, countyId))
        .limit(1);

      if (!county.length) {
        return new Response(
          JSON.stringify({ success: false, error: 'County not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const countyName = county[0].name.toLowerCase();
      let localities = [];

      if (query && query.trim().length > 0) {
        // Search specific localities matching the query
        localities = await searchPlacesInCounty(countyName, query.trim()) || [];
      } else {
        // When no search query, return empty array to encourage searching
        // This prevents loading thousands of localities upfront
        localities = [];
      }

      return new Response(JSON.stringify({
        success: true,
        localities: (localities || []).map(loc => ({
          id: `osm_${loc.id}`,
          name: loc.name,
          placeType: loc.placeType,
          lat: loc.lat,
          lon: loc.lon,
          isOSM: true
        })),
        total: localities.length,
        hasQuery: !!(query && query.trim().length > 0)
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error searching localities:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to search localities',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});