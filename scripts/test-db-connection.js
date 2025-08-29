const { Pool } = require('pg');
require('dotenv').config();

console.log('Testing database connection...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  let client;
  
  try {
    console.log('Attempting to connect to database...');
    client = await pool.connect();
    console.log('✅ Successfully connected to database!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Current database time:', result.rows[0].current_time);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('products', 'categories')
      ORDER BY table_name;
    `);
    
    console.log('Available tables:', tablesResult.rows.map(row => row.table_name));
    
    // Check categories count
    try {
      const categoriesCount = await client.query('SELECT COUNT(*) FROM categories');
      console.log('Categories count:', categoriesCount.rows[0].count);
    } catch (error) {
      console.log('Categories table error:', error.message);
    }
    
    // Check products count
    try {
      const productsCount = await client.query('SELECT COUNT(*) FROM products');
      console.log('Products count:', productsCount.rows[0].count);
    } catch (error) {
      console.log('Products table error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testConnection();
