const { Client } = require('pg');
require('dotenv').config();

async function testDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Database-ə qoşulmağa çalışırıq...');
    await client.connect();
    console.log('✅ Database-ə uğurla qoşulduq!');

    // Test cart_items table
    console.log('\n📋 Cart items table-ı yoxlayırıq...');
    try {
      const cartResult = await client.query('SELECT * FROM cart_items LIMIT 5');
      console.log(`✅ Cart items table mövcuddur. ${cartResult.rows.length} məhsul tapıldı:`);
      cartResult.rows.forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item.id}, Məhsul: ${item.name}, Miqdar: ${item.quantity}, Qiymət: ${item.price}`);
      });
    } catch (error) {
      console.log('❌ Cart items table tapılmadı və ya xəta var:', error.message);
    }

    // Test orders table
    console.log('\n📋 Orders table-ı yoxlayırıq...');
    try {
      const ordersResult = await client.query('SELECT * FROM orders LIMIT 5');
      console.log(`✅ Orders table mövcuddur. ${ordersResult.rows.length} sifariş tapıldı:`);
      ordersResult.rows.forEach((order, index) => {
        console.log(`  ${index + 1}. ID: ${order.id}, Sifariş №: ${order.orderNumber}, Məbləğ: ${order.totalAmount}, Status: ${order.status}`);
      });
    } catch (error) {
      console.log('❌ Orders table tapılmadı və ya xəta var:', error.message);
    }

    // Test order_items table
    console.log('\n📋 Order items table-ı yoxlayırıq...');
    try {
      const orderItemsResult = await client.query('SELECT * FROM order_items LIMIT 5');
      console.log(`✅ Order items table mövcuddur. ${orderItemsResult.rows.length} sifariş elementi tapıldı:`);
      orderItemsResult.rows.forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item.id}, Sifariş ID: ${item.orderId}, Məhsul ID: ${item.productId}, Miqdar: ${item.quantity}, Qiymət: ${item.price}`);
      });
    } catch (error) {
      console.log('❌ Order items table tapılmadı və ya xəta var:', error.message);
    }

    // Test products table
    console.log('\n📋 Products table-ı yoxlayırıq...');
    try {
      const productsResult = await client.query('SELECT * FROM products LIMIT 5');
      console.log(`✅ Products table mövcuddur. ${productsResult.rows.length} məhsul tapıldı:`);
      productsResult.rows.forEach((product, index) => {
        console.log(`  ${index + 1}. ID: ${product.id}, Ad: ${product.name}, Qiymət: ${product.price}, SKU: ${product.sku || product.artikul}`);
      });
    } catch (error) {
      console.log('❌ Products table tapılmadı və ya xəta var:', error.message);
    }

    // Test users table
    console.log('\n📋 Users table-ı yoxlayırıq...');
    try {
      const usersResult = await client.query('SELECT id, name, email, "discountPercentage" FROM users LIMIT 5');
      console.log(`✅ Users table mövcuddur. ${usersResult.rows.length} istifadəçi tapıldı:`);
      usersResult.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}, Ad: ${user.name}, Email: ${user.email}, Endirim: ${user.discountPercentage}%`);
      });
    } catch (error) {
      console.log('❌ Users table tapılmadı və ya xəta var:', error.message);
    }

    // Test table structure
    console.log('\n🔍 Table strukturlarını yoxlayırıq...');
    try {
      const tables = ['cart_items', 'orders', 'order_items', 'products', 'users'];
      for (const table of tables) {
        try {
          const structureResult = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
          `, [table]);
          console.log(`\n📊 ${table} table strukturu:`);
          structureResult.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
          });
        } catch (error) {
          console.log(`❌ ${table} table strukturu yoxlanıla bilmədi:`, error.message);
        }
      }
    } catch (error) {
      console.log('❌ Table strukturları yoxlanıla bilmədi:', error.message);
    }

  } catch (error) {
    console.error('❌ Database xətası:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database bağlantısı bağlandı.');
  }
}

testDatabase(); 