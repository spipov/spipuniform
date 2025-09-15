import 'dotenv/config';
import { db } from '../src/db';
import { productCategories, productTypes, conditions } from '../src/db/schema';

async function clearProductData() {
  try {
    console.log('Clearing product data...');
    
    // Clear in reverse order due to foreign key constraints
    await db.delete(productTypes);
    console.log('Cleared product types');
    
    await db.delete(productCategories);
    console.log('Cleared product categories');
    
    await db.delete(conditions);
    console.log('Cleared conditions');
    
    console.log('Product data cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing product data:', error);
    process.exit(1);
  }
}

clearProductData();