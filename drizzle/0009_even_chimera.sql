CREATE TYPE "public"."school_level_submission" AS ENUM('primary', 'secondary', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."school_submission_status" AS ENUM('pending', 'approved', 'rejected', 'duplicate');--> statement-breakpoint
CREATE TYPE "public"."school_request_status" AS ENUM('pending', 'approved', 'denied', 'cancelled');--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_favorites_user_listing_unique" UNIQUE("user_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "school_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submitted_by" text NOT NULL,
	"school_name" text NOT NULL,
	"address" text NOT NULL,
	"county_id" uuid NOT NULL,
	"locality_id" uuid,
	"level" "school_level_submission" NOT NULL,
	"website" text,
	"phone" text,
	"email" text,
	"submission_reason" text NOT NULL,
	"additional_notes" text,
	"status" "school_submission_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"admin_notes" text,
	"rejection_reason" text,
	"created_school_id" uuid,
	"duplicate_school_id" uuid,
	"normalized_name" text NOT NULL,
	"location_fingerprint" text,
	"emails_sent" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"current_schools" jsonb NOT NULL,
	"requested_schools" jsonb NOT NULL,
	"reason" text NOT NULL,
	"status" "school_request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"admin_notes" text,
	"approved_schools" jsonb,
	"denial_reason" text,
	"next_steps" text,
	"emails_sent" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_submissions" ADD CONSTRAINT "school_submissions_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_submissions" ADD CONSTRAINT "school_submissions_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_submissions" ADD CONSTRAINT "school_submissions_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_submissions" ADD CONSTRAINT "school_submissions_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_approval_requests" ADD CONSTRAINT "school_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_approval_requests" ADD CONSTRAINT "school_requests_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_favorites_user_idx" ON "user_favorites" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "user_favorites_listing_idx" ON "user_favorites" USING btree ("listing_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "user_favorites_created_idx" ON "user_favorites" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "school_submissions_submitted_by_idx" ON "school_submissions" USING btree ("submitted_by" text_ops);--> statement-breakpoint
CREATE INDEX "school_submissions_status_idx" ON "school_submissions" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "school_submissions_created_idx" ON "school_submissions" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "school_submissions_county_idx" ON "school_submissions" USING btree ("county_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "school_submissions_normalized_name_idx" ON "school_submissions" USING btree ("normalized_name" text_ops);--> statement-breakpoint
CREATE INDEX "school_requests_user_idx" ON "school_approval_requests" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "school_requests_status_idx" ON "school_approval_requests" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "school_requests_created_idx" ON "school_approval_requests" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "school_requests_reviewed_idx" ON "school_approval_requests" USING btree ("reviewed_at" timestamp_ops);