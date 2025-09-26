-- Add image support for product categories and product types
ALTER TABLE product_categories ADD COLUMN image_file_id UUID REFERENCES files(id) ON DELETE SET NULL;
ALTER TABLE product_types ADD COLUMN image_file_id UUID REFERENCES files(id) ON DELETE SET NULL;