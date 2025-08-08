const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixOrderItemsTable() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');

    // Check current structure
    console.log('🔍 Checking current order_items structure...');
    const currentStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current order_items structure:');
    currentStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Add missing columns if they don't exist
    const existingColumns = currentStructure.rows.map(row => row.column_name);
    
    if (!existingColumns.includes('name')) {
      console.log('➕ Adding name column...');
      await client.query('ALTER TABLE order_items ADD COLUMN name VARCHAR(500)');
    }
    
    if (!existingColumns.includes('sku')) {
      console.log('➕ Adding sku column...');
      await client.query('ALTER TABLE order_items ADD COLUMN sku VARCHAR(255)');
    }
    
    if (!existingColumns.includes('categoryName')) {
      console.log('➕ Adding categoryName column...');
      await client.query('ALTER TABLE order_items ADD COLUMN "categoryName" VARCHAR(255)');
    }
    
    if (!existingColumns.includes('totalPrice')) {
      console.log('➕ Adding totalPrice column...');
      await client.query('ALTER TABLE order_items ADD COLUMN "totalPrice" DECIMAL(10,2)');
    }

    // Check final structure
    console.log('🔍 Checking final order_items structure...');
    const finalStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Final order_items structure:');
    finalStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('🎉 Order_items table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing order_items table:', error);
  } finally {
    if (client) {
      await client.release();
    }
    await pool.end();
  }
}

fixOrderItemsTable();
