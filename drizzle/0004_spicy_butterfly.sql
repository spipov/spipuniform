CREATE TYPE "public"."credential_provider" AS ENUM('google', 'microsoft', 'aws', 'azure', 'sendgrid', 'mailgun', 'custom');--> statement-breakpoint
CREATE TYPE "public"."credential_type" AS ENUM('oauth_google', 'oauth_microsoft', 'smtp', 'imap', 'api_key', 'webhook', 'database', 'storage');--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "credential_type" NOT NULL,
	"provider" "credential_provider" NOT NULL,
	"client_id" text,
	"client_secret" text,
	"api_key" text,
	"username" text,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp,
	"tenant_id" text,
	"project_id" text,
	"region" text,
	"endpoint" text,
	"config" jsonb,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_settings" ADD COLUMN "imap_host" text;--> statement-breakpoint
ALTER TABLE "email_settings" ADD COLUMN "imap_port" text;--> statement-breakpoint
ALTER TABLE "email_settings" ADD COLUMN "imap_user" text;--> statement-breakpoint
ALTER TABLE "email_settings" ADD COLUMN "imap_password" text;--> statement-breakpoint
ALTER TABLE "email_settings" ADD COLUMN "imap_secure" boolean DEFAULT true;--> statement-breakpoint
CREATE INDEX "credentials_type_idx" ON "credentials" USING btree ("type");--> statement-breakpoint
CREATE INDEX "credentials_provider_idx" ON "credentials" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "credentials_active_idx" ON "credentials" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "credentials_default_idx" ON "credentials" USING btree ("is_default");