import { createServerFileRoute } from '@tanstack/react-start/server';
import { searchPlacesInCounty, fetchTownsForCounty } from '@/lib/overpass';
import { db } from '@/db';
import { counties } from '@/db/schema';
import { eq } from 'drizzle-orm';

// In-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttlMinutes: number) {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMinutes * 60 * 1000
  });
}

export const ServerRoute = createServerFileRoute('/api/localities/search').methods({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const countyId = url.searchParams.get('countyId');
      const search = url.searchParams.get('search') || '';

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
      const cacheKey = `osm:${countyName}:${search}`;

      // Check cache first
      const cached = getCached(cacheKey);
      if (cached) {
        return new Response(JSON.stringify({
          success: true,
          localities: cached,
          cached: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Fetch from OSM
      let localities = [];
      if (search && search.trim().length >= 2) {
        // Search specific localities
        localities = await searchPlacesInCounty(countyName, search.trim()) || [];
      } else {
        // For initial load, return top 20 most common localities
        localities = await fetchTownsForCounty(countyName) || [];
        localities = localities.slice(0, 20); // Limit to top 20 to avoid bloat
      }

      // Format results
      const formatted = localities.map(loc => ({
        id: `osm_${loc.id}`,
        name: loc.name,
        displayName: loc.name,
        placeType: loc.placeType,
        lat: loc.lat,
        lon: loc.lon
      }));

      // Cache for 10 minutes
      setCache(cacheKey, formatted, 10);

      return new Response(JSON.stringify({
        success: true,
        localities: formatted,
        cached: false
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error searching localities:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to search localities';
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('Rate limited')) {
          userMessage = 'Service is temporarily busy. Please wait a moment and try again.';
          statusCode = 429;
        } else if (error.message.includes('timeout')) {
          userMessage = 'Search is taking longer than expected. Please try again.';
        } else if (error.message.includes('Network')) {
          userMessage = 'Network error. Please check your connection and try again.';
        }
      }

      return new Response(JSON.stringify({
        success: false,
        error: userMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});

