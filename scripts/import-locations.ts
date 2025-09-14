import 'dotenv/config';
import { db } from '@/db';
import { counties, localities } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name: string;
    'name:en'?: string;
    'name:ga'?: string;
    admin_level?: string;
    boundary?: string;
    place?: string;
    [key: string]: string | undefined;
  };
  bounds?: {
    minlat: number;
    minlon: number;
    maxlat: number;
    maxlon: number;
  };
}

/**
 * Query Overpass API for Irish counties and localities
 */
async function queryOverpassAPI(query: string): Promise<OverpassResponse> {
  const url = 'https://overpass-api.de/api/interpreter';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Import Irish counties from OSM
 */
async function importCounties() {
  console.log('🌍 Fetching Irish counties from OSM...');

  // Overpass query for Irish counties (admin_level=6)
  const query = `
    [out:json][timeout:30];
    (
      relation["ISO3166-1"="IE"]["admin_level"="6"]["boundary"="administrative"];
    );
    out geom;
  `;

  try {
    const response = await queryOverpassAPI(query);
    console.log(`Found ${response.elements.length} county elements from OSM`);

    let imported = 0;
    let skipped = 0;

    for (const element of response.elements) {
      if (!element.tags?.name) continue;

      const countyName = element.tags.name;
      
      // Clean up county name (remove "County " prefix if present)
      const cleanName = countyName.replace(/^County\s+/i, '').trim();

      // Check if county already exists
      const existing = await db
        .select()
        .from(counties)
        .where(eq(counties.name, cleanName))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Insert county
      await db.insert(counties).values({
        name: cleanName,
        osmId: element.id.toString(),
        boundingBox: element.bounds ? {
          minLat: element.bounds.minlat,
          minLon: element.bounds.minlon,
          maxLat: element.bounds.maxlat,
          maxLon: element.bounds.maxlon,
        } : null,
      });

      imported++;
      console.log(`✅ Imported county: ${cleanName}`);
    }

    console.log(`Counties: ${imported} imported, ${skipped} skipped`);
    return imported;
  } catch (error) {
    console.error('Error importing counties:', error);
    throw error;
  }
}

/**
 * Import localities for a specific county
 */
async function importLocalitiesForCounty(countyId: string, countyName: string, osmId: string) {
  console.log(`🏘️ Fetching localities for ${countyName}...`);

  // Query for towns, villages, and other settlements in this county
  const query = `
    [out:json][timeout:30];
    (
      relation(${osmId});
      map_to_area -> .county;
    );
    (
      node["place"~"^(city|town|village|hamlet|suburb)$"](area.county);
    );
    out center;
  `;

  try {
    const response = await queryOverpassAPI(query);
    console.log(`  Found ${response.elements.length} locality elements for ${countyName}`);

    let imported = 0;
    let skipped = 0;

    for (const element of response.elements) {
      if (!element.tags?.name || !element.lat || !element.lon) continue;

      const localityName = element.tags.name;

      // Check if locality already exists in this county
      const existing = await db
        .select()
        .from(localities)
        .where(eq(localities.name, localityName))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Insert locality
      await db.insert(localities).values({
        name: localityName,
        countyId: countyId,
        osmId: element.id.toString(),
        centreLat: element.lat.toString(),
        centreLng: element.lon.toString(),
      });

      imported++;
    }

    console.log(`  ${countyName}: ${imported} localities imported, ${skipped} skipped`);
    return imported;
  } catch (error) {
    console.error(`Error importing localities for ${countyName}:`, error);
    return 0;
  }
}

/**
 * Alternative approach: Import major Irish towns and cities directly
 */
async function importMajorLocalities() {
  console.log('🏙️ Fetching major Irish cities and towns...');

  // Query for major cities, towns in Ireland
  const query = `
    [out:json][timeout:30];
    (
      node["place"~"^(city|town)$"]["country"="IE"];
      node["place"~"^(city|town)$"]["addr:country"="IE"];
      node["place"~"^(city|town)$"]["is_in:country"="Ireland"];
    );
    out;
  `;

  try {
    const response = await queryOverpassAPI(query);
    console.log(`Found ${response.elements.length} major locality elements`);

    // Group by county using the county information from tags
    const localitiesByCounty: { [county: string]: OverpassElement[] } = {};

    for (const element of response.elements) {
      if (!element.tags?.name) continue;

      // Try to extract county from various tag fields
      let countyName = element.tags['addr:county'] || 
                       element.tags['is_in:county'] ||
                       element.tags['county'];

      if (countyName) {
        countyName = countyName.replace(/^County\s+/i, '').trim();
        if (!localitiesByCounty[countyName]) {
          localitiesByCounty[countyName] = [];
        }
        localitiesByCounty[countyName].push(element);
      }
    }

    // Import localities grouped by county
    let totalImported = 0;

    for (const [countyName, localityElements] of Object.entries(localitiesByCounty)) {
      // Find the county in our database
      const countyResult = await db
        .select()
        .from(counties)
        .where(eq(counties.name, countyName))
        .limit(1);

      if (countyResult.length === 0) {
        console.warn(`⚠️ County not found in database: ${countyName}`);
        continue;
      }

      const county = countyResult[0];

      for (const element of localityElements) {
        if (!element.tags?.name || !element.lat || !element.lon) continue;

        const localityName = element.tags.name;

        // Check if locality already exists
        const existing = await db
          .select()
          .from(localities)
          .where(eq(localities.name, localityName))
          .limit(1);

        if (existing.length > 0) continue;

        // Insert locality
        await db.insert(localities).values({
          name: localityName,
          countyId: county.id,
          osmId: element.id.toString(),
          centreLat: element.lat.toString(),
          centreLng: element.lon.toString(),
        });

        totalImported++;
        console.log(`✅ ${countyName}: ${localityName}`);
      }
    }

    console.log(`Major localities: ${totalImported} imported`);
    return totalImported;
  } catch (error) {
    console.error('Error importing major localities:', error);
    return 0;
  }
}

/**
 * Manually add commonly known Irish counties if OSM data is incomplete
 */
async function ensureIrishCounties() {
  console.log('🇮🇪 Ensuring all Irish counties are present...');

  const irishCounties = [
    'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry', 
    'Donegal', 'Down', 'Dublin', 'Fermanagh', 'Galway', 'Kerry', 
    'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford',
    'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon',
    'Sligo', 'Tipperary', 'Tyrone', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow'
  ];

  let added = 0;

  for (const countyName of irishCounties) {
    const existing = await db
      .select()
      .from(counties)
      .where(eq(counties.name, countyName))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(counties).values({
        name: countyName,
        osmId: null,
        boundingBox: null,
      });
      added++;
      console.log(`➕ Added missing county: ${countyName}`);
    }
  }

  console.log(`Manual counties: ${added} added`);
  return added;
}

