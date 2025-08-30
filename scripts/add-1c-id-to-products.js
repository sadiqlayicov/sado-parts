const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function add1cIdColumn() {
  let client;
  
  try {
    client = await pool.connect();
    
    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = '1c_id'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Add 1c_id column
      await client.query(`
        ALTER TABLE products 
        ADD COLUMN "1c_id" VARCHAR(255) UNIQUE
      `);
      
      console.log('✅ Added 1c_id column to products table');
    } else {
      console.log('ℹ️ 1c_id column already exists');
    }
    
  } catch (error) {
    console.error('❌ Error adding 1c_id column:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

add1cIdColumn();
