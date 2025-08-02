const { Client } = require('pg');

async function checkDatabaseSchema() {
  console.log('🔍 Verilənlər bazası sxemini yoxlayıram...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Verilənlər bazasına qoşuldu!');
    
    // users cədvəlinin sxemini yoxla
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Users cədvəlinin sütunları:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // users cədvəlində neçə qeyd var
    const countResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Users cədvəlində ${countResult.rows[0].count} qeyd var`);
    
    // Bir neçə nümunə qeyd göstər
    const sampleResult = await client.query('SELECT * FROM users LIMIT 3');
    console.log('👥 Nümunə qeydlər:');
    sampleResult.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${JSON.stringify(user, null, 2)}`);
    });
    
  } catch (error) {
    console.error('❌ Xəta:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabaseSchema(); 