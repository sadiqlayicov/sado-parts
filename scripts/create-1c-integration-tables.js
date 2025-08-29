const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function create1CIntegrationTables() {
  let client;
  
  try {
    console.log('🔧 Creating 1C Integration Tables...\n');
    
    client = await pool.connect();
    
    // Create integration_status table
    console.log('1. Creating integration_status table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS integration_status (
        id SERIAL PRIMARY KEY,
        integration_type VARCHAR(50) NOT NULL UNIQUE,
        is_connected BOOLEAN DEFAULT false,
        last_sync TIMESTAMP,
        sync_status VARCHAR(20) DEFAULT 'idle',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ integration_status table created');
    
    // Create integration_settings table
    console.log('2. Creating integration_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS integration_settings (
        id SERIAL PRIMARY KEY,
        integration_type VARCHAR(50) NOT NULL UNIQUE,
        url TEXT,
        username VARCHAR(255),
        password VARCHAR(255),
        enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ integration_settings table created');
    
    // Create sync_log table
    console.log('3. Creating sync_log table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id SERIAL PRIMARY KEY,
        integration_type VARCHAR(50) NOT NULL,
        sync_type VARCHAR(50) NOT NULL,
        success BOOLEAN DEFAULT false,
        message TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ sync_log table created');
    
    // Create onec_products table for synced products
    console.log('4. Creating onec_products table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS onec_products (
        id SERIAL PRIMARY KEY,
        onec_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(500) NOT NULL,
        sku VARCHAR(255),
        price DECIMAL(10,2),
        description TEXT,
        category_name VARCHAR(255),
        quantity INTEGER DEFAULT 0,
        last_sync TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ onec_products table created');
    
    // Create onec_orders table for synced orders
    console.log('5. Creating onec_orders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS onec_orders (
        id SERIAL PRIMARY KEY,
        onec_id VARCHAR(255) UNIQUE NOT NULL,
        order_number VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        total_amount DECIMAL(10,2),
        status VARCHAR(50),
        order_date TIMESTAMP,
        last_sync TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ onec_orders table created');
    
    // Create onec_order_items table
    console.log('6. Creating onec_order_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS onec_order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES onec_orders(id) ON DELETE CASCADE,
        product_onec_id VARCHAR(255),
        product_name VARCHAR(500),
        quantity INTEGER,
        price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ onec_order_items table created');
    
    // Insert default integration status
    console.log('7. Inserting default integration status...');
    await client.query(`
      INSERT INTO integration_status (integration_type, is_connected, sync_status)
      VALUES ('1c', false, 'idle')
      ON CONFLICT (integration_type) DO NOTHING
    `);
    console.log('✅ Default integration status inserted');
    
    console.log('\n🎉 All 1C Integration tables created successfully!');
    
    // Show table structure
    console.log('\n📋 Table Structure:');
    console.log('- integration_status: Status tracking for integrations');
    console.log('- integration_settings: Connection settings for integrations');
    console.log('- sync_log: Log of all sync operations');
    console.log('- onec_products: Products synced from 1C');
    console.log('- onec_orders: Orders synced from 1C');
    console.log('- onec_order_items: Order items synced from 1C');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the script
create1CIntegrationTables().catch(console.error);
