-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS inn VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- Update existing records to have default values
UPDATE users SET country = '' WHERE country IS NULL;
UPDATE users SET city = '' WHERE city IS NULL;
UPDATE users SET address = '' WHERE address IS NULL; 