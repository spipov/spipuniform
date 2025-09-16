CREATE TYPE "public"."email_fragment_type" AS ENUM('base', 'header', 'footer', 'partial');--> statement-breakpoint
CREATE TYPE "public"."attribute_input_type" AS ENUM('alpha_sizes', 'numeric_sizes', 'age_ranges', 'age_numeric', 'shoe_sizes_uk', 'shoe_sizes_eu', 'waist_inseam', 'neck_size', 'chest_size', 'text_input', 'color_select', 'gender_select', 'material_select');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('active', 'pending', 'sold', 'removed');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'pending', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('match_found', 'request_fulfilled', 'listing_expired', 'message_received');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('open', 'fulfilled', 'closed');--> statement-breakpoint
CREATE TYPE "public"."school_level" AS ENUM('primary', 'secondary', 'mixed');--> statement-breakpoint
CREATE TABLE "email_fragments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "email_fragment_type" NOT NULL,
	"description" text,
	"html_content" text NOT NULL,
	"json_content" jsonb,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"version" text DEFAULT '1.0.0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"require_admin_approval" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value" text NOT NULL,
	"display_name" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_type_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"input_type" "attribute_input_type" NOT NULL,
	"required" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"placeholder" text,
	"help_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conditions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "counties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"osm_id" text,
	"bounding_box" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "counties_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_profile_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"date_of_birth" date,
	"school_id" uuid,
	"school_year" text,
	"current_sizes" jsonb,
	"growth_notes" text,
	"show_in_profile" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"attribute_value_id" uuid,
	"custom_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"alt_text" text,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"product_type_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"school_id" uuid,
	"category_id" uuid NOT NULL,
	"size" text,
	"condition_id" uuid NOT NULL,
	"price" numeric(10, 2),
	"is_free" boolean DEFAULT false,
	"locality_id" uuid NOT NULL,
	"status" "listing_status" DEFAULT 'pending',
	"published_at" timestamp,
	"expired_at" timestamp,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "localities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"county_id" uuid NOT NULL,
	"osm_id" text,
	"centre_lat" numeric(10, 6),
	"centre_lng" numeric(10, 6),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"matched_at" timestamp DEFAULT now() NOT NULL,
	"notified" boolean DEFAULT false,
	"notified_at" timestamp,
	"contact_exchanged" boolean DEFAULT false,
	"contact_exchanged_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"payload" jsonb,
	"read_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" text NOT NULL,
	"listing_id" uuid,
	"request_id" uuid,
	"reason" text NOT NULL,
	"description" text,
	"status" "report_status" DEFAULT 'open',
	"handled_by" text,
	"handled_at" timestamp,
	"handler_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"product_type_id" uuid NOT NULL,
	"school_id" uuid,
	"size" text,
	"condition_preference" text,
	"description" text,
	"max_price" numeric(10, 2),
	"locality_id" uuid NOT NULL,
	"status" "request_status" DEFAULT 'open',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"locality_id" uuid,
	"county_id" uuid NOT NULL,
	"level" "school_level" NOT NULL,
	"csv_source_row" jsonb,
	"external_id" text,
	"website" text,
	"phone" text,
	"email" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"business_registration_number" text,
	"vat_number" text,
	"opening_hours" jsonb,
	"service_areas" jsonb,
	"specialties" jsonb,
	"social_media" jsonb,
	"delivery_options" jsonb,
	"payment_methods" jsonb,
	"response_time" integer,
	"completion_rate" numeric(5, 2) DEFAULT '0',
	"customer_rating" numeric(3, 2) DEFAULT '0',
	"total_reviews" integer DEFAULT 0,
	"verification_documents" jsonb,
	"verified_at" timestamp,
	"verified_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shop_profiles_shop_unique" UNIQUE("shop_id")
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website" text,
	"contact_email" text,
	"phone" text,
	"address" text,
	"locality_id" uuid,
	"membership_status" "membership_status" DEFAULT 'pending',
	"is_verified" boolean DEFAULT false,
	"logo_file_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"sender_user_id" text NOT NULL,
	"message" text NOT NULL,
	"message_type" text DEFAULT 'general',
	"is_system_message" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"buyer_user_id" text,
	"seller_user_id" text NOT NULL,
	"listing_id" uuid,
	"request_id" uuid,
	"item_description" text NOT NULL,
	"condition_at_sale" text,
	"price" numeric(10, 2),
	"currency" text DEFAULT 'EUR',
	"exchange_method" text,
	"meeting_location" text,
	"scheduled_date" timestamp,
	"actual_date" timestamp,
	"buyer_notes" text,
	"seller_notes" text,
	"buyer_rating" integer,
	"seller_rating" integer,
	"buyer_feedback" text,
	"seller_feedback" text,
	"notifications_log" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"phone" text,
	"primary_school_id" uuid,
	"additional_schools" jsonb,
	"locality_id" uuid,
	"preferred_contact_method" text,
	"availability" text,
	"specific_area" text,
	"preferred_brands" jsonb,
	"preferred_conditions" jsonb,
	"notification_preferences" jsonb,
	"verification_status" text DEFAULT 'unverified',
	"total_rating" numeric(3, 2) DEFAULT '0',
	"rating_count" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watchlists_user_entity_unique" UNIQUE("user_id","entity_type","entity_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "approved" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "email_templates" ADD COLUMN "base_fragment_id" uuid;--> statement-breakpoint
