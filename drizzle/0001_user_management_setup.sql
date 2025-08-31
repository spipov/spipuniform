-- User Management System Migration
-- This migration sets up the roles and users tables for the user management system

-- First, drop the existing users table since it conflicts with our new schema
DROP TABLE IF EXISTS "users" CASCADE;

-- Create roles table
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"permissions" jsonb DEFAULT '{}' NOT NULL,
	"color" text DEFAULT '#6B7280' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);

-- Create users table with proper UUID primary key
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role_id" uuid,
	"color" text DEFAULT '#3B82F6',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Create user_sessions table
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" 
	FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;

-- Add missing columns to better-auth tables
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "impersonatedBy" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banReason" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banExpires" timestamp;

-- Update posts table to remove the broken foreign key
ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_author_id_users_id_fk";
ALTER TABLE "posts" ALTER COLUMN "author_id" DROP NOT NULL;

-- Insert default roles
INSERT INTO roles (name, permissions, color) VALUES 
('Admin', '{"manageUsers": true, "manageRoles": true, "viewReports": true, "systemSettings": true}', '#EF4444'),
('User', '{"viewProfile": true, "editProfile": true}', '#10B981'),
('Moderator', '{"manageUsers": true, "viewReports": true, "editProfile": true}', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role_id" ON "users"("role_id");
CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_roles_name" ON "roles"("name");
CREATE INDEX IF NOT EXISTS "idx_roles_permissions" ON "roles" USING GIN("permissions");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_id" ON "user_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_expires_at" ON "user_sessions"("expires_at");