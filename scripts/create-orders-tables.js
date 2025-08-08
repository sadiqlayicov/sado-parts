const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createOrdersTables() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');

    // Create orders table
    console.log('📋 Creating orders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
        "userId" VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        "totalAmount" DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'RUB',
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders("userId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    console.log('✅ Orders table created successfully');

    // Create order_items table
    console.log('📋 Creating order_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(255) PRIMARY KEY,
        "orderId" VARCHAR(255) NOT NULL,
        "productId" VARCHAR(255) NOT NULL,
        name VARCHAR(500) NOT NULL,
        sku VARCHAR(255),
        "categoryName" VARCHAR(255),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        "totalPrice" DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items("orderId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items("productId")`);
    console.log('✅ Order items table created successfully');

    console.log('🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    if (client) {
      await client.release();
    }
    await pool.end();
  }
}

createOrdersTables(); 