ALTER TABLE "email_templates" ADD COLUMN "header_fragment_id" uuid;--> statement-breakpoint
ALTER TABLE "email_templates" ADD COLUMN "footer_fragment_id" uuid;--> statement-breakpoint
ALTER TABLE "email_templates" ADD COLUMN "include_header" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "email_templates" ADD COLUMN "include_footer" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attribute_values" ADD CONSTRAINT "listing_attribute_values_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attribute_values" ADD CONSTRAINT "listing_attribute_values_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_attribute_values" ADD CONSTRAINT "listing_attribute_values_attribute_value_id_attribute_values_id_fk" FOREIGN KEY ("attribute_value_id") REFERENCES "public"."attribute_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_condition_id_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "public"."conditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localities" ADD CONSTRAINT "localities_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_handled_by_user_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_profiles" ADD CONSTRAINT "shop_profiles_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_profiles" ADD CONSTRAINT "shop_profiles_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_logo_file_id_files_id_fk" FOREIGN KEY ("logo_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_messages" ADD CONSTRAINT "transaction_messages_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_messages" ADD CONSTRAINT "transaction_messages_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyer_user_id_user_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_seller_user_id_user_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_primary_school_id_schools_id_fk" FOREIGN KEY ("primary_school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_fragments_type_idx" ON "email_fragments" USING btree ("type");--> statement-breakpoint
CREATE INDEX "email_fragments_active_idx" ON "email_fragments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "email_fragments_default_idx" ON "email_fragments" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "attribute_values_attribute_idx" ON "attribute_values" USING btree ("attribute_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "attribute_values_sort_idx" ON "attribute_values" USING btree ("sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "attributes_product_type_idx" ON "attributes" USING btree ("product_type_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "attributes_slug_idx" ON "attributes" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "attributes_order_idx" ON "attributes" USING btree ("order" int4_ops);--> statement-breakpoint
CREATE INDEX "conditions_order_idx" ON "conditions" USING btree ("order" int4_ops);--> statement-breakpoint
CREATE INDEX "counties_name_idx" ON "counties" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "family_members_profile_idx" ON "family_members" USING btree ("user_profile_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "family_members_school_idx" ON "family_members" USING btree ("school_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "listing_attribute_values_listing_idx" ON "listing_attribute_values" USING btree ("listing_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "listing_attribute_values_attribute_idx" ON "listing_attribute_values" USING btree ("attribute_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "listing_images_listing_idx" ON "listing_images" USING btree ("listing_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "listing_images_order_idx" ON "listing_images" USING btree ("order" int4_ops);--> statement-breakpoint
CREATE INDEX "listings_user_idx" ON "listings" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "listings_product_type_idx" ON "listings" USING btree ("product_type_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "listings_school_idx" ON "listings" USING btree ("school_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "listings_category_idx" ON "listings" USING btree ("category_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "listings_locality_idx" ON "listings" USING btree ("locality_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "listings_status_idx" ON "listings" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "listings_published_idx" ON "listings" USING btree ("published_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "localities_county_idx" ON "localities" USING btree ("county_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "localities_name_idx" ON "localities" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "matches_listing_idx" ON "matches" USING btree ("listing_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "matches_request_idx" ON "matches" USING btree ("request_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "matches_matched_at_idx" ON "matches" USING btree ("matched_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type" enum_ops);--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "product_categories_slug_idx" ON "product_categories" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "product_categories_sort_idx" ON "product_categories" USING btree ("sort_order" int4_ops);--> statement-breakpoint
CREATE INDEX "product_types_category_idx" ON "product_types" USING btree ("category_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_types_slug_idx" ON "product_types" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "reports_reporter_idx" ON "reports" USING btree ("reporter_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "reports_listing_idx" ON "reports" USING btree ("listing_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "reports_request_idx" ON "reports" USING btree ("request_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "requests_user_idx" ON "requests" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "requests_product_type_idx" ON "requests" USING btree ("product_type_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "requests_school_idx" ON "requests" USING btree ("school_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "requests_locality_idx" ON "requests" USING btree ("locality_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "requests_status_idx" ON "requests" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "schools_county_idx" ON "schools" USING btree ("county_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "schools_locality_idx" ON "schools" USING btree ("locality_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "schools_level_idx" ON "schools" USING btree ("level" enum_ops);--> statement-breakpoint
CREATE INDEX "schools_name_idx" ON "schools" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "shop_profiles_shop_idx" ON "shop_profiles" USING btree ("shop_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "shop_profiles_verified_idx" ON "shop_profiles" USING btree ("verified_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "shops_user_idx" ON "shops" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "shops_locality_idx" ON "shops" USING btree ("locality_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "shops_membership_idx" ON "shops" USING btree ("membership_status" enum_ops);--> statement-breakpoint
CREATE INDEX "transaction_messages_transaction_idx" ON "transaction_messages" USING btree ("transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transaction_messages_sender_idx" ON "transaction_messages" USING btree ("sender_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "transaction_messages_created_idx" ON "transaction_messages" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "transactions_buyer_idx" ON "transactions" USING btree ("buyer_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "transactions_seller_idx" ON "transactions" USING btree ("seller_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "transactions_listing_idx" ON "transactions" USING btree ("listing_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transactions_request_idx" ON "transactions" USING btree ("request_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "user_profiles_user_idx" ON "user_profiles" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "user_profiles_school_idx" ON "user_profiles" USING btree ("primary_school_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "user_profiles_locality_idx" ON "user_profiles" USING btree ("locality_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "user_profiles_verification_idx" ON "user_profiles" USING btree ("verification_status" text_ops);--> statement-breakpoint
CREATE INDEX "watchlists_user_idx" ON "watchlists" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "watchlists_entity_idx" ON "watchlists" USING btree ("entity_type" text_ops,"entity_id" uuid_ops);--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_base_fragment_id_email_fragments_id_fk" FOREIGN KEY ("base_fragment_id") REFERENCES "public"."email_fragments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_header_fragment_id_email_fragments_id_fk" FOREIGN KEY ("header_fragment_id") REFERENCES "public"."email_fragments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_footer_fragment_id_email_fragments_id_fk" FOREIGN KEY ("footer_fragment_id") REFERENCES "public"."email_fragments"("id") ON DELETE no action ON UPDATE no action;