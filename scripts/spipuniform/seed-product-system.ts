#!/usr/bin/env tsx

import 'dotenv/config';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { 
  productCategories, 
  productTypes, 
  attributes, 
  attributeValues, 
  conditions 
} from '@/db/schema';

console.log('🌱 Starting product system seeding...');

async function seedProductSystem() {
  try {
    // 1. Create Product Categories
    console.log('📦 Creating product categories...');
    
    const categories = [
      {
        name: 'Shirts & Blouses',
        slug: 'shirts-blouses', 
        description: 'School shirts, polo shirts, blouses',
        sortOrder: 1
      },
      {
        name: 'Trousers & Skirts',
        slug: 'trousers-skirts',
        description: 'School trousers, skirts, shorts',
        sortOrder: 2
      },
      {
        name: 'Knitwear',
        slug: 'knitwear',
        description: 'School jumpers, cardigans, vests',
        sortOrder: 3
      },
      {
        name: 'Outerwear', 
        slug: 'outerwear',
        description: 'School jackets, coats, blazers',
        sortOrder: 4
      },
      {
        name: 'Footwear',
        slug: 'footwear', 
        description: 'School shoes, runners, boots',
        sortOrder: 5
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Ties, belts, hats, bags, socks',
        sortOrder: 6
      },
      {
        name: 'PE & Sports',
        slug: 'pe-sports',
        description: 'PE uniforms, sports gear, tracksuits',
        sortOrder: 7
      }
    ];

    const insertedCategories = await db.insert(productCategories)
      .values(categories)
      .onConflictDoNothing({ target: productCategories.slug })
      .returning();
      
    // If no categories were inserted (already exist), fetch them
    let allCategories = insertedCategories;
    if (insertedCategories.length === 0) {
      allCategories = await db.select().from(productCategories);
    }
    
    console.log(`✅ Categories ready: ${allCategories.length} total (${insertedCategories.length} new)`);

    // 2. Create Conditions
    console.log('⭐ Creating conditions...');
    
    const conditionsData = [
      { name: 'New', description: 'Brand new with tags', order: 1 },
      { name: 'Excellent', description: 'Like new, minimal wear', order: 2 },
      { name: 'Very Good', description: 'Light wear, good condition', order: 3 },
      { name: 'Good', description: 'Some wear but still good', order: 4 },
      { name: 'Fair', description: 'Noticeable wear but usable', order: 5 },
      { name: 'Poor', description: 'Heavy wear, may need repair', order: 6 }
    ];

    const insertedConditions = await db.insert(conditions)
      .values(conditionsData)
      .onConflictDoNothing({ target: conditions.name })
      .returning();
      
    // If no conditions were inserted (already exist), fetch them
    let allConditions = insertedConditions;
    if (insertedConditions.length === 0) {
      allConditions = await db.select().from(conditions);
    }
      
    console.log(`✅ Conditions ready: ${allConditions.length} total (${insertedConditions.length} new)`);

    // 3. Create Product Types with Attributes
    console.log('👕 Creating product types and attributes...');

    // Find category IDs
    const shirtsCategory = allCategories.find(c => c.slug === 'shirts-blouses');
    const trousersCategory = allCategories.find(c => c.slug === 'trousers-skirts');
    const knitwearCategory = allCategories.find(c => c.slug === 'knitwear');
    const footwearCategory = allCategories.find(c => c.slug === 'footwear');
    const accessoriesCategory = allCategories.find(c => c.slug === 'accessories');
    
    if (!shirtsCategory || !trousersCategory || !knitwearCategory) {
      throw new Error('Categories not created properly');
    }

    // Create Product Types
    const types = [
      {
        categoryId: shirtsCategory.id,
        name: 'School Shirt',
        slug: 'school-shirt',
        description: 'Standard school shirt'
      },
      {
        categoryId: shirtsCategory.id,
        name: 'Polo Shirt',
        slug: 'polo-shirt', 
        description: 'School polo shirt'
      },
      {
        categoryId: shirtsCategory.id,
        name: 'Blouse',
        slug: 'blouse',
        description: 'School blouse for girls'
      },
      {
        categoryId: trousersCategory.id,
        name: 'School Trousers',
        slug: 'school-trousers',
        description: 'Standard school trousers'
      },
      {
        categoryId: trousersCategory.id,
        name: 'School Skirt',
        slug: 'school-skirt',
        description: 'School skirt for girls'
      },
      {
        categoryId: trousersCategory.id,
        name: 'School Shorts',
        slug: 'school-shorts', 
        description: 'School shorts'
      },
      {
        categoryId: knitwearCategory.id,
        name: 'School Jumper',
        slug: 'school-jumper',
        description: 'School jumper/sweater'
      },
      {
        categoryId: knitwearCategory.id,
        name: 'School Cardigan',
        slug: 'school-cardigan',
        description: 'School cardigan'
      }
    ];

    const insertedTypes = await db.insert(productTypes)
      .values(types)
      .onConflictDoNothing({ target: productTypes.slug })
      .returning();
      
    // If no types were inserted (already exist), fetch them
    let allTypes = insertedTypes;
    if (insertedTypes.length === 0) {
      allTypes = await db.select().from(productTypes);
    }
      
    console.log(`✅ Product types ready: ${allTypes.length} total (${insertedTypes.length} new)`);

    // 4. Create Attributes for Product Types
    console.log('🏷️ Creating attributes...');
    
    const attributesData = [];
    
    // Common attributes for all clothing types
    for (const type of allTypes.filter(t => t.slug !== 'accessories')) {
      attributesData.push(
        {
          productTypeId: type.id,
          name: 'Size',
          slug: 'size',
          inputType: 'select' as const,
          required: true,
          order: 1,
          placeholder: 'Select size',
          helpText: 'Choose the appropriate size'
        },
        {
          productTypeId: type.id,
          name: 'Color', 
          slug: 'color',
          inputType: 'select' as const,
          required: true,
          order: 2,
          placeholder: 'Select color',
          helpText: 'Main color of the item'
        },
        {
          productTypeId: type.id,
          name: 'Brand',
          slug: 'brand',
          inputType: 'text' as const,
          required: false,
          order: 3,
          placeholder: 'e.g. M&S, Dunnes, Penneys',
          helpText: 'Brand or store where purchased'
        },
        {
          productTypeId: type.id,
          name: 'Gender',
          slug: 'gender',
          inputType: 'select' as const,
          required: false,
          order: 4,
          placeholder: 'Select gender',
          helpText: 'Intended gender if specific'
        }
      );
    }

    const insertedAttributes = await db.insert(attributes)
      .values(attributesData)
      .onConflictDoNothing()
      .returning();
      
    // If no attributes were inserted (already exist), fetch them
    let allAttributes = insertedAttributes;
    if (insertedAttributes.length === 0) {
      allAttributes = await db.select().from(attributes);
    }
      
    console.log(`✅ Attributes ready: ${allAttributes.length} total (${insertedAttributes.length} new)`);

    // 5. Create Attribute Values
    console.log('🎯 Creating attribute values...');
    
    const attributeValuesData = [];
    
    // Size values for different types
    const sizeAttributes = allAttributes.filter(a => a.slug === 'size');
    for (const sizeAttr of sizeAttributes) {
      const productType = allTypes.find(t => t.id === sizeAttr.productTypeId);
      let sizes = [];
      
      if (productType?.slug.includes('shirt') || productType?.slug.includes('blouse')) {
        sizes = ['Age 3-4', 'Age 5-6', 'Age 7-8', 'Age 9-10', 'Age 11-12', 'Age 13', 'Age 14', 'Age 15-16', 'XS', 'S', 'M', 'L', 'XL'];
      } else if (productType?.slug.includes('trousers') || productType?.slug.includes('skirt') || productType?.slug.includes('shorts')) {
        sizes = ['Age 3-4', 'Age 5-6', 'Age 7-8', 'Age 9-10', 'Age 11-12', 'Age 13', 'Age 14', 'Age 15-16', '26"', '28"', '30"', '32"', '34"', '36"'];
      } else {
        sizes = ['Age 3-4', 'Age 5-6', 'Age 7-8', 'Age 9-10', 'Age 11-12', 'Age 13', 'Age 14', 'Age 15-16', 'XS', 'S', 'M', 'L', 'XL'];
      }
      
      sizes.forEach((size, index) => {
        attributeValuesData.push({
          attributeId: sizeAttr.id,
          value: size,
          displayName: size,
          sortOrder: index + 1
        });
      });
    }
    
    // Color values 
    const colorAttributes = allAttributes.filter(a => a.slug === 'color');
    const colors = ['White', 'Navy', 'Grey', 'Black', 'Blue', 'Green', 'Maroon', 'Red', 'Yellow', 'Other'];
    for (const colorAttr of colorAttributes) {
      colors.forEach((color, index) => {
        attributeValuesData.push({
          attributeId: colorAttr.id,
          value: color.toLowerCase(),
          displayName: color,
          sortOrder: index + 1
        });
      });
    }
    
    // Gender values
    const genderAttributes = allAttributes.filter(a => a.slug === 'gender');
    const genders = ['Unisex', 'Boys', 'Girls'];
    for (const genderAttr of genderAttributes) {
      genders.forEach((gender, index) => {
        attributeValuesData.push({
          attributeId: genderAttr.id,
          value: gender.toLowerCase(),
          displayName: gender,
          sortOrder: index + 1
        });
      });
    }

    const insertedAttributeValues = await db.insert(attributeValues)
      .values(attributeValuesData)
      .onConflictDoNothing()
      .returning();
      
    // If no values were inserted (already exist), fetch them
    let allAttributeValues = insertedAttributeValues;
    if (insertedAttributeValues.length === 0) {
      allAttributeValues = await db.select().from(attributeValues);
    }
      
    console.log(`✅ Attribute values ready: ${allAttributeValues.length} total (${insertedAttributeValues.length} new)`);

    console.log('\n🎉 Product system seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   • ${allCategories.length} product categories`);
    console.log(`   • ${allTypes.length} product types`);
    console.log(`   • ${allAttributes.length} attributes`);
    console.log(`   • ${allAttributeValues.length} attribute values`);
    console.log(`   • ${allConditions.length} conditions`);

  } catch (error) {
    console.error('❌ Error seeding product system:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedProductSystem()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedProductSystem;