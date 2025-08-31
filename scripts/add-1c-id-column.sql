-- Add 1C integration columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS "1c_id" VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Add additional 1C attribute columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_number VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);
