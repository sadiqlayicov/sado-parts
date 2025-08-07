const { Client } = require('pg');

async function checkProductPrices() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check products with salePrice values
    const result = await client.query(`
      SELECT id, name, price, "salePrice", "isActive"
      FROM products 
      WHERE "salePrice" IS NOT NULL 
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `);

    console.log('\n=== Products with salePrice values ===');
    result.rows.forEach(row => {
      console.log({
        name: row.name,
        price: row.price,
        salePrice: row.salePrice,
        isActive: row.isActive,
        discountPercentage: row.salePrice ? Math.round((1 - row.salePrice / row.price) * 100) : 0
      });
    });

    // Check total products
    const totalResult = await client.query('SELECT COUNT(*) as total FROM products WHERE "isActive" = true');
    console.log(`\nTotal active products: ${totalResult.rows[0].total}`);

    // Check products with salePrice > 0
    const salePriceResult = await client.query('SELECT COUNT(*) as total FROM products WHERE "salePrice" > 0 AND "isActive" = true');
    console.log(`Products with salePrice > 0: ${salePriceResult.rows[0].total}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkProductPrices();
