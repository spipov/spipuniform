import 'dotenv/config';
import { db } from '@/db';
import { counties, localities, schools } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface PrimarySchoolRow {
  'Roll Number': string;
  'Official Name': string;
  'Address (Line 1)': string;
  'Address (Line 2)': string;
  'Address (Line 3)': string;
  'Address (Line 4)': string;
  'County Description': string;
  'Eircode': string;
  'School Latitude': string;
  'School Longitude': string;
  'Email': string;
  'Phone No.': string;
  'Principal Name': string;
  'School Type': string;
  'School Level': string;
  'DEIS (Y/N)': string;
  'Ethos Description': string;
  [key: string]: string;
}

interface SecondarySchoolRow {
  'Roll Number': string;
  'Official School Name': string;
  'Address 1': string;
  'Address 2': string;
  'Address 3': string;
  'Address 4': string;
  'County': string;
  'Eircode': string;
  'School Latitude': string;
  'School Longitude': string;
  'Email': string;
  'Phone': string;
  'Principal Name': string;
  'Post Primary School Type': string;
  'Ethos/Religion': string;
  'DEIS (Y/N)': string;
  [key: string]: string;
}

interface ImportResult {
  imported: number;
  errors: number;
  skipped: number;
  ambiguous: number;
  details: Array<{
    school: string;
    status: 'imported' | 'error' | 'skipped' | 'ambiguous';
    message: string;
  }>;
}

/**
 * Parse CSV content into array of objects
 */
function parseCSV(content: string): any[] {
  const lines = content.trim().split('\n');
  
  // Skip the first line if it looks like metadata (contains just commas and title)
  let headerLineIndex = 0;
  if (lines[0].includes('Total Enrolment') || lines[0].includes('Academic Year')) {
    headerLineIndex = lines[0].includes('Total Enrolment') ? 1 : 0;
  }
  
  const headers = lines[headerLineIndex].split(',').map(h => h.replace(/"/g, '').trim());
  const rows = [];
  
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Basic CSV parsing - handle quoted fields
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Add the last value
    
    // Create object from headers and values
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * Find the best matching locality for a school address
 */
async function findBestLocalityMatch(
  addressParts: string[], 
  countyName: string
): Promise<{ locality: any; county: any } | null> {
  try {
    // First get the county
    const countryResult = await db
      .select()
      .from(counties)
      .where(ilike(counties.name, `%${countyName.trim()}%`))
      .limit(1);

    if (countryResult.length === 0) {
      console.warn(`County not found: ${countyName}`);
      return null;
    }

    const county = countryResult[0];

    // Try to match localities within this county
    const localitiesInCounty = await db
      .select()
      .from(localities)
      .where(eq(localities.countyId, county.id));

    // Try to match locality name from address parts
    for (const addressPart of addressParts) {
      if (!addressPart || addressPart.trim().length < 2) continue;
      
      const searchTerm = addressPart.trim();
      
      // Look for exact or partial matches
      for (const locality of localitiesInCounty) {
        const localityName = locality.name.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        // Try exact match or partial match
        if (localityName === searchLower || 
            localityName.includes(searchLower) || 
            searchLower.includes(localityName)) {
          return { locality, county };
        }
      }
    }

    // If no specific locality match, return first locality in county as fallback
    if (localitiesInCounty.length > 0) {
      console.warn(`No locality match found for ${addressParts.join(', ')} in ${countyName}, using first locality in county: ${localitiesInCounty[0].name}`);
      return { locality: localitiesInCounty[0], county };
    }

    return { locality: null, county };
  } catch (error) {
    console.error('Error finding locality match:', error);
    return null;
  }
}

/**
 * Import primary schools from CSV
 */
async function importPrimarySchools(csvPath: string): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    errors: 0,
    skipped: 0,
    ambiguous: 0,
    details: []
  };

  try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content) as PrimarySchoolRow[];

    console.log(`📚 Processing ${rows.length} primary schools...`);

    for (const row of rows) {
      try {
        if (!row['Roll Number'] || !row['Official Name']) {
          result.skipped++;
          result.details.push({
            school: row['Official Name'] || 'Unknown',
            status: 'skipped',
            message: 'Missing required fields'
          });
          continue;
        }

        // Check if school already exists
        const existing = await db
          .select()
          .from(schools)
          .where(eq(schools.externalId, row['Roll Number']))
          .limit(1);

        if (existing.length > 0) {
          result.skipped++;
          result.details.push({
            school: row['Official Name'],
            status: 'skipped',
            message: 'Already exists'
          });
          continue;
        }

        // Extract address parts for locality matching
        const addressParts = [
          row['Address (Line 2)'],
          row['Address (Line 3)'],
          row['Address (Line 4)']
        ].filter(Boolean);

        const countyName = row['County Description'];
        const locationMatch = await findBestLocalityMatch(addressParts, countyName);

        if (!locationMatch) {
          result.errors++;
          result.details.push({
            school: row['Official Name'],
            status: 'error',
            message: `Could not match county: ${countyName}`
          });
          continue;
        }

        // Prepare school data
        const schoolData = {
          name: row['Official Name'],
          address: [
            row['Address (Line 1)'],
            row['Address (Line 2)'],
            row['Address (Line 3)'],
            row['Address (Line 4)']
          ].filter(Boolean).join(', '),
          localityId: locationMatch.locality?.id || null,
          countyId: locationMatch.county.id,
          level: 'primary' as const,
          externalId: row['Roll Number'],
          website: null,
          phone: row['Phone No.'] || null,
          email: row['Email'] || null,
          csvSourceRow: row,
          // Imported schools should be inactive by default; activation happens via setup flows
          isActive: false
        };

        // Insert school
        await db.insert(schools).values(schoolData);

        result.imported++;
        result.details.push({
          school: row['Official Name'],
          status: 'imported',
          message: `Matched to ${locationMatch.locality?.name || 'county'} in ${locationMatch.county.name}`
        });

      } catch (error) {
        result.errors++;
        result.details.push({
          school: row['Official Name'] || 'Unknown',
          status: 'error',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        console.error('Error importing school:', error);
      }
    }

    return result;
  } catch (error) {
    console.error('Error reading CSV file:', error);
    throw error;
  }
}

/**
 * Import secondary schools from CSV
 */
async function importSecondarySchools(csvPath: string): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    errors: 0,
    skipped: 0,
    ambiguous: 0,
    details: []
  };

  try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content) as SecondarySchoolRow[];

    console.log(`🎓 Processing ${rows.length} secondary schools...`);

    for (const row of rows) {
      try {
        if (!row['Roll Number'] || !row['Official School Name']) {
          result.skipped++;
          result.details.push({
            school: row['Official School Name'] || 'Unknown',
            status: 'skipped',
            message: 'Missing required fields'
          });
          continue;
        }

        // Check if school already exists
        const existing = await db
          .select()
          .from(schools)
          .where(eq(schools.externalId, row['Roll Number']))
          .limit(1);

        if (existing.length > 0) {
          result.skipped++;
          result.details.push({
            school: row['Official School Name'],
            status: 'skipped',
            message: 'Already exists'
          });
          continue;
        }

        // Extract address parts for locality matching
        const addressParts = [
          row['Address 2'],
          row['Address 3'],
          row['Address 4']
        ].filter(Boolean);

        const countyName = row['County'];
        const locationMatch = await findBestLocalityMatch(addressParts, countyName);

        if (!locationMatch) {
          result.errors++;
          result.details.push({
            school: row['Official School Name'],
            status: 'error',
            message: `Could not match county: ${countyName}`
          });
          continue;
        }

        // Prepare school data
        const schoolData = {
          name: row['Official School Name'],
          address: [
            row['Address 1'],
            row['Address 2'],
            row['Address 3'],
            row['Address 4']
          ].filter(Boolean).join(', '),
          localityId: locationMatch.locality?.id || null,
          countyId: locationMatch.county.id,
          level: 'secondary' as const,
          externalId: row['Roll Number'],
          website: null,
          phone: row['Phone'] || null,
          email: row['Email'] || null,
          csvSourceRow: row,
          // Imported schools should be inactive by default; activation happens via setup flows
          isActive: false
        };

        // Insert school
        await db.insert(schools).values(schoolData);

        result.imported++;
        result.details.push({
          school: row['Official School Name'],
          status: 'imported',
          message: `Matched to ${locationMatch.locality?.name || 'county'} in ${locationMatch.county.name}`
        });

      } catch (error) {
        result.errors++;
        result.details.push({
          school: row['Official School Name'] || 'Unknown',
          status: 'error',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        console.error('Error importing school:', error);
      }
    }

    return result;
  } catch (error) {
    console.error('Error reading CSV file:', error);
    throw error;
  }
}

/**
 * Main import function
 */
async function importSchools() {
  console.log('🏫 Starting school import process...\n');

  try {
    // Check if counties and localities exist
    const countiesCount = await db.select().from(counties);
    const localitiesCount = await db.select().from(localities);

    if (countiesCount.length === 0) {
      console.error('❌ No counties found in database. Please import locations first.');
      process.exit(1);
    }

    if (localitiesCount.length === 0) {
      console.error('❌ No localities found in database. Please import locations first.');
      process.exit(1);
    }

    console.log(`📍 Found ${countiesCount.length} counties and ${localitiesCount.length} localities in database.\n`);

    // Import primary schools
    const primaryPath = path.join(process.cwd(), 'public/schools/primary_schools.csv');
    if (fs.existsSync(primaryPath)) {
      console.log('Importing primary schools...');
      const primaryResult = await importPrimarySchools(primaryPath);
      console.log(`Primary Schools Results:`);
      console.log(`  ✅ Imported: ${primaryResult.imported}`);
      console.log(`  ⏭️  Skipped: ${primaryResult.skipped}`);
      console.log(`  ❌ Errors: ${primaryResult.errors}`);
      console.log(`  ⚠️  Ambiguous: ${primaryResult.ambiguous}\n`);
    } else {
      console.warn('⚠️  Primary schools CSV not found at:', primaryPath);
    }

    // Import secondary schools
    const secondaryPath = path.join(process.cwd(), 'public/schools/secondary_schools.csv');
    if (fs.existsSync(secondaryPath)) {
      console.log('Importing secondary schools...');
      const secondaryResult = await importSecondarySchools(secondaryPath);
      console.log(`Secondary Schools Results:`);
      console.log(`  ✅ Imported: ${secondaryResult.imported}`);
      console.log(`  ⏭️  Skipped: ${secondaryResult.skipped}`);
      console.log(`  ❌ Errors: ${secondaryResult.errors}`);
      console.log(`  ⚠️  Ambiguous: ${secondaryResult.ambiguous}\n`);
    } else {
      console.warn('⚠️  Secondary schools CSV not found at:', secondaryPath);
    }

    // Final summary
    const totalSchools = await db.select().from(schools);
    console.log(`🎉 School import completed! Total schools in database: ${totalSchools.length}`);

  } catch (error) {
    console.error('❌ Error during school import:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importSchools()
    .then(() => {
      console.log('✅ School import process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ School import process failed:', error);
      process.exit(1);
    });
}

export { importSchools };