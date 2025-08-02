const { Client } = require('pg');

async function testVercelEnv() {
  console.log('🔍 Vercel environment variables yoxlanılır...');
  
  // Müxtəlif connection string-ləri test et
  const connectionStrings = [
    'postgresql://postgres.aws-0-eu-north-1:OPPE7kyd8WKwuMhn@aws-0-eu-north-1.pooler.supabase.com:5432/postgres',
    'postgresql://postgres.aws-0-eu-north-1:OPPE7kyd8WKwuMhn@aws-0-eu-north-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres.aws-0-eu-north-1:OPPE7kyd8WKwuMhn@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?pgbouncer=true',
    'postgresql://postgres.aws-0-eu-north-1:OPPE7kyd8WKwuMhn@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
  ];

  for (let i = 0; i < connectionStrings.length; i++) {
    const connStr = connectionStrings[i];
    console.log(`\n🔗 Test ${i + 1}: ${connStr.substring(0, 50)}...`);
    
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('✅ Qoşulma uğurlu!');
      
      // Test query
      const result = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`📊 İstifadəçi sayı: ${result.rows[0].count}`);
      
      // Admin istifadəçisini yoxla
      const adminResult = await client.query(`
        SELECT id, email, name, "isAdmin", "isApproved"
        FROM users 
        WHERE email = 'admin@sado-parts.ru'
      `);
      
      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];
        console.log('✅ Admin istifadəçisi tapıldı:');
        console.log(`   Email: ${admin.email}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   IsAdmin: ${admin.isAdmin}`);
        console.log(`   IsApproved: ${admin.isApproved}`);
      } else {
        console.log('❌ Admin istifadəçisi tapılmadı');
      }
      
      await client.end();
      break; // Uğurlu connection tapıldı, döngüdən çıx
      
    } catch (error) {
      console.log(`❌ Xəta: ${error.message}`);
      await client.end();
    }
  }
}

testVercelEnv(); 