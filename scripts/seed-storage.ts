/** biome-ignore-all lint/suspicious/noConsole: Console logs in CLI tools are acceptable */

import 'dotenv/config';
import { db } from "@/db";
import { storageSettings } from "@/db/schema/file-system";
import { eq } from "drizzle-orm";

/**
 * Automated database seeding script that creates a default active local storage provider
 */
async function seedStorage() {
  try {
    console.log("🌱 Starting storage provider seeding...");

    // Check if a local storage provider already exists and is active
    const existingLocal = await db
      .select()
      .from(storageSettings)
      .where(eq(storageSettings.provider, 'local'))
      .limit(1);

    if (existingLocal.length > 0) {
      console.log("ℹ️  Local storage provider already exists, ensuring it's active...");

      // Update to ensure it's active
      await db
        .update(storageSettings)
        .set({
          isActive: true,
          config: { basePath: './uploads' },
          name: 'Default Local Storage',
          description: 'Default local storage provider',
        })
        .where(eq(storageSettings.provider, 'local'));

      console.log("✅ Existing local storage provider updated to active!");
      return;
    }

    // Insert default local storage provider
    await db.insert(storageSettings).values({
      provider: 'local',
      isActive: true,
      config: {
        basePath: './uploads',
      },
      name: 'Default Local Storage',
      description: 'Default local storage provider for file uploads',
    });

    console.log("✅ Default local storage provider created successfully!");
    console.log("📁 Base path: ./uploads");
    console.log("🔧 Provider: local");
    console.log("✅ Active: true");
  } catch (error) {
    console.error("❌ Error during storage seeding:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error("   An unexpected error occurred.");
    }
    process.exit(1);
  }
}

// Run the seeding function
seedStorage()
  .then(() => {
    console.log("🎉 Storage seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Storage seeding failed:", error);
    process.exit(1);
  });