const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkAndCreateTables() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connected successfully');

    // Check if orders table exists
    const ordersTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);

    if (!ordersTableCheck.rows[0].exists) {
      console.log('Orders table does not exist. Creating...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
          "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'pending',
          "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
          currency VARCHAR(10) DEFAULT 'RUB',
          notes TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('Orders table created successfully');
    } else {
      console.log('Orders table already exists');
    }

    // Check if order_items table exists
    const orderItemsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items'
      );
    `);

    if (!orderItemsTableCheck.rows[0].exists) {
      console.log('Order_items table does not exist. Creating...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "orderId" UUID REFERENCES orders(id) ON DELETE CASCADE,
          "productId" UUID REFERENCES products(id) ON DELETE SET NULL,
          name VARCHAR(255) NOT NULL,
          sku VARCHAR(255),
          "categoryName" VARCHAR(255),
          quantity INTEGER NOT NULL DEFAULT 1,
          price DECIMAL(10,2) NOT NULL DEFAULT 0,
          "totalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('Order_items table created successfully');
    } else {
      console.log('Order_items table already exists');
    }

    // Check table structure
    console.log('\nChecking table structures...');
    
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

    const orderItemsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nOrder_items table columns:');
    orderItemsColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check if there are any orders
    const ordersCount = await client.query('SELECT COUNT(*) FROM orders');
    console.log(`\nTotal orders in database: ${ordersCount.rows[0].count}`);

    const orderItemsCount = await client.query('SELECT COUNT(*) FROM order_items');
    console.log(`Total order items in database: ${orderItemsCount.rows[0].count}`);

    console.log('\n✅ Database check completed successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkAndCreateTables();
