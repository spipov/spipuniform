CREATE TYPE "public"."email_provider" AS ENUM('smtp', 'microsoft365', 'google_workspace');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('pending', 'sent', 'failed', 'delivered', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."template_type" AS ENUM('welcome', 'reset_password', 'verification', 'notification', 'custom');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('file', 'folder');--> statement-breakpoint
CREATE TYPE "public"."storage_provider" AS ENUM('local', 's3', 'pcloud');--> statement-breakpoint
CREATE TABLE "branding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_name" text NOT NULL,
	"site_description" text,
	"site_url" text,
	"logo_url" text,
	"logo_alt" text,
	"favicon_url" text,
	"primary_color" text DEFAULT '#3b82f6',
	"secondary_color" text DEFAULT '#64748b',
	"accent_color" text DEFAULT '#f59e0b',
	"background_color" text DEFAULT '#ffffff',
	"text_color" text DEFAULT '#1f2937',
	"font_family" text DEFAULT 'Inter, sans-serif',
	"heading_font" text,
	"border_radius" text DEFAULT '0.5rem',
	"spacing" text DEFAULT '1rem',
	"support_email" text,
	"contact_phone" text,
	"social_links" jsonb,
	"custom_css" text,
	"is_active" boolean DEFAULT true,
	"version" text DEFAULT '1.0.0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_email" text NOT NULL,
	"from_email" text NOT NULL,
	"subject" text NOT NULL,
	"template_id" uuid,
	"template_name" text,
	"settings_id" uuid,
	"provider" "email_provider" NOT NULL,
	"status" "email_status" DEFAULT 'pending' NOT NULL,
	"message_id" text,
	"error_message" text,
	"error_code" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "email_provider" NOT NULL,
	"is_active" boolean DEFAULT false,
	"smtp_host" text,
	"smtp_port" text,
	"smtp_user" text,
	"smtp_password" text,
	"smtp_secure" boolean DEFAULT true,
	"client_id" text,
	"client_secret" text,
	"tenant_id" text,
	"refresh_token" text,
	"access_token" text,
	"token_expiry" timestamp,
	"from_name" text NOT NULL,
	"from_email" text NOT NULL,
	"reply_to_email" text,
	"config_name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "template_type" NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"variables" jsonb,
	"use_branding" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"description" text,
	"version" text DEFAULT '1.0.0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"user_id" uuid,
	"can_read" boolean DEFAULT false,
	"can_write" boolean DEFAULT false,
	"can_delete" boolean DEFAULT false,
	"can_share" boolean DEFAULT false,
	"granted_by" uuid,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"path" text DEFAULT '/' NOT NULL,
	"type" "file_type" NOT NULL,
	"provider" "storage_provider" NOT NULL,
	"size" bigint DEFAULT 0,
	"mime_type" text,
	"url" text,
	"parent_id" uuid,
	"owner_id" uuid,
	"metadata" jsonb,
	"is_public" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "storage_provider" NOT NULL,
	"is_active" boolean DEFAULT false,
	"config" jsonb DEFAULT '{}'::jsonb,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_settings_id_email_settings_id_fk" FOREIGN KEY ("settings_id") REFERENCES "public"."email_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_permissions" ADD CONSTRAINT "file_permissions_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_permissions" ADD CONSTRAINT "file_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_permissions" ADD CONSTRAINT "file_permissions_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_parent_id_files_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "branding_active_idx" ON "branding" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "branding_created_at_idx" ON "branding" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_logs_status_idx" ON "email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_logs_to_email_idx" ON "email_logs" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX "email_logs_provider_idx" ON "email_logs" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "email_logs_created_at_idx" ON "email_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_logs_template_idx" ON "email_logs" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "email_settings_active_idx" ON "email_settings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "email_settings_provider_idx" ON "email_settings" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "email_templates_type_idx" ON "email_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "email_templates_active_idx" ON "email_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "email_templates_default_idx" ON "email_templates" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "file_permissions_file_user_idx" ON "file_permissions" USING btree ("file_id","user_id");--> statement-breakpoint
CREATE INDEX "file_permissions_user_idx" ON "file_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "file_permissions_file_idx" ON "file_permissions" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "files_path_idx" ON "files" USING btree ("path");--> statement-breakpoint
CREATE INDEX "files_parent_idx" ON "files" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "files_owner_idx" ON "files" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "files_type_idx" ON "files" USING btree ("type");--> statement-breakpoint
CREATE INDEX "files_provider_idx" ON "files" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "files_path_name_idx" ON "files" USING btree ("path","name");--> statement-breakpoint
CREATE INDEX "files_deleted_idx" ON "files" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "storage_settings_active_idx" ON "storage_settings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "storage_settings_provider_idx" ON "storage_settings" USING btree ("provider");--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "author_id";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "updated_at";