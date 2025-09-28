/**
 * Overpass API integration for fetching Irish geographic data
 * Based on overpass_setup.md specifications
 */

export interface TownItem {
  id: number;
  name: string;
  placeType: string;
  lat: number;
  lon: number;
}

export interface CountyBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const TIMEOUT = 25; // seconds
const USER_AGENT = 'SpipUniform/1.0';

// Rate limiting and retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds
const MIN_REQUEST_INTERVAL = 500; // Minimum 500ms between requests

// Rate limiting state
let lastRequestTime = 0;
let requestQueue: Array<() => void> = [];
let isProcessingQueue = false;

// Cache implementation
const cache = new Map<string, { data: any; expires: number }>();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttlMinutes: number): void {
   cache.set(key, {
     data,
     expires: Date.now() + ttlMinutes * 60 * 1000
   });
 }

/**
 * Rate limiting function to ensure minimum interval between requests
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  lastRequestTime = Date.now();
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
  return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * Build Overpass QL query to resolve county area
 */
function buildAreaQueryForCounty(countyName: string): string {
  const normalizedCounty = countyName.charAt(0).toUpperCase() + countyName.slice(1);
  
  return `
    [out:json][timeout:${TIMEOUT}];
    (
      area["boundary"="administrative"]["admin_level"~"^(6|7)$"]["name"="${normalizedCounty}"];
      area["boundary"="administrative"]["admin_level"~"^(6|7)$"]["name"="County ${normalizedCounty}"];
    )->.county_area;
    .county_area out geom;
  `;
}

// Hardcoded Irish county bounds as fallback when OSM fails
const IRISH_COUNTY_BOUNDS: Record<string, CountyBounds> = {
  wicklow: { minLat: 52.8, maxLat: 53.3, minLon: -6.8, maxLon: -5.9 },
  dublin: { minLat: 53.2, maxLat: 53.6, minLon: -6.6, maxLon: -6.0 },
  cork: { minLat: 51.3, maxLat: 52.3, minLon: -10.0, maxLon: -7.8 },
  galway: { minLat: 53.0, maxLat: 53.8, minLon: -10.2, maxLon: -8.4 },
  kerry: { minLat: 51.6, maxLat: 52.4, minLon: -10.5, maxLon: -9.3 },
  mayo: { minLat: 53.5, maxLat: 54.3, minLon: -10.3, maxLon: -8.7 },
  donegal: { minLat: 54.6, maxLat: 55.4, minLon: -8.6, maxLon: -7.3 },
  limerick: { minLat: 52.3, maxLat: 52.8, minLon: -9.0, maxLon: -8.2 },
  tipperary: { minLat: 52.3, maxLat: 53.0, minLon: -8.3, maxLon: -7.3 },
  waterford: { minLat: 52.0, maxLat: 52.4, minLon: -8.0, maxLon: -7.0 },
  kilkenny: { minLat: 52.2, maxLat: 52.8, minLon: -7.7, maxLon: -6.9 },
  wexford: { minLat: 52.1, maxLat: 52.7, minLon: -7.0, maxLon: -6.1 },
  carlow: { minLat: 52.6, maxLat: 52.9, minLon: -7.0, maxLon: -6.7 },
  laois: { minLat: 52.8, maxLat: 53.3, minLon: -7.9, maxLon: -7.1 },
  kildare: { minLat: 53.1, maxLat: 53.5, minLon: -7.3, maxLon: -6.5 },
  meath: { minLat: 53.3, maxLat: 53.8, minLon: -7.3, maxLon: -6.4 },
  louth: { minLat: 53.7, maxLat: 54.1, minLon: -6.8, maxLon: -6.1 },
  westmeath: { minLat: 53.3, maxLat: 53.7, minLon: -7.9, maxLon: -7.1 },
  offaly: { minLat: 53.0, maxLat: 53.5, minLon: -8.0, maxLon: -7.1 },
  longford: { minLat: 53.6, maxLat: 53.9, minLon: -8.0, maxLon: -7.5 },
  roscommon: { minLat: 53.6, maxLat: 54.1, minLon: -8.8, maxLon: -7.9 },
  sligo: { minLat: 54.1, maxLat: 54.5, minLon: -8.9, maxLon: -8.2 },
  leitrim: { minLat: 54.0, maxLat: 54.5, minLon: -8.3, maxLon: -7.8 },
  cavan: { minLat: 53.9, maxLat: 54.4, minLon: -7.9, maxLon: -6.8 },
  monaghan: { minLat: 54.0, maxLat: 54.4, minLon: -7.5, maxLon: -6.8 },
  clare: { minLat: 52.6, maxLat: 53.2, minLon: -9.9, maxLon: -8.4 }
};

