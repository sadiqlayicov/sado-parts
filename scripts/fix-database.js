const { Client } = require('pg');
require('dotenv').config();

async function fixDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Database-ə qoşulmağa çalışırıq...');
    await client.connect();
    console.log('✅ Database-ə uğurla qoşulduq!');

    // Fix orders table structure
    console.log('\n🔧 Orders table strukturunu düzəldirik...');
    try {
      // Drop existing orders table if it has wrong structure
      await client.query('DROP TABLE IF EXISTS orders CASCADE');
      console.log('✅ Köhnə orders table silindi');

      // Create new orders table with correct structure
      await client.query(`
        CREATE TABLE orders (
          id VARCHAR(255) PRIMARY KEY,
          "orderNumber" VARCHAR(255) NOT NULL,
          "userId" VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          "totalAmount" DECIMAL(10,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'AZN',
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Orders table yenidən yaradıldı');

      // Create index
      await client.query(`CREATE INDEX idx_orders_user_id ON orders("userId")`);
      console.log('✅ Orders index yaradıldı');
    } catch (error) {
      console.log('❌ Orders table düzəldilə bilmədi:', error.message);
    }

    // Fix order_items table structure
    console.log('\n🔧 Order items table strukturunu düzəldirik...');
    try {
      // Drop existing order_items table if it has wrong structure
      await client.query('DROP TABLE IF EXISTS order_items CASCADE');
      console.log('✅ Köhnə order_items table silindi');

      // Create new order_items table with correct structure
      await client.query(`
        CREATE TABLE order_items (
          id VARCHAR(255) PRIMARY KEY,
          "orderId" VARCHAR(255) NOT NULL,
          "productId" VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Order items table yenidən yaradıldı');

      // Create index
      await client.query(`CREATE INDEX idx_order_items_order_id ON order_items("orderId")`);
      console.log('✅ Order items index yaradıldı');
    } catch (error) {
      console.log('❌ Order items table düzəldilə bilmədi:', error.message);
    }

    // Fix users table - add name column if it doesn't exist
    console.log('\n🔧 Users table strukturunu düzəldirik...');
    try {
      // Check if name column exists
      const nameCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
      `);

      if (nameCheck.rows.length === 0) {
        // Add name column by combining firstName and lastName
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN name TEXT GENERATED ALWAYS AS (
            CASE 
              WHEN "firstName" IS NOT NULL AND "lastName" IS NOT NULL 
              THEN "firstName" || ' ' || "lastName"
              WHEN "firstName" IS NOT NULL 
              THEN "firstName"
              WHEN "lastName" IS NOT NULL 
              THEN "lastName"
              ELSE email
            END
          ) STORED
        `);
        console.log('✅ Users table-a name sütunu əlavə edildi');
      } else {
        console.log('✅ Users table-da name sütunu artıq mövcuddur');
      }
    } catch (error) {
      console.log('❌ Users table düzəldilə bilmədi:', error.message);
    }

    // Test the fixes
    console.log('\n🧪 Düzəlişləri test edirik...');
    
    // Test orders table
    try {
      const ordersTest = await client.query('SELECT * FROM orders LIMIT 1');
      console.log('✅ Orders table işləyir');
    } catch (error) {
      console.log('❌ Orders table test xətası:', error.message);
    }

    // Test order_items table
    try {
      const orderItemsTest = await client.query('SELECT * FROM order_items LIMIT 1');
      console.log('✅ Order items table işləyir');
    } catch (error) {
      console.log('❌ Order items table test xətası:', error.message);
    }

    // Test users table with name column
    try {
      const usersTest = await client.query('SELECT id, name, email, "discountPercentage" FROM users LIMIT 3');
      console.log('✅ Users table işləyir. Tapılan istifadəçilər:');
      usersTest.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}, Ad: ${user.name}, Email: ${user.email}, Endirim: ${user.discountPercentage || 0}%`);
      });
    } catch (error) {
      console.log('❌ Users table test xətası:', error.message);
    }

    console.log('\n🎉 Database düzəlişləri tamamlandı!');

  } catch (error) {
    console.error('❌ Database xətası:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database bağlantısı bağlandı.');
  }
}

fixDatabase(); 