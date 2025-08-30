-- Add 1c_id column to products table for 1C integration
-- Run this in your Supabase SQL editor

-- Check if column exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = '1c_id'
    ) THEN
        -- Add 1c_id column
        ALTER TABLE products 
        ADD COLUMN "1c_id" VARCHAR(255) UNIQUE;
        
        RAISE NOTICE 'Added 1c_id column to products table';
    ELSE
        RAISE NOTICE '1c_id column already exists';
    END IF;
END $$;

-- Also add some additional columns that might be useful for 1C integration
DO $$
BEGIN
    -- Add sku column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'sku'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN "sku" VARCHAR(255);
        
        RAISE NOTICE 'Added sku column to products table';
    END IF;
    
    -- Add stock_quantity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'stock_quantity'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN "stock_quantity" INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added stock_quantity column to products table';
    END IF;
END $$;
