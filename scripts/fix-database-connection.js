require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  // Get the DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  console.log('📋 DATABASE_URL:', databaseUrl ? 'Found' : 'Not found');
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    return;
  }

  // Parse the connection string to check format
  try {
    const url = new URL(databaseUrl);
    console.log('🔗 Connection URL parsed successfully');
    console.log('📍 Host:', url.hostname);
    console.log('📊 Database:', url.pathname.slice(1));
    console.log('👤 User:', url.username);
    console.log('🔑 Password:', url.password ? 'Set' : 'Not set');
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error.message);
    return;
  }

  // Use connection pool instead of single client
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    },
    max: 1, // Limit to 1 connection for testing
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  let client;
  try {
    console.log('🔄 Attempting to connect...');
    client = await pool.connect();
    console.log('✅ Database connected successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Current database time:', result.rows[0].current_time);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check products table specifically
    if (tablesResult.rows.some(row => row.table_name === 'products')) {
      const productsCount = await client.query('SELECT COUNT(*) as count FROM products');
      console.log(`📦 Products count: ${productsCount.rows[0].count}`);
      
      const activeProducts = await client.query('SELECT COUNT(*) as count FROM products WHERE "isActive" = true');
      console.log(`✅ Active products: ${activeProducts.rows[0].count}`);
      
      // Get a few sample products
      const sampleProducts = await client.query('SELECT id, name, price, "isActive" FROM products LIMIT 3');
      console.log('📋 Sample products:');
      sampleProducts.rows.forEach(product => {
        console.log(`  - ${product.name} (ID: ${product.id}, Price: ${product.price}, Active: ${product.isActive})`);
      });
    } else {
      console.log('⚠️ Products table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Full error:', error);
    
    // Provide specific solutions based on error type
    if (error.message.includes('Max client connections reached')) {
      console.log('\n💡 Solution: Max connections reached');
      console.log('   This is a common Supabase issue. Try:');
      console.log('   1. Wait a few minutes and try again');
      console.log('   2. Check your Supabase project status');
      console.log('   3. Upgrade your Supabase plan if needed');
    } else if (error.message.includes('password must be a string')) {
      console.log('\n💡 Solution: Check your DATABASE_URL format');
      console.log('   Make sure it follows this format:');
      console.log('   postgresql://username:password@host:port/database');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Solution: Check your database host');
      console.log('   Make sure the hostname is correct');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solution: Check if database is running');
      console.log('   Make sure your Supabase project is active');
    }
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the test
testConnection().catch(console.error);
