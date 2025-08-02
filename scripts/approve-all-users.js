const { Client } = require('pg');

async function approveAllUsers() {
  console.log('🔧 Bütün mövcud müştəriləri təsdiqləyirəm...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Verilənlər bazasına qoşuldu!');
    
    // Bütün müştəriləri təsdiqlə
    const result = await client.query(`
      UPDATE users 
      SET "isApproved" = true, "updatedAt" = NOW() 
      WHERE role = 'CUSTOMER' AND "isApproved" = false
    `);
    
    console.log(`✅ ${result.rowCount} müştəri təsdiqləndi!`);
    
    // Təsdiqlənmiş müştərilərin sayını yoxla
    const approvedCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'CUSTOMER' AND "isApproved" = true
    `);
    
    console.log(`📊 Cəmi ${approvedCount.rows[0].count} təsdiqlənmiş müştəri var`);
    
    // Bloklanmış müştərilərin sayını yoxla
    const blockedCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'CUSTOMER' AND "isApproved" = false
    `);
    
    console.log(`📊 Cəmi ${blockedCount.rows[0].count} bloklanmış müştəri var`);
    
  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  } finally {
    await client.end();
  }
}

approveAllUsers(); 