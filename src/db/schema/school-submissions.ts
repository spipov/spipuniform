import { pgTable, pgEnum, uuid, text, timestamp, jsonb, boolean, index, foreignKey } from "drizzle-orm/pg-core";
import { user } from './auth';
import { counties, localities } from './spipuniform';

// Enums for school submissions
export const schoolSubmissionStatus = pgEnum("school_submission_status", [
  'pending',      // Submitted by user, awaiting admin review
  'approved',     // Approved and added to schools table
  'rejected',     // Rejected by admin with reason
  'duplicate'     // Identified as duplicate of existing school
]);

export const schoolLevelSubmission = pgEnum("school_level_submission", ['primary', 'secondary', 'mixed']);

// School submissions table for community-driven school creation
export const schoolSubmissions = pgTable("school_submissions", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  submittedBy: text("submitted_by").notNull(),
  
  // Submitted school details
  schoolName: text("school_name").notNull(),
  address: text().notNull(),
  countyId: uuid("county_id").notNull(),
  localityId: uuid("locality_id"),
  level: schoolLevelSubmission().notNull(),
  
  // Optional details
  website: text(),
  phone: text(),
  email: text(),
  
  // Submission context
  submissionReason: text("submission_reason").notNull(), // Why they're adding this school
  additionalNotes: text("additional_notes"), // Any extra info
  
  // Admin processing
  status: schoolSubmissionStatus().default('pending').notNull(),
  reviewedBy: text("reviewed_by"), // Admin user ID who reviewed
  reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
  adminNotes: text("admin_notes"), // Admin's feedback
  rejectionReason: text("rejection_reason"), // Reason for rejection
  
  // Created school reference
  createdSchoolId: uuid("created_school_id"), // ID of school created from this submission
  
  // Duplicate detection
  duplicateSchoolId: uuid("duplicate_school_id"), // ID of existing school if duplicate
  
  // Auto-detection data for duplicate prevention
  normalizedName: text("normalized_name").notNull(), // Lowercase, trimmed name for matching
  locationFingerprint: text("location_fingerprint"), // County + locality combo for matching
  
  // Email tracking
  emailsSent: jsonb("emails_sent").default('{}'), // Track notification emails
  
  // Timestamps
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  // Indexes for efficient queries
  index("school_submissions_submitted_by_idx").using("btree", table.submittedBy.asc().nullsLast().op("text_ops")),
  index("school_submissions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
  index("school_submissions_created_idx").using("btree", table.createdAt.desc().nullsLast().op("timestamp_ops")),
  index("school_submissions_county_idx").using("btree", table.countyId.asc().nullsLast().op("uuid_ops")),
  index("school_submissions_normalized_name_idx").using("btree", table.normalizedName.asc().nullsLast().op("text_ops")),
  
  // Foreign keys
  foreignKey({
    columns: [table.submittedBy],
    foreignColumns: [user.id],
    name: "school_submissions_submitted_by_user_id_fk"
  }).onDelete("cascade"),
  
  foreignKey({
    columns: [table.countyId],
    foreignColumns: [counties.id],
    name: "school_submissions_county_id_counties_id_fk"
  }),
  
  foreignKey({
    columns: [table.localityId],
    foreignColumns: [localities.id],
    name: "school_submissions_locality_id_localities_id_fk"
  }).onDelete("set null"),
  
  foreignKey({
    columns: [table.reviewedBy],
    foreignColumns: [user.id],
    name: "school_submissions_reviewed_by_user_id_fk"
  }).onDelete("set null"),
]);

// Export types for TypeScript
export type SchoolSubmission = typeof schoolSubmissions.$inferSelect;
export type NewSchoolSubmission = typeof schoolSubmissions.$inferInsert;