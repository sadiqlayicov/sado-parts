const { Client } = require('pg');

async function testCartAPI() {
  console.log('Testing Cart API database connection...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });

  try {
    await client.connect();
    console.log('✅ Database connected successfully');

    // Test if cart_items table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Cart items table exists');
      
      // Get table structure
      const tableStructure = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'cart_items' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Cart items table structure:');
      tableStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Count items
      const countResult = await client.query('SELECT COUNT(*) FROM cart_items');
      console.log(`📊 Total cart items: ${countResult.rows[0].count}`);
      
    } else {
      console.log('❌ Cart items table does not exist');
    }

    // Test products table
    const productsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);

    if (productsCheck.rows[0].exists) {
      console.log('✅ Products table exists');
      
      // Get sample products
      const productsResult = await client.query('SELECT id, name, price, "salePrice" FROM products LIMIT 3');
      console.log('📦 Sample products:');
      productsResult.rows.forEach(product => {
        console.log(`  - ${product.name}: ${product.price}₽ (sale: ${product.salePrice}₽)`);
      });
    } else {
      console.log('❌ Products table does not exist');
    }

    // Test users table
    const usersCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (usersCheck.rows[0].exists) {
      console.log('✅ Users table exists');
      
      // Get sample users
      const usersResult = await client.query('SELECT id, email, "discountPercentage" FROM users LIMIT 3');
      console.log('👥 Sample users:');
      usersResult.rows.forEach(user => {
        console.log(`  - ${user.email}: ${user.discountPercentage || 0}% discount`);
      });
    } else {
      console.log('❌ Users table does not exist');
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Load environment variables
require('dotenv').config();

testCartAPI(); 