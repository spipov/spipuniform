import { pgTable, pgEnum, uuid, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { user } from './auth';

// Enums for school approval requests
export const schoolRequestStatus = pgEnum("school_request_status", [
  'pending',      // Request submitted, awaiting admin review
  'approved',     // Request approved, schools added to user profile
  'denied',       // Request denied, user can resubmit with changes
  'cancelled'     // User cancelled the request
]);

// School approval requests table
export const schoolApprovalRequests = pgTable("school_approval_requests", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: text("user_id").notNull(),
  
  // Current user schools before the request
  currentSchools: jsonb("current_schools").notNull(), // Array of current school IDs
  
  // Requested additional schools
  requestedSchools: jsonb("requested_schools").notNull(), // Array of school IDs being requested
  
  // Request details
  reason: text().notNull(), // User's explanation for needing additional schools
  status: schoolRequestStatus().default('pending').notNull(),
  
  // Admin processing
  reviewedBy: text("reviewed_by"), // Admin user ID who reviewed
  reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
  adminNotes: text("admin_notes"), // Admin's notes/feedback
  
  // Approval/denial details
  approvedSchools: jsonb("approved_schools"), // Schools that were approved (might be subset of requested)
  denialReason: text("denial_reason"), // Reason for denial
  nextSteps: text("next_steps"), // Instructions for user if denied
  
  // Email tracking
  emailsSent: jsonb("emails_sent").default('{}'), // Track which emails were sent
  
  // Timestamps
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  // Indexes for efficient queries
  index("school_requests_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  index("school_requests_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
  index("school_requests_created_idx").using("btree", table.createdAt.desc().nullsLast().op("timestamp_ops")),
  index("school_requests_reviewed_idx").using("btree", table.reviewedAt.desc().nullsLast().op("timestamp_ops")),
  
  // Foreign keys
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "school_requests_user_id_user_id_fk"
  }).onDelete("cascade"),
  
  foreignKey({
    columns: [table.reviewedBy],
    foreignColumns: [user.id],
    name: "school_requests_reviewed_by_user_id_fk"
  }).onDelete("set null"),
]);

// Export types for TypeScript
export type SchoolApprovalRequest = typeof schoolApprovalRequests.$inferSelect;
export type NewSchoolApprovalRequest = typeof schoolApprovalRequests.$inferInsert;

// Add missing import for index
import { index, foreignKey } from "drizzle-orm/pg-core";