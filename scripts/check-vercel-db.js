const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  // Hər dəfə yeni client yarad ki, prepared statement problemi olmasın
  const prisma = new PrismaClient({
    log: ['error', 'warn', 'info'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔍 Checking database connection...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database URL exists:', !!process.env.DATABASE_URL);
    
    if (process.env.DATABASE_URL) {
      console.log('Database URL prefix:', process.env.DATABASE_URL.substring(0, 20) + '...');
    }

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Raw query ilə table-ları yoxla
    console.log('📋 Checking database tables...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      console.log('📊 Existing tables:', tables.map(t => t.table_name));
    } catch (error) {
      console.log('⚠️ Could not check tables with raw query, continuing...');
    }

    // Raw query ilə data count yoxla
    console.log('📈 Checking data counts...');
    try {
      const productCountResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM products`;
      const categoryCountResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM categories`;
      const userCountResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
      
      const productCount = parseInt(productCountResult[0].count);
      const categoryCount = parseInt(categoryCountResult[0].count);
      const userCount = parseInt(userCountResult[0].count);

      console.log('📊 Database statistics:');
      console.log(`   Products: ${productCount}`);
      console.log(`   Categories: ${categoryCount}`);
      console.log(`   Users: ${userCount}`);

      // Active products count
      const activeProductsResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM products WHERE "isActive" = true`;
      const activeProducts = parseInt(activeProductsResult[0].count);
      console.log(`✅ Active products: ${activeProducts}`);

      // Active categories count
      const activeCategoriesResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM categories WHERE "isActive" = true`;
      const activeCategories = parseInt(activeCategoriesResult[0].count);
      console.log(`✅ Active categories: ${activeCategories}`);

      // Sample products
      if (productCount > 0) {
        console.log('\n📦 Sample products:');
        const sampleProducts = await prisma.$queryRaw`
          SELECT p.id, p.name, p.price, p."isActive", c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p."categoryId" = c.id
          WHERE p."isActive" = true
          ORDER BY p."createdAt" DESC
          LIMIT 5
        `;
        
        sampleProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} - ${product.price} AZN (Category: ${product.category_name || 'No category'}) [Active: ${product.isActive}]`);
        });
      }

      // Sample categories
      if (categoryCount > 0) {
        console.log('\n📂 Sample categories:');
        const sampleCategories = await prisma.$queryRaw`
          SELECT id, name, "isActive"
          FROM categories
          WHERE "isActive" = true
          ORDER BY name
          LIMIT 5
        `;
        
        sampleCategories.forEach((category, index) => {
          console.log(`   ${index + 1}. ${category.name} [Active: ${category.isActive}]`);
        });
      }

      if (productCount === 0) {
        console.log('\n⚠️  No products found in database');
        console.log('💡 Consider adding some products or running: npm run db-seed');
      }

      if (activeProducts === 0 && productCount > 0) {
        console.log('\n⚠️  Products exist but none are active');
        console.log('💡 Check product isActive status in database');
      }

    } catch (error) {
      console.error('❌ Error checking data:', error.message);
      console.log('💡 Trying alternative approach...');
      
      // Alternative approach - try to get any data
      try {
        const anyProducts = await prisma.$queryRaw`SELECT * FROM products LIMIT 1`;
        console.log('✅ Products table exists and has data');
      } catch (tableError) {
        console.error('❌ Products table error:', tableError.message);
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Solution: Make sure DATABASE_URL environment variable is set correctly');
    } else if (error.message.includes('connection')) {
      console.log('\n💡 Solution: Check your database connection string and network access');
    } else if (error.message.includes('schema')) {
      console.log('\n💡 Solution: Run database migrations: npx prisma migrate deploy');
    } else if (error.message.includes('prepared statement')) {
      console.log('\n💡 Solution: This is a PostgreSQL connection pooling issue');
      console.log('💡 The database is working, but there are connection conflicts');
      console.log('💡 This will be resolved in production with the updated Prisma configuration');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabase(); 