import 'dotenv/config';
import { db } from '@/db';
import { 
  productCategories, 
  productTypes, 
  attributes, 
  attributeValues, 
  conditions,
  roles,
  user
} from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Seed SpipUniform-specific data
 * This includes product categories, types, attributes, and conditions
 */
async function seedSpipUniformData() {
  console.log('👕 Starting SpipUniform data seeding...\n');

  try {
    // 1. Seed uniform-specific user roles
    console.log('👥 Creating uniform-specific user roles...');
    
    const uniformRoles = [
      {
        name: 'family',
        description: 'Family users who buy and sell uniforms',
        permissions: {
          listings: { create: true, read: true, update: true, delete: true },
          requests: { create: true, read: true, update: true, delete: true },
          shops: { read: true },
          reports: { create: true }
        },
        color: '#10B981', // Green
        isSystem: true
      },
      {
        name: 'shop',
        description: 'Shop owners who sell uniforms',
        permissions: {
          listings: { create: true, read: true, update: true, delete: true },
          requests: { read: true },
          shops: { create: true, read: true, update: true },
          reports: { create: true }
        },
        color: '#3B82F6', // Blue
        isSystem: true
      },
      {
        name: 'moderator',
        description: 'Moderators who handle reports and content moderation',
        permissions: {
          listings: { read: true, update: true, delete: true },
          requests: { read: true, update: true, delete: true },
          shops: { read: true, update: true },
          reports: { read: true, update: true, delete: true },
          users: { read: true, update: true }
        },
        color: '#F59E0B', // Yellow
        isSystem: true
      }
    ];

    let rolesAdded = 0;
    for (const roleData of uniformRoles) {
      const existing = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleData.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(roles).values(roleData);
        rolesAdded++;
        console.log(`✅ Created role: ${roleData.name}`);
      }
    }
    console.log(`Roles: ${rolesAdded} added\n`);

    // 2. Seed product categories
    console.log('📂 Creating product categories...');
    
    const categories = [
      {
        name: 'Upper Wear',
        slug: 'upper-wear',
        description: 'Shirts, jumpers, cardigans, blazers, and tops',
        sortOrder: 1
      },
      {
        name: 'Lower Wear',
        slug: 'lower-wear',
        description: 'Trousers, skirts, shorts, and tracksuit bottoms',
        sortOrder: 2
      },
      {
        name: 'Footwear',
        slug: 'footwear',
        description: 'School shoes, runners, and sports shoes',
        sortOrder: 3
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Ties, belts, bags, hats, and other accessories',
        sortOrder: 4
      },
      {
        name: 'Sports Wear',
        slug: 'sports-wear',
        description: 'PE kits, jerseys, shorts, and sports equipment',
        sortOrder: 5
      }
    ];

    const insertedCategories = [];
    for (const categoryData of categories) {
      const existing = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.slug, categoryData.slug))
        .limit(1);

      if (existing.length === 0) {
        const [inserted] = await db.insert(productCategories).values(categoryData).returning();
        insertedCategories.push(inserted);
        console.log(`✅ Created category: ${categoryData.name}`);
      } else {
        insertedCategories.push(existing[0]);
      }
    }
    console.log(`Categories: ${insertedCategories.length} ready\n`);

    // 3. Seed product types
    console.log('👔 Creating product types...');

    const productTypeData = [
      // Upper Wear
      { category: 'upper-wear', name: 'School Shirt', slug: 'school-shirt', description: 'White or colored school shirts' },
      { category: 'upper-wear', name: 'School Jumper', slug: 'school-jumper', description: 'Knitted school jumpers' },
      { category: 'upper-wear', name: 'School Cardigan', slug: 'school-cardigan', description: 'Button-up school cardigans' },
      { category: 'upper-wear', name: 'School Blazer', slug: 'school-blazer', description: 'Formal school blazers' },
      { category: 'upper-wear', name: 'Polo Shirt', slug: 'polo-shirt', description: 'School polo shirts' },
      { category: 'upper-wear', name: 'School Vest', slug: 'school-vest', description: 'Sleeveless school vests' },

      // Lower Wear
      { category: 'lower-wear', name: 'School Trousers', slug: 'school-trousers', description: 'Formal school trousers' },
      { category: 'lower-wear', name: 'School Skirt', slug: 'school-skirt', description: 'School skirts for girls' },
      { category: 'lower-wear', name: 'School Shorts', slug: 'school-shorts', description: 'School shorts' },
      { category: 'lower-wear', name: 'Tracksuit Bottoms', slug: 'tracksuit-bottoms', description: 'Sports tracksuit bottoms' },
      { category: 'lower-wear', name: 'School Pinafore', slug: 'school-pinafore', description: 'School pinafore dresses' },

      // Footwear
      { category: 'footwear', name: 'Black School Shoes', slug: 'black-school-shoes', description: 'Formal black school shoes' },
      { category: 'footwear', name: 'School Runners', slug: 'school-runners', description: 'White or colored school runners' },
      { category: 'footwear', name: 'PE Runners', slug: 'pe-runners', description: 'Sports runners for PE' },
      { category: 'footwear', name: 'Football Boots', slug: 'football-boots', description: 'Football boots for sports' },

      // Accessories
      { category: 'accessories', name: 'School Tie', slug: 'school-tie', description: 'School ties with crest' },
      { category: 'accessories', name: 'School Belt', slug: 'school-belt', description: 'Black or brown school belts' },
      { category: 'accessories', name: 'School Bag', slug: 'school-bag', description: 'School bags and backpacks' },
      { category: 'accessories', name: 'School Hat', slug: 'school-hat', description: 'School hats and caps' },
      { category: 'accessories', name: 'School Socks', slug: 'school-socks', description: 'School socks and tights' },

      // Sports Wear
      { category: 'sports-wear', name: 'PE T-Shirt', slug: 'pe-t-shirt', description: 'PE t-shirts and tops' },
      { category: 'sports-wear', name: 'PE Shorts', slug: 'pe-shorts', description: 'PE shorts' },
      { category: 'sports-wear', name: 'Sports Jersey', slug: 'sports-jersey', description: 'School sports jerseys' },
      { category: 'sports-wear', name: 'Tracksuit Top', slug: 'tracksuit-top', description: 'Sports tracksuit tops' },
      { category: 'sports-wear', name: 'Swimming Gear', slug: 'swimming-gear', description: 'Swimming togs and caps' }
    ];

    const insertedTypes = [];
    for (const typeData of productTypeData) {
      const category = insertedCategories.find(c => c.slug === typeData.category);
      if (!category) continue;

      const existing = await db
        .select()
        .from(productTypes)
        .where(eq(productTypes.slug, typeData.slug))
        .limit(1);

      if (existing.length === 0) {
        const [inserted] = await db.insert(productTypes).values({
          categoryId: category.id,
          name: typeData.name,
          slug: typeData.slug,
          description: typeData.description
        }).returning();
        insertedTypes.push(inserted);
        console.log(`✅ Created type: ${typeData.name}`);
      } else {
        insertedTypes.push(existing[0]);
      }
    }
    console.log(`Product types: ${insertedTypes.length} ready\n`);

    // 4. Seed attributes and attribute values
    console.log('🏷️ Creating attributes and values...');

    const attributeData = [
      {
        name: 'Size',
        slug: 'size',
        inputType: 'select' as const,
        required: true,
        order: 1,
        values: [
          // Age-based sizes for younger children
          '3-4 years', '4-5 years', '5-6 years', '6-7 years', '7-8 years', '8-9 years', '9-10 years', '10-11 years', '11-12 years',
          // Standard sizes
          'XS', 'S', 'M', 'L', 'XL', 'XXL',
          // Numbered sizes
          '26', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46'
        ]
      },
      {
        name: 'Color',
        slug: 'color',
        inputType: 'select' as const,
        required: false,
        order: 2,
        values: [
          'White', 'Navy', 'Black', 'Grey', 'Maroon', 'Green', 'Blue', 'Red', 'Yellow', 'Purple'
        ]
      },
      {
        name: 'Gender',
        slug: 'gender',
        inputType: 'select' as const,
        required: false,
        order: 3,
        values: ['Boys', 'Girls', 'Unisex']
      },
      {
        name: 'Brand',
        slug: 'brand',
        inputType: 'text' as const,
        required: false,
        order: 4,
        values: []
      }
    ];

    const insertedAttributes = [];
    for (const attrData of attributeData) {
      // Create attributes for multiple product types (most uniforms need size, color, etc.)
      const relevantTypes = insertedTypes.filter(type => 
        !type.slug.includes('bag') && !type.slug.includes('hat') // Some items might not need all attributes
      );

      for (const type of relevantTypes) {
        const existing = await db
          .select()
          .from(attributes)
          .where(eq(attributes.slug, `${type.slug}-${attrData.slug}`))
          .limit(1);

        if (existing.length === 0) {
          const [insertedAttribute] = await db.insert(attributes).values({
            productTypeId: type.id,
            name: attrData.name,
            slug: `${type.slug}-${attrData.slug}`,
            inputType: attrData.inputType,
            required: attrData.required,
            order: attrData.order,
            placeholder: attrData.inputType === 'text' ? `Enter ${attrData.name.toLowerCase()}...` : null
          }).returning();

          insertedAttributes.push(insertedAttribute);

          // Insert attribute values for select types
          if (attrData.values.length > 0) {
            const valueInserts = attrData.values.map((value, index) => ({
              attributeId: insertedAttribute.id,
              value: value,
              displayName: value,
              sortOrder: index
            }));

            await db.insert(attributeValues).values(valueInserts);
          }
        }
      }
    }
    console.log(`Attributes: ${insertedAttributes.length} created with values\n`);

    // 5. Seed conditions
    console.log('🔍 Creating item conditions...');

    const conditionsData = [
      { name: 'New', description: 'Brand new with tags', order: 1 },
      { name: 'Like New', description: 'Excellent condition, worn once or twice', order: 2 },
      { name: 'Very Good', description: 'Minor signs of wear, still in great condition', order: 3 },
      { name: 'Good', description: 'Normal wear and tear, good usable condition', order: 4 },
      { name: 'Fair', description: 'Some wear and small marks, still usable', order: 5 },
      { name: 'Well Used', description: 'Shows wear but still functional', order: 6 }
    ];

    let conditionsAdded = 0;
    for (const conditionData of conditionsData) {
      const existing = await db
        .select()
        .from(conditions)
        .where(eq(conditions.name, conditionData.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(conditions).values(conditionData);
        conditionsAdded++;
        console.log(`✅ Created condition: ${conditionData.name}`);
      }
    }
    console.log(`Conditions: ${conditionsAdded} added\n`);

    // Summary
    const totalCategories = await db.select().from(productCategories);
    const totalTypes = await db.select().from(productTypes);
    const totalAttributes = await db.select().from(attributes);
    const totalAttributeValues = await db.select().from(attributeValues);
    const totalConditions = await db.select().from(conditions);

    console.log('🎉 SpipUniform data seeding completed successfully!\n');
    console.log('📊 Final Summary:');
    console.log(`  📂 Product Categories: ${totalCategories.length}`);
    console.log(`  👔 Product Types: ${totalTypes.length}`);
    console.log(`  🏷️ Attributes: ${totalAttributes.length}`);
    console.log(`  📝 Attribute Values: ${totalAttributeValues.length}`);
    console.log(`  🔍 Conditions: ${totalConditions.length}`);
    console.log(`  🏫 Schools: 3,804 (imported separately)`);
    console.log(`  📍 Counties: 32`);
    console.log(`  🏘️ Localities: 41\n`);

    console.log('✨ SpipUniform marketplace is ready for business!');

  } catch (error) {
    console.error('❌ Error during SpipUniform data seeding:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSpipUniformData()
    .then(() => {
      console.log('✅ SpipUniform seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ SpipUniform seeding process failed:', error);
      process.exit(1);
    });
}

export { seedSpipUniformData };