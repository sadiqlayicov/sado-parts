const { Client } = require('pg');

async function checkDatabaseTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if orders table exists
    const ordersTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);
    console.log('Orders table exists:', ordersTableCheck.rows[0].exists);

    // Check if order_items table exists
    const orderItemsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items'
      );
    `);
    console.log('Order_items table exists:', orderItemsTableCheck.rows[0].exists);

    // Check orders table structure
    if (ordersTableCheck.rows[0].exists) {
      const ordersStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'orders'
        ORDER BY ordinal_position;
      `);
      console.log('Orders table structure:');
      ordersStructure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }

    // Check order_items table structure
    if (orderItemsTableCheck.rows[0].exists) {
      const orderItemsStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'order_items'
        ORDER BY ordinal_position;
      `);
      console.log('Order_items table structure:');
      orderItemsStructure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }

    // Check if there are any orders
    if (ordersTableCheck.rows[0].exists) {
      const ordersCount = await client.query('SELECT COUNT(*) FROM orders');
      console.log('Total orders in database:', ordersCount.rows[0].count);
    }

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await client.end();
  }
}

checkDatabaseTables(); 