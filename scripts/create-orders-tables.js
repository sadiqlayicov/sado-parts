const { Client } = require('pg');

async function createOrdersTables() {
  console.log('Creating orders and order_items tables...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('✅ Database connected successfully');

    // Create orders table
    console.log('🏗️ Creating orders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
        "userId" VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        "totalAmount" DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'AZN',
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create order_items table
    console.log('🏗️ Creating order_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(255) PRIMARY KEY,
        "orderId" VARCHAR(255) NOT NULL,
        "productId" VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
    
    // Create indexes
    console.log('📊 Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders("userId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items("orderId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items("productId")`);
    
    console.log('✅ Orders and order_items tables created successfully');
    
    // Verify table structure
    const ordersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Orders table structure:');
    ordersStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    const orderItemsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Order_items table structure:');
    orderItemsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Error creating orders tables:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Load environment variables
require('dotenv').config();

createOrdersTables(); 