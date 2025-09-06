import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core';

// Application authentication settings
export const authSettings = pgTable('auth_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  // When true, new signups must be approved by an admin before they can sign in
  requireAdminApproval: boolean('require_admin_approval').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type AuthSettings = typeof authSettings.$inferSelect;
export type NewAuthSettings = typeof authSettings.$inferInsert;

