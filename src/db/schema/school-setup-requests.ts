import { pgTable, pgEnum, uuid, text, timestamp, jsonb, index, foreignKey } from "drizzle-orm/pg-core";
import { user } from './auth';
import { counties } from './spipuniform';

// Enums for school setup requests
export const schoolSetupRequestStatus = pgEnum("school_setup_request_status", [
  'pending',      // Request submitted, awaiting admin review
  'approved',     // Request approved, school activated or created
  'denied',       // Request denied with reason
  'cancelled'     // User cancelled the request
]);

// School setup requests table for marketplace school activation
export const schoolSetupRequests = pgTable("school_setup_requests", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: text("user_id").notNull(),

  // Location information
  countyId: uuid("county_id").notNull(),
  localityName: text("locality_name").notNull(), // Store locality name from OSM search

  // School information
  schoolType: text("school_type").notNull(), // 'primary' or 'secondary'
  selectedSchoolId: uuid("selected_school_id"), // If user selected existing school
  customSchoolName: text("custom_school_name"), // If user entered custom name

  // Request status
  status: schoolSetupRequestStatus().default('pending').notNull(),

  // Admin processing
  reviewedBy: text("reviewed_by"), // Admin user ID who reviewed
  reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
  adminNotes: text("admin_notes"), // Admin's notes/feedback

  // Approval/denial details
  denialReason: text("denial_reason"), // Reason for denial
  nextSteps: text("next_steps"), // Instructions for user if denied

  // Email tracking
  emailsSent: jsonb("emails_sent").default('{}'), // Track which emails were sent

  // Timestamps
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  // Indexes for efficient queries
  index("school_setup_requests_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  index("school_setup_requests_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
  index("school_setup_requests_created_idx").using("btree", table.createdAt.desc().nullsLast().op("timestamp_ops")),
  index("school_setup_requests_county_idx").using("btree", table.countyId.asc().nullsLast().op("uuid_ops")),

  // Foreign keys
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "school_setup_requests_user_id_user_id_fk"
  }).onDelete("cascade"),

  foreignKey({
    columns: [table.countyId],
    foreignColumns: [counties.id],
    name: "school_setup_requests_county_id_counties_id_fk"
  }),

  foreignKey({
    columns: [table.reviewedBy],
    foreignColumns: [user.id],
    name: "school_setup_requests_reviewed_by_user_id_fk"
  }).onDelete("set null"),
]);

// Export types for TypeScript
export type SchoolSetupRequest = typeof schoolSetupRequests.$inferSelect;
export type NewSchoolSetupRequest = typeof schoolSetupRequests.$inferInsert;