const { Client } = require('pg');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful!');
    
    // Test query
    const result = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Users count: ${result.rows[0].count}`);
    
    // Test users table
    const users = await client.query('SELECT id, email, name FROM users LIMIT 3');
    console.log('👥 Sample users:');
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.name || 'No name'})`);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

testConnection(); 