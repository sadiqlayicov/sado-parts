const { Client } = require('pg');

async function addUserFields() {
  console.log('🔧 Users cədvəlinə əskik sütunları əlavə edirəm...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Verilənlər bazasına qoşuldu!');
    
    // Əlavə ediləcək sütunlar
    const fields = [
      { name: 'inn', type: 'VARCHAR(255)' },
      { name: 'address', type: 'TEXT' },
      { name: 'country', type: 'VARCHAR(255)' },
      { name: 'city', type: 'VARCHAR(255)' },
      { name: 'discountPercentage', type: 'INTEGER DEFAULT 0' }
    ];
    
    for (const field of fields) {
      // Sütunun mövcud olub-olmadığını yoxla
      const checkColumn = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = $1
      `, [field.name]);
      
      if (checkColumn.rows.length > 0) {
        console.log(`✅ ${field.name} sütunu artıq mövcuddur!`);
      } else {
        // Sütunu əlavə et
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN "${field.name}" ${field.type}
        `);
        console.log(`✅ ${field.name} sütunu əlavə edildi!`);
      }
    }
    
    // Bütün sütunları yoxla
    const columns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users cədvəlinin bütün sütunları:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'NULL'})`);
    });
    
  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  } finally {
    await client.end();
  }
}

addUserFields(); 