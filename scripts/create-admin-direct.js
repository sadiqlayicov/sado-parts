const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  console.log('🔧 Admin istifadəçisi yaradılır...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.aws-0-eu-north-1:OPPE7kyd8WKwuMhn@aws-0-eu-north-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Database-ə qoşuldu');

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('✅ Şifrə hash edildi');

    // Check if admin exists
    const existingUser = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['admin@sado-parts.ru']
    );

    if (existingUser.rows.length > 0) {
      console.log('🔄 Admin artıq mövcuddur, şifrə yenilənir...');
      
      // Update existing admin
      await client.query(
        `UPDATE users 
         SET password = $1, name = $2, "isAdmin" = $3, "isApproved" = $4, "updatedAt" = NOW()
         WHERE email = $5`,
        [hashedPassword, 'Admin User', true, true, 'admin@sado-parts.ru']
      );
      
      console.log('✅ Admin şifrəsi yeniləndi!');
    } else {
      console.log('📝 Yeni admin yaradılır...');
      
      // Create new admin
      await client.query(
        `INSERT INTO users (id, email, password, name, "isAdmin", "isApproved", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          'admin-' + Date.now(),
          'admin@sado-parts.ru',
          hashedPassword,
          'Admin User',
          true,
          true
        ]
      );
      
      console.log('✅ Admin uğurla yaradıldı!');
    }

    // Verify admin exists
    const adminUser = await client.query(
      'SELECT id, email, name, "isAdmin", "isApproved" FROM users WHERE email = $1',
      ['admin@sado-parts.ru']
    );

    if (adminUser.rows.length > 0) {
      const admin = adminUser.rows[0];
      console.log('✅ Admin məlumatları:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   IsAdmin: ${admin.isAdmin}`);
      console.log(`   IsApproved: ${admin.isApproved}`);
      console.log('   Şifrə: admin123');
      console.log('   Admin paneli: https://sado-parts.vercel.app/login');
    }

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  } finally {
    await client.end();
  }
}

createAdmin(); 