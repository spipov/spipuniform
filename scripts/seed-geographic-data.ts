import 'dotenv/config';
import { db } from '@/db';
import { counties, localities } from '@/db/schema';
import { fallbackCounties, fallbackLocalities } from '@/data/irish-geographic-data';

async function seedGeographicData() {
  try {
    console.log('🌱 Starting geographic data seeding...');

    // Insert counties
    console.log('📍 Inserting counties...');
    const insertedCounties = await db
      .insert(counties)
      .values(fallbackCounties.map(county => ({
        id: county.id,
        name: county.name,
        osmId: null,
        boundingBox: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })))
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Inserted ${insertedCounties.length} counties`);

    // Insert localities
    console.log('🏘️ Inserting localities...');
    const insertedLocalities = await db
      .insert(localities)
      .values(fallbackLocalities.map(locality => ({
        id: locality.id,
        name: locality.name,
        countyId: locality.countyId,
        osmId: null,
        centreLat: null,
        centreLng: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })))
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Inserted ${insertedLocalities.length} localities`);

    console.log('🎉 Geographic data seeding completed successfully!');
    console.log(`📊 Total: ${insertedCounties.length} counties, ${insertedLocalities.length} localities`);

  } catch (error) {
    console.error('❌ Error seeding geographic data:', error);
    throw error;
  }
}

// Run the seeder if this script is executed directly
seedGeographicData()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

export { seedGeographicData };