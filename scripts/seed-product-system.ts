import 'dotenv/config';
import { db } from '../src/db';
import { productCategories, productTypes, conditions } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function seedProductSystem() {
  try {
    console.log('Starting product system seed...');

    // Seed categories
    const categoriesData = [
      {
        name: 'School Uniforms',
        slug: 'school-uniforms',
        description: 'Official school uniform clothing and accessories',
        sortOrder: 1
      },
      {
        name: 'Sports Kit',
        slug: 'sports-kit',
        description: 'Sports uniforms and athletic wear for school activities',
        sortOrder: 2
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'School uniform accessories like ties, belts, and bags',
        sortOrder: 3
      }
    ];

    const categories = [];
    for (const categoryData of categoriesData) {
      const existing = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.slug, categoryData.slug))
        .limit(1);

      if (existing.length === 0) {
        const created = await db
          .insert(productCategories)
          .values(categoryData)
          .returning();
        categories.push(created[0]);
        console.log(`Created category: ${categoryData.name}`);
      } else {
        categories.push(existing[0]);
        console.log(`Category already exists: ${categoryData.name}`);
      }
    }

    // Seed product types
    const typesData = [
      // School Uniforms
      { name: 'Shirts', slug: 'shirts', description: 'School uniform shirts', categorySlug: 'school-uniforms' },
      { name: 'Trousers', slug: 'trousers', description: 'School uniform trousers', categorySlug: 'school-uniforms' },
      { name: 'Skirts', slug: 'skirts', description: 'School uniform skirts', categorySlug: 'school-uniforms' },
      { name: 'Blazers', slug: 'blazers', description: 'School uniform blazers', categorySlug: 'school-uniforms' },
      { name: 'Jumpers', slug: 'jumpers', description: 'School uniform jumpers and cardigans', categorySlug: 'school-uniforms' },
      
      // Sports Kit
      { name: 'PE Shirts', slug: 'pe-shirts', description: 'Physical education shirts', categorySlug: 'sports-kit' },
      { name: 'Sports Shorts', slug: 'sports-shorts', description: 'Sports shorts for PE and games', categorySlug: 'sports-kit' },
      { name: 'Football Kit', slug: 'football-kit', description: 'Football uniforms and kit', categorySlug: 'sports-kit' },
      { name: 'Rugby Kit', slug: 'rugby-kit', description: 'Rugby uniforms and protective gear', categorySlug: 'sports-kit' },
      
      // Accessories
      { name: 'Ties', slug: 'ties', description: 'School uniform ties', categorySlug: 'accessories' },
      { name: 'Belts', slug: 'belts', description: 'School uniform belts', categorySlug: 'accessories' },
      { name: 'School Bags', slug: 'school-bags', description: 'School bags and backpacks', categorySlug: 'accessories' },
      { name: 'Shoes', slug: 'shoes', description: 'School uniform shoes', categorySlug: 'accessories' }
    ];

    for (const typeData of typesData) {
      const category = categories.find(c => c.slug === typeData.categorySlug);
      if (!category) continue;

      const existing = await db
        .select()
        .from(productTypes)
        .where(eq(productTypes.slug, typeData.slug))
        .limit(1);

      if (existing.length === 0) {
        await db
          .insert(productTypes)
          .values({
            categoryId: category.id,
            name: typeData.name,
            slug: typeData.slug,
            description: typeData.description,
            isActive: true
          });
        console.log(`Created product type: ${typeData.name}`);
      } else {
        console.log(`Product type already exists: ${typeData.name}`);
      }
    }

    // Seed conditions
    const conditionsData = [
      { name: 'New with tags', description: 'Brand new item with original tags', order: 1 },
      { name: 'New without tags', description: 'New item without original tags', order: 2 },
      { name: 'Excellent', description: 'Like new condition, barely used', order: 3 },
      { name: 'Very good', description: 'Minor signs of wear, good condition', order: 4 },
      { name: 'Good', description: 'Some signs of wear but functional', order: 5 },
      { name: 'Fair', description: 'Well-worn but usable', order: 6 }
    ];

    for (const conditionData of conditionsData) {
      const existing = await db
        .select()
        .from(conditions)
        .where(eq(conditions.name, conditionData.name))
        .limit(1);

      if (existing.length === 0) {
        await db
          .insert(conditions)
          .values(conditionData);
        console.log(`Created condition: ${conditionData.name}`);
      } else {
        console.log(`Condition already exists: ${conditionData.name}`);
      }
    }

    console.log('Product system seed completed successfully!');
  } catch (error) {
    console.error('Error seeding product system:', error);
    process.exit(1);
  }
}

seedProductSystem();