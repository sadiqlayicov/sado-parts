const { Client } = require('pg');

async function addDiscountColumn() {
  console.log('🔧 Users cədvəlinə discountPercentage sütunu əlavə edirəm...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Verilənlər bazasına qoşuldu!');
    
    // Əvvəlcə sütunun mövcud olub-olmadığını yoxla
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'discountPercentage'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ discountPercentage sütunu artıq mövcuddur!');
    } else {
      // Sütunu əlavə et
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN "discountPercentage" INTEGER DEFAULT 0
      `);
      console.log('✅ discountPercentage sütunu əlavə edildi!');
    }
    
    // Sütunun mövcudluğunu yoxla
    const columns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'discountPercentage'
    `);
    
    console.log('📋 discountPercentage sütunu məlumatları:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
    });
    
  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  } finally {
    await client.end();
  }
}

addDiscountColumn(); 