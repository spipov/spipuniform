/** biome-ignore-all lint/suspicious/noConsole: Console logs in CLI tools are acceptable */

import { signUp } from "@/lib/auth-client";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { registerSchema } from "@/schemas/auth";
import * as v from "valibot";

/**
 * Automated database seeding script that creates an admin user
 * Uses environment variables for credentials with fallback defaults
 */
async function seedAdmin() {
  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
    const adminName = process.env.DEFAULT_ADMIN_NAME || "Admin User";

    console.log("🌱 Starting admin user seeding...");
    console.log(`📧 Admin email: ${adminEmail}`);

    // Check if admin user already exists
    const existingAdmin = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);

    if (existingAdmin.length > 0) {
      console.log("ℹ️  Admin user already exists, updating role to admin...");

      // Update existing user to admin role
      await db.update(user).set({ role: "admin" }).where(eq(user.email, adminEmail));

      console.log("✅ Existing user updated to admin role successfully!");
      return;
    }

    // Validate admin data
    const adminData = {
      email: adminEmail,
      password: adminPassword,
      name: adminName,
      confirmPassword: adminPassword,
    };

    try {
      v.parse(registerSchema, adminData);
    } catch (error) {
      console.error("❌ Validation errors:");
      if (error instanceof v.ValiError) {
        error.issues.forEach((issue) => {
          console.error(`- ${issue.path?.map((p: any) => p.key).join(".") || "unknown"}: ${issue.message}`);
        });
      } else {
        console.error("Unknown validation error:", error);
      }
      process.exit(1);
    }

    // Since we validated, we can safely use the data
    const parsed = { data: v.parse(registerSchema, adminData) };

    // Create admin user using Better Auth
    const result = await signUp.email({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
    });

    if (result.error) {
      console.error(`❌ Failed to create admin user: ${result.error.message}`);
      process.exit(1);
    }

    // Set admin role
    await db.update(user).set({ role: "admin" }).where(eq(user.email, adminEmail));

    console.log("✅ Admin user created and role set successfully!");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`👤 Name: ${adminName}`);
    console.log("🔐 Password: [HIDDEN]");
  } catch (error) {
    console.error("❌ Error during admin seeding:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error("   An unexpected error occurred.");
    }
    process.exit(1);
  }
}

// Run the seeding function
seedAdmin()
  .then(() => {
    console.log("🎉 Admin seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Admin seeding failed:", error);
    process.exit(1);
  });
