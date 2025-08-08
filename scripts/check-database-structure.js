const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkDatabaseStructure() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connected successfully');

    // Check users table structure
    console.log('\n=== USERS TABLE STRUCTURE ===');
    const usersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('Users table columns:');
    usersColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check orders table structure
    console.log('\n=== ORDERS TABLE STRUCTURE ===');
    const ordersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);
    
    console.log('Orders table columns:');
    ordersColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check order_items table structure
    console.log('\n=== ORDER_ITEMS TABLE STRUCTURE ===');
    const orderItemsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position;
    `);
    
    console.log('Order_items table columns:');
    orderItemsColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check sample data
    console.log('\n=== SAMPLE DATA ===');
    
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`Total users: ${usersCount.rows[0].count}`);
    
    const ordersCount = await client.query('SELECT COUNT(*) FROM orders');
    console.log(`Total orders: ${ordersCount.rows[0].count}`);
    
    const orderItemsCount = await client.query('SELECT COUNT(*) FROM order_items');
    console.log(`Total order items: ${orderItemsCount.rows[0].count}`);

    // Show sample user data
    const sampleUser = await client.query('SELECT * FROM users LIMIT 1');
    if (sampleUser.rows.length > 0) {
      console.log('\nSample user data:');
      console.log(sampleUser.rows[0]);
    }

    // Show sample order data
    const sampleOrder = await client.query('SELECT * FROM orders LIMIT 1');
    if (sampleOrder.rows.length > 0) {
      console.log('\nSample order data:');
      console.log(sampleOrder.rows[0]);
    }

    console.log('\n✅ Database structure check completed successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkDatabaseStructure();