/**
 * Get county bounding box for fallback queries
 */
export async function getCountyBounds(countyName: string): Promise<CountyBounds | null> {
  const cacheKey = `county_bounds_${countyName.toLowerCase()}`;
  const cached = getCached<CountyBounds>(cacheKey);
  if (cached) return cached;

  // Try hardcoded bounds first for Irish counties
  const hardcodedBounds = IRISH_COUNTY_BOUNDS[countyName.toLowerCase()];
  if (hardcodedBounds) {
    setCache(cacheKey, hardcodedBounds, 60); // Cache for 1 hour
    return hardcodedBounds;
  }

  try {
    const query = buildAreaQueryForCounty(countyName);
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`Overpass API error: ${response.status} - Rate limited. Please try again later.`);
      }
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.elements || data.elements.length === 0) {
      console.warn(`No area found for county: ${countyName}`);
      return null;
    }

    // Find bounding box from geometry
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;

    for (const element of data.elements) {
      if (element.bounds) {
        minLat = Math.min(minLat, element.bounds.minlat);
        maxLat = Math.max(maxLat, element.bounds.maxlat);
        minLon = Math.min(minLon, element.bounds.minlon);
        maxLon = Math.max(maxLon, element.bounds.maxlon);
      }
      
      if (element.geometry) {
        for (const coord of element.geometry) {
          minLat = Math.min(minLat, coord.lat);
          maxLat = Math.max(maxLat, coord.lat);
          minLon = Math.min(minLon, coord.lon);
          maxLon = Math.max(maxLon, coord.lon);
        }
      }
    }

    if (minLat === Infinity) {
      console.warn(`No valid bounds found for county: ${countyName}`);
      return null;
    }

    const bounds = { minLat, maxLat, minLon, maxLon };
    setCache(cacheKey, bounds, 60); // Cache for 1 hour
    return bounds;

  } catch (error) {
    console.error(`Error fetching county bounds for ${countyName}:`, error);
    return null;
  }
}

/**
 * Fetch all towns/localities within a county
 */
export async function fetchTownsForCounty(countyName: string): Promise<TownItem[]> {
  const cacheKey = `towns_${countyName.toLowerCase()}`;
  const cached = getCached<TownItem[]>(cacheKey);
  if (cached) return cached;

  try {
    // First try area-based query
    const areaQuery = await buildTownsQuery(countyName, false);
    let towns = areaQuery ? await executeTownsQuery(areaQuery) : [];

    // If no results or few results, try bounding box fallback
    if (towns.length < 10) {
      console.log(`Area query returned ${towns.length} towns for ${countyName}, trying bbox fallback`);
      const bboxQuery = await buildTownsQuery(countyName, true);
      if (bboxQuery) {
        const bboxTowns = await executeTownsQuery(bboxQuery);
        if (bboxTowns.length > towns.length) {
          towns = bboxTowns;
        }
      }
    }

    // Dedupe and sort
    const uniqueTowns = deduplicateTowns(towns);
    const sortedTowns = uniqueTowns.sort((a, b) => a.name.localeCompare(b.name));

    setCache(cacheKey, sortedTowns, 5); // Cache for 5 minutes
    return sortedTowns;

  } catch (error) {
    console.error(`Error fetching towns for ${countyName}:`, error);
    return [];
  }
}

async function buildTownsQuery(countyName: string, useBbox: boolean): Promise<string | null> {
  const normalizedCounty = countyName.charAt(0).toUpperCase() + countyName.slice(1);

  if (useBbox) {
    const bounds = await getCountyBounds(countyName);
    if (!bounds) return null;

    return `
      [out:json][timeout:${TIMEOUT}];
      (
        nwr["place"~"^(city|town|village|hamlet|locality|suburb)$"]["name"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
        nwr["natural"~"^(bay|beach)$"]["name"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
        nwr["tourism"~"^(attraction|resort)$"]["name"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
      );
      out center;
    `;
  } else {
    return `
      [out:json][timeout:${TIMEOUT}];
      area["boundary"="administrative"]["admin_level"~"^(6|7)$"]["name"~"^(${normalizedCounty}|County ${normalizedCounty})$"]->.county_area;
      (
        nwr["place"~"^(city|town|village|hamlet|locality|suburb)$"]["name"](area.county_area);
        nwr["natural"~"^(bay|beach)$"]["name"](area.county_area);
        nwr["tourism"~"^(attraction|resort)$"]["name"](area.county_area);
      );
      out center;
    `;
  }
}

