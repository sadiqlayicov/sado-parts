const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  console.log('🔍 Database-dəki istifadəçilər yoxlanılır...');
  
  const client = new Client({
    connectionString: 'postgresql://postgres.aws-0-eu-north-1:OPPE7kyd8WKwuMhn@aws-0-eu-north-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Database-ə qoşuldu');

    // Bütün istifadəçiləri yoxla
    const usersResult = await client.query(`
      SELECT id, email, name, "isAdmin", "isApproved", "createdAt", "updatedAt"
      FROM users 
      ORDER BY "createdAt" DESC
    `);

    console.log(`📊 Ümumi istifadəçi sayı: ${usersResult.rows.length}`);
    console.log('👥 İstifadəçilər:');
    
    usersResult.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. İstifadəçi:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'Yox'}`);
      console.log(`   IsAdmin: ${user.isAdmin}`);
      console.log(`   IsApproved: ${user.isApproved}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Updated: ${user.updatedAt}`);
    });

    // Admin istifadəçisini xüsusi yoxla
    const adminResult = await client.query(`
      SELECT id, email, password, name, "isAdmin", "isApproved"
      FROM users 
      WHERE email = 'admin@sado-parts.ru'
    `);

    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log('\n🔍 Admin istifadəçisi tapıldı:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   IsAdmin: ${admin.isAdmin}`);
      console.log(`   IsApproved: ${admin.isApproved}`);
      console.log(`   Password hash: ${admin.password ? admin.password.substring(0, 20) + '...' : 'Yox'}`);
      
      // Şifrəni test et
      if (admin.password) {
        const isPasswordValid = await bcrypt.compare('admin123', admin.password);
        console.log(`   Şifrə 'admin123' düzgün: ${isPasswordValid}`);
      }
    } else {
      console.log('\n❌ Admin istifadəçisi tapılmadı!');
    }

    // Users cədvəlinin strukturunu yoxla
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Users cədvəlinin strukturu:');
    tableInfo.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers(); 