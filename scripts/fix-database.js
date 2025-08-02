const { PrismaClient } = require('@prisma/client');

async function fixDatabase() {
  const prisma = new PrismaClient({
    log: ['error', 'warn', 'info'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔧 Fixing database issues...');
    
    // 1. Reset Prisma client
    await prisma.$disconnect();
    await prisma.$connect();
    
    console.log('✅ Database connection reset');
    
    // 2. Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('📋 Existing tables:', tables.map(t => t.table_name));
    
    // 3. Check products table structure
    const productColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `;
    
    console.log('📦 Products table columns:');
    productColumns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 4. Check if products exist
    const productCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM products`;
    console.log(`📊 Total products: ${productCount[0].count}`);
    
    const activeProducts = await prisma.$queryRaw`SELECT COUNT(*) as count FROM products WHERE "isActive" = true`;
    console.log(`✅ Active products: ${activeProducts[0].count}`);
    
    // 5. Get sample products
    const sampleProducts = await prisma.$queryRaw`
      SELECT id, name, price, "isActive", "categoryId"
      FROM products 
      WHERE "isActive" = true 
      LIMIT 5
    `;
    
    console.log('📦 Sample active products:');
    sampleProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ${product.price} AZN (ID: ${product.id})`);
    });
    
    // 6. Check categories
    const categoryCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM categories`;
    console.log(`📂 Total categories: ${categoryCount[0].count}`);
    
    const categories = await prisma.$queryRaw`
      SELECT id, name, "isActive"
      FROM categories 
      WHERE "isActive" = true
    `;
    
    console.log('📂 Active categories:');
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id})`);
    });
    
  } catch (error) {
    console.error('❌ Database fix failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('prepared statement')) {
      console.log('\n💡 This is a PostgreSQL connection issue. Trying to reset...');
      
      // Try to reset connection
      try {
        await prisma.$disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await prisma.$connect();
        console.log('✅ Connection reset successful');
      } catch (resetError) {
        console.error('❌ Connection reset failed:', resetError.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDatabase(); 