async function executeTownsQuery(query: string): Promise<TownItem[]> {
   let lastError: Error | null = null;

   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
     try {
       // Enforce rate limiting
       await enforceRateLimit();

       const response = await fetch(OVERPASS_ENDPOINT, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
           'User-Agent': USER_AGENT,
         },
         body: `data=${encodeURIComponent(query)}`
       });

       if (!response.ok) {
         const errorMessage = `Overpass API error: ${response.status}`;

         // Handle rate limiting (429) with exponential backoff
         if (response.status === 429) {
           if (attempt === MAX_RETRIES) {
             throw new Error(`${errorMessage} - Rate limited after ${MAX_RETRIES} attempts. Please try again later.`);
           }

           const delay = getRetryDelay(attempt);
           console.warn(`Rate limited (429), retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
           await sleep(delay);
           continue;
         }

         // For other errors, don't retry
         throw new Error(errorMessage);
       }

       const data = await response.json();

       if (!data.elements) {
         return [];
       }

       return data.elements
         .filter((element: any) => element.tags?.name && (element.lat || element.center))
         .map((element: any) => ({
           id: element.id,
           name: element.tags.name,
           placeType: element.tags.place || element.tags.natural || element.tags.tourism || 'locality',
           lat: element.lat || element.center?.lat,
           lon: element.lon || element.center?.lon
         }))
         .filter((town: TownItem) => town.lat && town.lon && town.name);

     } catch (error) {
       lastError = error instanceof Error ? error : new Error('Unknown error');
       console.error(`Attempt ${attempt} failed:`, lastError.message);

       // If this is the last attempt, throw the error
       if (attempt === MAX_RETRIES) {
         throw lastError;
       }

       // For non-429 errors, don't retry
       if (error instanceof Error && error.message.includes('429')) {
         const delay = getRetryDelay(attempt);
         console.warn(`Retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
         await sleep(delay);
       } else {
         throw lastError;
       }
     }
   }

   // This should never be reached, but TypeScript requires it
   throw lastError || new Error('Unknown error in executeTownsQuery');
 }

function deduplicateTowns(towns: TownItem[]): TownItem[] {
  const seen = new Set<string>();
  return towns.filter(town => {
    const key = town.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Search places in county with query string
 */
export async function searchPlacesInCounty(countyName: string, query: string): Promise<TownItem[]> {
  if (query.length < 1) return [];

  const cacheKey = `search_${countyName.toLowerCase()}_${query.toLowerCase()}`;
  const cached = getCached<TownItem[]>(cacheKey);
  if (cached) return cached;

  try {
    // First check if we have cached towns for this county
    const cachedTowns = getCached<TownItem[]>(`towns_${countyName.toLowerCase()}`);
    if (cachedTowns) {
      const filtered = cachedTowns.filter(town => 
        town.name.toLowerCase().includes(query.toLowerCase())
      );
      setCache(cacheKey, filtered, 20); // Cache search results for 20 minutes
      return filtered;
    }

    // Otherwise do a direct search query
    const bounds = await getCountyBounds(countyName);
    if (!bounds) return [];

    const searchQuery = `
      [out:json][timeout:${TIMEOUT}];
      (
        nwr["place"~"^(city|town|village|hamlet|locality|suburb)$"]["name"~"${query}",i](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
        nwr["natural"~"^(bay|beach)$"]["name"~"${query}",i](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
        nwr["tourism"~"^(attraction|resort)$"]["name"~"${query}",i](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
      );
      out center;
    `;

    const results = await executeTownsQuery(searchQuery);
    const deduped = deduplicateTowns(results);
    
    setCache(cacheKey, deduped, 20);
    return deduped;

  } catch (error) {
    console.error(`Error searching places in ${countyName}:`, error);
    return [];
  }
}