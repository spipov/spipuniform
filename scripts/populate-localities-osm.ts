#!/usr/bin/env tsx

/**
 * Script to populate localities table with data from OSM Overpass API
 * This addresses the issue where counties like Wicklow show "0 localities" 
 * but should have thousands of towns/villages/localities from OSM
 */

import 'dotenv/config';
import { db } from '@/db';
import { counties, localities } from '@/db/schema';
import { fetchTownsForCounty } from '@/lib/overpass';
import { eq } from 'drizzle-orm';

async function populateLocalitiesFromOSM() {
  console.log('🗺️  Starting OSM localities population...');

  // Get all counties
  const allCounties = await db.select().from(counties).orderBy(counties.name);
  console.log(`Found ${allCounties.length} counties in database`);

  let totalLocalitiesAdded = 0;

  for (const county of allCounties) {
    console.log(`\n📍 Processing ${county.name}...`);
    
    // Check existing localities for this county
    const existingLocalities = await db
      .select()
      .from(localities)
      .where(eq(localities.countyId, county.id));
    
    console.log(`   Existing localities: ${existingLocalities.length}`);

    // Fetch from OSM
    try {
      console.log(`   Fetching from OSM...`);
      const osmTowns = await fetchTownsForCounty(county.name.toLowerCase());
      console.log(`   OSM returned: ${osmTowns.length} localities`);

      if (osmTowns.length === 0) {
        console.log(`   ⚠️  No localities found on OSM for ${county.name}`);
        continue;
      }

      // Prepare localities to insert (avoid duplicates by name)
      const existingNames = new Set(existingLocalities.map(l => l.name.toLowerCase()));
      const newLocalities = osmTowns
        .filter(town => !existingNames.has(town.name.toLowerCase()))
        .map(town => ({
          name: town.name,
          countyId: county.id,
          centreLat: town.lat.toString(),
          centreLng: town.lon.toString(),
          osmId: town.id.toString()
        }));

      if (newLocalities.length === 0) {
        console.log(`   ✅ No new localities to add (all ${osmTowns.length} already exist)`);
        continue;
      }

      // Insert new localities in batches of 100
      const batchSize = 100;
      let inserted = 0;
      
      for (let i = 0; i < newLocalities.length; i += batchSize) {
        const batch = newLocalities.slice(i, i + batchSize);
        await db.insert(localities).values(batch);
        inserted += batch.length;
        console.log(`   📝 Inserted batch: ${inserted}/${newLocalities.length}`);
      }

      totalLocalitiesAdded += inserted;
      console.log(`   ✅ Added ${inserted} new localities to ${county.name}`);
      console.log(`   📊 ${county.name} now has ${existingLocalities.length + inserted} localities`);

      // Small delay to be nice to OSM
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`   ❌ Error processing ${county.name}:`, error);
    }
  }

  console.log(`\n🎉 Completed! Added ${totalLocalitiesAdded} localities total`);
  
  // Show summary
  console.log('\n📊 Final Summary:');
  for (const county of allCounties) {
    const localityCount = await db
      .select()
      .from(localities)
      .where(eq(localities.countyId, county.id));
    
    console.log(`   ${county.name}: ${localityCount.length} localities`);
  }
}

// Schema is already correctly defined in spipuniform.ts

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  populateLocalitiesFromOSM()
    .then(() => {
      console.log('\n🏁 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}
