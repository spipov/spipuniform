import { createServerFileRoute } from '@tanstack/react-start/server';
import { fetchTownsForCounty } from '@/lib/overpass';

export const ServerRoute = createServerFileRoute('/api/localities/fetch/$').methods({
  GET: async ({ request, params }) => {
    try {
      const countyName = params._;

      if (!countyName || countyName.length < 2) {
        return new Response(
          JSON.stringify({ success: false, error: 'Valid county name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Fetching localities from OSM for county: ${countyName}`);
      const towns = await fetchTownsForCounty(countyName);

      return new Response(JSON.stringify({
        success: true,
        county: countyName,
        localities: towns,
        count: towns.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching localities from OSM:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch localities from OSM',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});