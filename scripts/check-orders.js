const { Client } = require('pg');

async function checkOrders() {
  console.log('Checking orders table...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('✅ Database connected successfully');

    // Check if orders table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Orders table does not exist');
      return;
    }

    console.log('✅ Orders table exists');

    // Check orders count
    const ordersCount = await client.query('SELECT COUNT(*) FROM orders');
    console.log(`📊 Total orders: ${ordersCount.rows[0].count}`);

    // Check order_items count
    const orderItemsCount = await client.query('SELECT COUNT(*) FROM order_items');
    console.log(`📊 Total order items: ${orderItemsCount.rows[0].count}`);

    // Get sample orders
    const sampleOrders = await client.query('SELECT id, "orderNumber", "userId", status, "totalAmount" FROM orders LIMIT 5');
    console.log('📋 Sample orders:');
    sampleOrders.rows.forEach(order => {
      console.log(`  - ${order.orderNumber}: ${order.totalAmount}₼ (${order.status})`);
    });

    // Get sample order items
    const sampleOrderItems = await client.query('SELECT "orderId", "productId", quantity, price FROM order_items LIMIT 5');
    console.log('📋 Sample order items:');
    sampleOrderItems.rows.forEach(item => {
      console.log(`  - Order: ${item.orderId}, Product: ${item.productId}, Qty: ${item.quantity}, Price: ${item.price}₼`);
    });

  } catch (error) {
    console.error('❌ Error checking orders:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Load environment variables
require('dotenv').config();

checkOrders(); 