const { Client } = require('pg');

async function directDatabaseCheck() {
  console.log('🔍 Direct database connection check...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    console.log('✅ Direct database connection successful');

    // Check tables
    console.log('📋 Checking database tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📊 Existing tables:', tablesResult.rows.map(row => row.table_name));

    // Check data counts
    console.log('📈 Checking data counts...');
    
    const productCountResult = await client.query('SELECT COUNT(*) as count FROM products');
    const categoryCountResult = await client.query('SELECT COUNT(*) as count FROM categories');
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
    
    const productCount = parseInt(productCountResult.rows[0].count);
    const categoryCount = parseInt(categoryCountResult.rows[0].count);
    const userCount = parseInt(userCountResult.rows[0].count);

    console.log('📊 Database statistics:');
    console.log(`   Products: ${productCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Users: ${userCount}`);

    // Check active products
    const activeProductsResult = await client.query('SELECT COUNT(*) as count FROM products WHERE "isActive" = true');
    const activeProducts = parseInt(activeProductsResult.rows[0].count);
    console.log(`✅ Active products: ${activeProducts}`);

    // Check active categories
    const activeCategoriesResult = await client.query('SELECT COUNT(*) as count FROM categories WHERE "isActive" = true');
    const activeCategories = parseInt(activeCategoriesResult.rows[0].count);
    console.log(`✅ Active categories: ${activeCategories}`);

    // Sample products
    if (productCount > 0) {
      console.log('\n📦 Sample products:');
      const sampleProductsResult = await client.query(`
        SELECT p.id, p.name, p.price, p."isActive", c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p."categoryId" = c.id
        WHERE p."isActive" = true
        ORDER BY p."createdAt" DESC
        LIMIT 5
      `);
      
      sampleProductsResult.rows.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ${product.price} AZN (Category: ${product.category_name || 'No category'}) [Active: ${product.isActive}]`);
      });
    }

    // Sample categories
    if (categoryCount > 0) {
      console.log('\n📂 Sample categories:');
      const sampleCategoriesResult = await client.query(`
        SELECT id, name, "isActive"
        FROM categories
        WHERE "isActive" = true
        ORDER BY name
        LIMIT 5
      `);
      
      sampleCategoriesResult.rows.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} [Active: ${category.isActive}]`);
      });
    }

    // Check for inactive products
    if (productCount > 0 && activeProducts === 0) {
      console.log('\n⚠️  All products are inactive!');
      console.log('💡 This is why no products are showing on the website');
      
      // Show some inactive products
      const inactiveProductsResult = await client.query(`
        SELECT p.id, p.name, p.price, p."isActive", c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p."categoryId" = c.id
        WHERE p."isActive" = false
        ORDER BY p."createdAt" DESC
        LIMIT 3
      `);
      
      console.log('📦 Sample inactive products:');
      inactiveProductsResult.rows.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ${product.price} AZN (Category: ${product.category_name || 'No category'}) [Active: ${product.isActive}]`);
      });
    }

    if (productCount === 0) {
      console.log('\n⚠️  No products found in database');
      console.log('💡 Consider adding some products or running: npm run db-seed');
    }

    console.log('\n✅ Database check completed successfully!');

  } catch (error) {
    console.error('❌ Direct database check failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 Solution: Database tables do not exist. Run migrations:');
      console.log('   npx prisma migrate deploy');
    } else if (error.message.includes('connection')) {
      console.log('\n💡 Solution: Check database connection string');
    }
  } finally {
    await client.end();
  }
}

// Run the check
directDatabaseCheck(); 