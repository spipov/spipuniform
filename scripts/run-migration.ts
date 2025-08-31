import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync } from "fs";
import { config } from "dotenv";
import path from "path";

config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

async function runMigration() {
  try {
    console.log("Running user management migration...");

    // Read the migration file
    const migrationPath = path.join(process.cwd(), "drizzle", "0001_user_management_setup.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Remove comments and split by semicolons
    const cleanSQL = migrationSQL
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim().length > 0)
      .join("\n");

    const statements = cleanSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log("Executing:", statement.substring(0, 80) + "...");
        await client.unsafe(statement);
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