/**
 * Manually add major Irish cities/towns if needed
 */
async function ensureMajorIrishTowns() {
  console.log('🏙️ Ensuring major Irish towns are present...');

  const majorTowns = [
    // Major cities and towns by county
    { name: 'Dublin', county: 'Dublin' },
    { name: 'Cork', county: 'Cork' },
    { name: 'Galway', county: 'Galway' },
    { name: 'Limerick', county: 'Limerick' },
    { name: 'Waterford', county: 'Waterford' },
    { name: 'Drogheda', county: 'Louth' },
    { name: 'Dundalk', county: 'Louth' },
    { name: 'Bray', county: 'Wicklow' },
    { name: 'Navan', county: 'Meath' },
    { name: 'Kilkenny', county: 'Kilkenny' },
    { name: 'Sligo', county: 'Sligo' },
    { name: 'Carlow', county: 'Carlow' },
    { name: 'Tralee', county: 'Kerry' },
    { name: 'Athlone', county: 'Westmeath' },
    { name: 'Portlaoise', county: 'Laois' },
    { name: 'Wexford', county: 'Wexford' },
    { name: 'Mullingar', county: 'Westmeath' },
    { name: 'Letterkenny', county: 'Donegal' },
    { name: 'Celbridge', county: 'Kildare' },
    { name: 'Naas', county: 'Kildare' },
  ];

  let added = 0;

  for (const town of majorTowns) {
    // Find county
    const countyResult = await db
      .select()
      .from(counties)
      .where(eq(counties.name, town.county))
      .limit(1);

    if (countyResult.length === 0) continue;

    // Check if locality exists
    const existing = await db
      .select()
      .from(localities)
      .where(eq(localities.name, town.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(localities).values({
        name: town.name,
        countyId: countyResult[0].id,
        osmId: null,
        centreLat: null,
        centreLng: null,
      });
      added++;
      console.log(`➕ Added ${town.name}, ${town.county}`);
    }
  }

  console.log(`Manual towns: ${added} added`);
  return added;
}

/**
 * Main import function
 */
async function importLocations() {
  console.log('📍 Starting location import process...\n');

  try {
    let totalCounties = 0;
    let totalLocalities = 0;

    // Step 1: Import counties from OSM
    try {
      const importedCounties = await importCounties();
      totalCounties += importedCounties;
    } catch (error) {
      console.warn('⚠️ OSM county import failed, continuing with manual approach');
    }

    // Step 2: Ensure all Irish counties are present
    const manualCounties = await ensureIrishCounties();
    totalCounties += manualCounties;

    // Step 3: Import major localities from OSM
    try {
      const importedLocalities = await importMajorLocalities();
      totalLocalities += importedLocalities;
    } catch (error) {
      console.warn('⚠️ OSM locality import failed, continuing with manual approach');
    }

    // Step 4: Ensure major Irish towns are present
    const manualTowns = await ensureMajorIrishTowns();
    totalLocalities += manualTowns;

    // Final summary
    const finalCounties = await db.select().from(counties);
    const finalLocalities = await db.select().from(localities);

    console.log('\n🎉 Location import completed!');
    console.log(`📊 Final counts:`);
    console.log(`  Counties: ${finalCounties.length}`);
    console.log(`  Localities: ${finalLocalities.length}`);

    // Show some examples
    console.log('\n📋 Sample counties:');
    finalCounties.slice(0, 5).forEach(county => {
      console.log(`  - ${county.name}`);
    });

    console.log('\n🏘️ Sample localities:');
    finalLocalities.slice(0, 10).forEach(locality => {
      console.log(`  - ${locality.name}`);
    });

  } catch (error) {
    console.error('❌ Error during location import:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importLocations()
    .then(() => {
      console.log('✅ Location import process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Location import process failed:', error);
      process.exit(1);
    });
}

export { importLocations };