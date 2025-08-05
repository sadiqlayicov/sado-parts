const { Client } = require('pg');

async function createCartTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create cart_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id VARCHAR(255) PRIMARY KEY,
        "userId" VARCHAR(255) NOT NULL,
        "productId" VARCHAR(255) NOT NULL,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        "salePrice" DECIMAL(10,2) NOT NULL,
        images TEXT[],
        stock INTEGER DEFAULT 10,
        sku VARCHAR(255),
        "categoryName" VARCHAR(255),
        quantity INTEGER NOT NULL DEFAULT 1,
        "totalPrice" DECIMAL(10,2) NOT NULL,
        "totalSalePrice" DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Cart items table created successfully');

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items("userId")
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items("productId")
    `);

    console.log('Indexes created successfully');

  } catch (error) {
    console.error('Error creating cart tables:', error);
  } finally {
    await client.end();
  }
}

createCartTables(); 