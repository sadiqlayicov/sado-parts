const { Client } = require('pg');

async function fixCartTable() {
  console.log('Fixing cart_items table structure...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });

  try {
    await client.connect();
    console.log('✅ Database connected successfully');

    // Drop existing cart_items table if it exists
    console.log('🗑️ Dropping existing cart_items table...');
    await client.query('DROP TABLE IF EXISTS cart_items CASCADE');
    
    // Create new cart_items table with proper structure
    console.log('🏗️ Creating new cart_items table...');
    await client.query(`
      CREATE TABLE cart_items (
        id VARCHAR(255) PRIMARY KEY,
        "userId" VARCHAR(255) NOT NULL,
        "productId" VARCHAR(255) NOT NULL,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        "salePrice" DECIMAL(10,2) NOT NULL,
        images TEXT[],
        stock INTEGER DEFAULT 10,
        sku VARCHAR(255),
        "categoryName" VARCHAR(255),
        quantity INTEGER NOT NULL DEFAULT 1,
        "totalPrice" DECIMAL(10,2) NOT NULL,
        "totalSalePrice" DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    console.log('📊 Creating indexes...');
    await client.query(`CREATE INDEX idx_cart_items_user_id ON cart_items("userId")`);
    await client.query(`CREATE INDEX idx_cart_items_product_id ON cart_items("productId")`);
    
    console.log('✅ Cart items table created successfully with proper structure');
    
    // Verify table structure
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'cart_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 New cart_items table structure:');
    tableStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Error fixing cart table:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Load environment variables
require('dotenv').config();

fixCartTable(); 