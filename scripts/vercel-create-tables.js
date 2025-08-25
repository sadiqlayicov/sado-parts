const { Client } = require('pg');

async function createTables() {
  console.log('🔧 Database cədvəllərini yaradıram...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Verilənlər bazasına qoşuldu!');
    
    // Create cart_items table
    const createCartItemsTable = `
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE("userId", "productId", "isActive")
      );
    `;
    
    await client.query(createCartItemsTable);
    console.log('✅ cart_items cədvəli yaradıldı!');
    
    // Create orders table
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        "totalAmount" DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'RUB',
        notes TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await client.query(createOrdersTable);
    console.log('✅ orders cədvəli yaradıldı!');
    
    // Create order_items table
    const createOrderItemsTable = `
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await client.query(createOrderItemsTable);
    console.log('✅ order_items cədvəli yaradıldı!');
    
    // Create addresses table
    const createAddressesTable = `
      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        street TEXT NOT NULL,
        city VARCHAR(255) NOT NULL,
        state VARCHAR(255),
        "postalCode" VARCHAR(20),
        country VARCHAR(255) NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await client.query(createAddressesTable);
    console.log('✅ addresses cədvəli yaradıldı!');
    
    // Check existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('cart_items', 'orders', 'order_items', 'addresses')
      ORDER BY table_name
    `);
    
    console.log('📋 Mövcud cədvəllər:');
    tablesResult.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('🎉 Bütün cədvəllər uğurla yaradıldı!');
    
  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  } finally {
    await client.end();
  }
}

// Run the function
createTables(); 