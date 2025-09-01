import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

/**
 * Server-side admin seeding script using Better Auth's server API
 */
async function seedBetterAuth() {
  try {
    const adminEmail = "admin@example.com";
    const adminPassword = "Admin123";
    const adminName = "Admin User";

    console.log("🌱 Starting server-side admin user seeding...");
    console.log(`📧 Admin email: ${adminEmail}`);

    // Check if admin user already exists
    const existingAdmin = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);

    if (existingAdmin.length > 0) {
      console.log("ℹ️  Admin user already exists, updating role to admin...");
      await db.update(user).set({ role: "admin" }).where(eq(user.email, adminEmail));
      console.log("✅ Existing user updated to admin role successfully!");
      return;
    }

    // Create a mock request object for Better Auth
    const mockRequest = new Request(`http://localhost:3100/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        name: adminName,
      }),
    });

    // Use Better Auth's server-side handler
    const response = await auth.handler(mockRequest);
    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ Failed to create admin user:`, result);
      process.exit(1);
    }

    // Set admin role
    await db.update(user).set({ role: "admin" }).where(eq(user.email, adminEmail));

    console.log("✅ Admin user created and role set successfully!");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`👤 Name: ${adminName}`);
    console.log("🔐 Password: Admin123");
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
seedBetterAuth()
  .then(() => {
    console.log("🎉 Admin seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Admin seeding failed:", error);
    process.exit(1);
  });