const { PrismaClient } = require('@prisma/client');

async function setupVercelDatabase() {
  console.log('🚀 Setting up database for Vercel deployment...');
  
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

    // Check data counts using Prisma methods instead of raw queries
    console.log('📋 Checking database data...');
    
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    const userCount = await prisma.user.count();

    console.log('📈 Data statistics:');
    console.log(`   Products: ${productCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Users: ${userCount}`);

    // Check for active products
    const activeProducts = await prisma.product.count({
      where: { isActive: true }
    });

    console.log(`✅ Active products: ${activeProducts}`);

    // Check for active categories
    const activeCategories = await prisma.category.count({
      where: { isActive: true }
    });

    console.log(`✅ Active categories: ${activeCategories}`);

    // If no data, suggest seeding
    if (productCount === 0 || categoryCount === 0) {
      console.log('\n⚠️  No data found in database');
      console.log('💡 Consider running: npm run db-seed');
    }

    // Test a sample query
    console.log('\n🧪 Testing sample queries...');
    
    const sampleProducts = await prisma.product.findMany({
      where: { isActive: true },
      take: 3,
      include: { category: true }
    });

    console.log('📦 Sample products:');
    sampleProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ${product.price} AZN (Category: ${product.category?.name || 'No category'})`);
    });

    // Test categories
    const sampleCategories = await prisma.category.findMany({
      where: { isActive: true },
      take: 3
    });

    console.log('📂 Sample categories:');
    sampleCategories.forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.name} (Active: ${category.isActive})`);
    });

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n🎯 Ready for Vercel deployment!');

  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Solution: Make sure DATABASE_URL environment variable is set correctly in Vercel');
    } else if (error.message.includes('connection')) {
      console.log('\n💡 Solution: Check your database connection string and network access');
    } else if (error.message.includes('schema')) {
      console.log('\n💡 Solution: Run database migrations: npx prisma migrate deploy');
    } else if (error.message.includes('relation') || error.message.includes('table')) {
      console.log('\n💡 Solution: Run database push: npx prisma db push');
    } else if (error.message.includes('prepared statement')) {
      console.log('\n💡 Solution: This is a known PostgreSQL issue. The database is working, but there are connection pooling issues.');
      console.log('💡 This will be resolved in production with the updated Prisma configuration.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupVercelDatabase(); 