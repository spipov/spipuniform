CREATE TABLE "request_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"alt_text" text,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_categories" ADD COLUMN "image_file_id" uuid;--> statement-breakpoint
ALTER TABLE "product_types" ADD COLUMN "image_file_id" uuid;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "attributes" jsonb;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "has_school_crest" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "school_stock" ADD COLUMN "attributes" jsonb;--> statement-breakpoint
ALTER TABLE "school_stock" ADD COLUMN "has_school_crest" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "request_images" ADD CONSTRAINT "request_images_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_images" ADD CONSTRAINT "request_images_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "request_images_request_idx" ON "request_images" USING btree ("request_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "request_images_order_idx" ON "request_images" USING btree ("order" int4_ops);--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_image_file_id_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_image_file_id_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "size";--> statement-breakpoint
ALTER TABLE "school_stock" DROP COLUMN "size";