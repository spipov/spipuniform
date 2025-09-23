import 'dotenv/config';
import { db } from '@/db';
import { user as authUser } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Test script for first-admin setup
 * Clears all users to test the first-admin detection
 */
async function testFirstAdminSetup() {
  try {
    console.log('🧪 Testing first-admin setup...');

    // Clear all users to simulate fresh database
    console.log('🗑️  Clearing all users...');
    const deletedUsers = await db.delete(authUser);
    console.log(`✅ Cleared users`);

    // Test admin-exists endpoint
    console.log('🔍 Testing admin-exists endpoint...');
    const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3350';

    const response = await fetch(`${baseURL}/api/auth/admin-exists`);
    const result = await response.json();

    console.log('📊 Admin exists result:', result);

    if (result.exists) {
      console.error('❌ Admin still exists after clearing users');
      return;
    }

    console.log('✅ Admin-exists endpoint correctly reports no admin exists');

    // Test upgrade-first-admin endpoint with non-existent user
    console.log('🔍 Testing upgrade-first-admin endpoint...');

    const upgradeResponse = await fetch(`${baseURL}/api/auth/upgrade-first-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test-user-id' })
    });

    const upgradeResult = await upgradeResponse.json();
    console.log('📊 Upgrade result:', upgradeResult);

    if (upgradeResult.success) {
      console.error('❌ Upgrade should have failed for non-existent user');
      return;
    }

    console.log('✅ Upgrade endpoint correctly rejected non-existent user');

    console.log('🎉 First-admin setup test completed successfully!');
    console.log('');
    console.log('📋 Test Summary:');
    console.log('  ✅ Admin-exists endpoint works correctly');
    console.log('  ✅ Upgrade-first-admin endpoint has proper validation');
    console.log('  ✅ System is ready for first-admin setup flow');

  } catch (error) {
    console.error('❌ Error during first-admin setup test:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFirstAdminSetup()
    .then(() => {
      console.log('✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testFirstAdminSetup };