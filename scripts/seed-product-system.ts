import 'dotenv/config';
import { db } from '../src/db';
import { productCategories, productTypes, conditions } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function seedProductSystem() {
  try {
    console.log('Product system seed initialized...');
    console.log('No default data will be seeded. Use the admin UI to create categories, types, and conditions manually.');
    console.log('Product system is ready for manual data entry.');
  } catch (error) {
    console.error('Error initializing product system:', error);
    process.exit(1);
  }
}

seedProductSystem();