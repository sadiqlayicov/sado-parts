-- 1C Integration - Products Table Columns
-- Bu script yalnız products cədvəlinə 1C sütunlarını əlavə edir

-- 1C ID sütunu
ALTER TABLE products ADD COLUMN IF NOT EXISTS "1c_id" VARCHAR(255);

-- SKU sütunu  
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(255);

-- Stok miqdarı sütunu
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Əlavə 1C atribut sütunları
ALTER TABLE products ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_number VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);

-- Sütunların əlavə edildiyini yoxla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND column_name IN ('1c_id', 'sku', 'stock_quantity', 'full_name', 'catalog_number', 'comment', 'category_name')
ORDER BY column_name;
