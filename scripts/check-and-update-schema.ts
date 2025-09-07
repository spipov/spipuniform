import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL || "");

async function checkAndUpdateSchema() {
  try {
    console.log("Checking current database schema...");

    // Check all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    console.log(
      "Available tables:",
      tables.map((t) => t.table_name)
    );

    // Check if roles table has description and is_system columns
    const rolesColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'roles' AND table_schema = 'public'
    `;

    console.log(
      "Roles table columns:",
      rolesColumns.map((r) => r.column_name)
    );

    const hasDescription = rolesColumns.some((col) => col.column_name === "description");
    const hasIsSystem = rolesColumns.some((col) => col.column_name === "is_system");

    // Check which user table exists (user or users)
    const hasUserTable = tables.some((t) => t.table_name === "user");
    const hasUsersTable = tables.some((t) => t.table_name === "users");

    const userTableName = hasUserTable ? "user" : hasUsersTable ? "users" : null;

    if (userTableName) {
      // Check if user table has banned_until and ban_reason columns
      const userColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${userTableName} AND table_schema = 'public'
      `;

      console.log(
        `${userTableName} table columns:`,
        userColumns.map((r) => r.column_name)
      );

      const hasBannedUntil = userColumns.some((col) => col.column_name === "banned_until");
      const hasBanReason = userColumns.some((col) => col.column_name === "ban_reason");

      // Add missing columns to user table
      if (!hasBannedUntil) {
        console.log(`Adding banned_until column to ${userTableName} table...`);
        await sql`ALTER TABLE ${sql(userTableName)} ADD COLUMN "banned_until" timestamp with time zone`;
      }

      if (!hasBanReason) {
        console.log(`Adding ban_reason column to ${userTableName} table...`);
        await sql`ALTER TABLE ${sql(userTableName)} ADD COLUMN "ban_reason" text`;
      }
    }

    // Add missing columns to roles table
    if (!hasDescription) {
      console.log("Adding description column to roles table...");
      await sql`ALTER TABLE "roles" ADD COLUMN "description" text`;
    }

    if (!hasIsSystem) {
      console.log("Adding is_system column to roles table...");
      await sql`ALTER TABLE "roles" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL`;
    }

    console.log("Schema update completed successfully!");
  } catch (error) {
    console.error("Schema update failed:", error);
  } finally {
    await sql.end();
  }
}

checkAndUpdateSchema();
