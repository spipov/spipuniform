/** biome-ignore-all lint/suspicious/noConsole: Console logs in CLI tools are acceptable */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

/**
 * Combined database reset and seeding workflow
 * 1. Runs database migrations
 * 2. Seeds the database with admin user
 */
async function resetAndSeed() {
  try {
    console.log('🚀 Starting database reset and seeding workflow...');
    console.log('');

    // Step 1: Run database migrations
    console.log('📋 Step 1: Running database migrations...');
    try {
      const { stdout: migrateOutput, stderr: migrateError } = await execAsync('pnpm drizzle-kit push');
      if (migrateError) {
        console.warn('⚠️  Migration warnings:', migrateError);
      }
      console.log('✅ Database migrations completed successfully!');
      if (migrateOutput) {
        console.log('   Output:', migrateOutput.trim());
      }
    } catch (error) {
      console.error('❌ Failed to run database migrations:');
      if (error instanceof Error) {
        console.error(`   ${error.message}`);
      }
      throw error;
    }

    console.log('');

    // Step 2: Seed admin user
    console.log('🌱 Step 2: Seeding admin user...');
    try {
      const seedScriptPath = path.join(__dirname, 'seed-admin.ts');
      const { stdout: seedOutput, stderr: seedError } = await execAsync(`npx tsx "${seedScriptPath}"`);
      
      if (seedError) {
        console.warn('⚠️  Seeding warnings:', seedError);
      }
      
      if (seedOutput) {
        console.log(seedOutput.trim());
      }
      
      console.log('✅ Admin user seeding completed successfully!');
    } catch (error) {
      console.error('❌ Failed to seed admin user:');
      if (error instanceof Error) {
        console.error(`   ${error.message}`);
      }
      throw error;
    }

    console.log('');
    console.log('🎉 Database reset and seeding workflow completed successfully!');
    console.log('💡 Your database is now ready with an admin user.');
    console.log('📧 Check your .env file for admin credentials.');
    
  } catch (error) {
    console.error('');
    console.error('💥 Database reset and seeding workflow failed!');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the reset and seed workflow
resetAndSeed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Workflow failed:', error);
    process.exit(1);
  });