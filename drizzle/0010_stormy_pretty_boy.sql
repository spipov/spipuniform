CREATE TABLE "school_owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"school_id" uuid NOT NULL,
	"role" text DEFAULT 'owner',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "school_owners_user_school_unique" UNIQUE("user_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "school_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"managed_by_user_id" text NOT NULL,
	"product_type_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category_id" uuid NOT NULL,
	"size" text,
	"condition_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1,
	"price" numeric(10, 2),
	"is_free" boolean DEFAULT false,
	"status" text DEFAULT 'active',
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_stock_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_stock_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"alt_text" text,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "school_owners" ADD CONSTRAINT "school_owners_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_owners" ADD CONSTRAINT "school_owners_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_stock" ADD CONSTRAINT "school_stock_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_stock" ADD CONSTRAINT "school_stock_managed_by_user_id_user_id_fk" FOREIGN KEY ("managed_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_stock" ADD CONSTRAINT "school_stock_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_stock" ADD CONSTRAINT "school_stock_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_stock" ADD CONSTRAINT "school_stock_condition_id_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "public"."conditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_stock_images" ADD CONSTRAINT "school_stock_images_school_stock_id_school_stock_id_fk" FOREIGN KEY ("school_stock_id") REFERENCES "public"."school_stock"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_stock_images" ADD CONSTRAINT "school_stock_images_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "school_owners_user_idx" ON "school_owners" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "school_owners_school_idx" ON "school_owners" USING btree ("school_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "school_stock_school_idx" ON "school_stock" USING btree ("school_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "school_stock_manager_idx" ON "school_stock" USING btree ("managed_by_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "school_stock_product_type_idx" ON "school_stock" USING btree ("product_type_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "school_stock_category_idx" ON "school_stock" USING btree ("category_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "school_stock_status_idx" ON "school_stock" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "school_stock_images_stock_idx" ON "school_stock_images" USING btree ("school_stock_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "school_stock_images_order_idx" ON "school_stock_images" USING btree ("order" int4_ops);