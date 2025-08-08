const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkOrdersTables() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');

    // Check if orders table exists
    console.log('🔍 Checking orders table...');
    const ordersCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);
    
    if (ordersCheck.rows[0].exists) {
      console.log('✅ Orders table exists');
      
      // Check orders table structure
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
    } else {
      console.log('❌ Orders table does not exist');
    }

    // Check if order_items table exists
    console.log('🔍 Checking order_items table...');
    const orderItemsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items'
      );
    `);
    
    if (orderItemsCheck.rows[0].exists) {
      console.log('✅ Order_items table exists');
      
      // Check order_items table structure
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
    } else {
      console.log('❌ Order_items table does not exist');
    }

    // Check if tables have any data
    if (ordersCheck.rows[0].exists) {
      const ordersCount = await client.query('SELECT COUNT(*) as count FROM orders');
      console.log(`📊 Orders table has ${ordersCount.rows[0].count} records`);
    }
    
    if (orderItemsCheck.rows[0].exists) {
      const orderItemsCount = await client.query('SELECT COUNT(*) as count FROM order_items');
      console.log(`📊 Order_items table has ${orderItemsCount.rows[0].count} records`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    if (client) {
      await client.release();
    }
    await pool.end();
  }
}

checkOrdersTables();
