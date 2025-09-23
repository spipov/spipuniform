import 'dotenv/config';
import { db } from '@/db';
import { user as authUser, session, account, verification } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Clear database script for testing first-admin setup
 * This script removes all users and related auth data to simulate a fresh database
 */
async function clearForFirstAdminTest() {
  try {
    console.log('🧹 Clearing database for first-admin setup test...');

    // 1. Clear sessions first (due to foreign key constraints)
    console.log('🗑️  Clearing sessions...');
    await db.delete(session);
    console.log('✅ Cleared sessions');

    // 2. Clear accounts
    console.log('🗑️  Clearing accounts...');
    await db.delete(account);
    console.log('✅ Cleared accounts');

    // 3. Clear verifications
    console.log('🗑️  Clearing verifications...');
    await db.delete(verification);
    console.log('✅ Cleared verifications');

    // 4. Clear users (now safe since no foreign key constraints)
    console.log('🗑️  Clearing users...');
    await db.delete(authUser);
    console.log('✅ Cleared users');

    // 5. Verify no admin exists
    console.log('🔍 Verifying no admin exists...');
    const adminUsers = await db.select()
      .from(authUser)
      .where(eq(authUser.role, "admin"))
      .limit(1);

    if (adminUsers.length > 0) {
      console.error('❌ Admin still exists after clearing');
      return;
    }

    console.log('✅ No admin users found - ready for first-admin test');

    console.log('🎉 Database cleared successfully for first-admin setup test!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Go to http://localhost:3350/auth/signup');
    console.log('  2. Register a new user');
    console.log('  3. You should see the "first admin" banner');
    console.log('  4. After registration, the user will be automatically promoted to admin');

  } catch (error) {
    console.error('❌ Error during database clearing:', error);
    throw error;
  }
}

// Run the clearing if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  clearForFirstAdminTest()
    .then(() => {
      console.log('✅ Clearing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Clearing failed:', error);
      process.exit(1);
    });
}

export { clearForFirstAdminTest };