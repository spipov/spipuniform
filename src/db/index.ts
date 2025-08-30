import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import * as schema from "./schema/index.js";

config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Create the connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);

// Create the database instance
export const db = drizzle(client, { schema });

// Export the client for direct access if needed
export { client };

// Export schema for easy access
export { schema };

// Export types
export type Database = typeof db;
