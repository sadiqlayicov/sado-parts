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
