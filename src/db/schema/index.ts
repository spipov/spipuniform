import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Better Auth tables
export * from "./auth";

// User Management System tables
export * from "./user-management";

// Example posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  authorId: serial("author_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export types from user management
export type { Role, NewRole, User, NewUser, UserWithRole } from "./user-management";
