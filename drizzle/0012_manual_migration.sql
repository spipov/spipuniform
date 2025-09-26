-- Rename size to attributes in requests table
ALTER TABLE "requests" RENAME COLUMN "size" TO "attributes";
ALTER TABLE "requests" ALTER COLUMN "attributes" TYPE jsonb USING attributes::jsonb;
ALTER TABLE "requests" ADD COLUMN "has_school_crest" boolean DEFAULT false;

-- Rename size to attributes in school_stock table  
ALTER TABLE "school_stock" RENAME COLUMN "size" TO "attributes";
ALTER TABLE "school_stock" ALTER COLUMN "attributes" TYPE jsonb USING attributes::jsonb;
ALTER TABLE "school_stock" ADD COLUMN "has_school_crest" boolean DEFAULT false;

-- Create request_images table
CREATE TABLE "request_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"alt_text" text,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "request_images" ADD CONSTRAINT "request_images_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_images" ADD CONSTRAINT "request_images_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "request_images_request_idx" ON "request_images" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_images_order_idx" ON "request_images" USING btree ("order");--> statement-breakpoint
