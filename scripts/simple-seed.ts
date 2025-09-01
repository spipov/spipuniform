import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Simple database seeding script
 */
async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create default roles
    console.log("📋 Creating default roles...");
    
    const defaultRoles = [
      {
        name: "admin",
        description: "Full system access",
        permissions: {
          users: { create: true, read: true, update: true, delete: true },
          roles: { create: true, read: true, update: true, delete: true },
          system: { manage: true }
        },
        color: "#DC2626",
        is_system: true
      },
      {
        name: "user",
        description: "Standard user access",
        permissions: {
          users: { read: true },
          roles: { read: true }
        },
        color: "#3B82F6",
        is_system: true
      }
    ];

    // Insert roles
    const insertedRoles = await db.insert(roles).values(defaultRoles).returning();
    console.log(`✅ Created ${insertedRoles.length} roles`);

    // Find admin role
    const adminRole = insertedRoles.find(role => role.name === "admin");
    if (!adminRole) {
      throw new Error("Admin role not found");
    }

    // Create admin user
    console.log("👤 Creating admin user...");
    
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin123";
    const adminName = process.env.DEFAULT_ADMIN_NAME || "Admin User";

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log("ℹ️  Admin user already exists, skipping...");
    } else {
      // Create admin user
      const [adminUser] = await db.insert(users).values({
        email: adminEmail,
        name: adminName,
        passwordHash: passwordHash,
        roleId: adminRole.id
      }).returning();

      console.log(`✅ Admin user created: ${adminUser.email}`);
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log(`📧 Admin email: ${adminEmail}`);
    console.log(`🔐 Admin password: ${adminPassword}`);
    
  } catch (error) {
    console.error("❌ Error during seeding:");
    console.error(error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });