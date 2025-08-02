const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function fixDatabase() {
  console.log('🔧 Database problemi həll edilir...');
  
  const client = new Client({
    connectionString: 'postgresql://postgres.aws-0-eu-north-1:OPPE7kyd8WKwuMhn@aws-0-eu-north-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Database-ə qoşuldu');

    // 1. Users cədvəlinə name sütunu əlavə et
    console.log('📝 Users cədvəli düzəldilir...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;
      UPDATE users SET name = 'User ' || id WHERE name IS NULL;
    `);

    // 2. Admin istifadəçisini yarad
    console.log('👤 Admin istifadəçisi yaradılır...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Admin-i yarad və ya yenilə
    await client.query(`
      INSERT INTO users (id, email, password, name, "isAdmin", "isApproved", "createdAt", "updatedAt")
      SELECT 
          'admin-' || EXTRACT(EPOCH FROM NOW())::text,
          'admin@sado-parts.ru',
          $1,
          'Admin User',
          true,
          true,
          NOW(),
          NOW()
      WHERE NOT EXISTS (
          SELECT 1 FROM users WHERE email = 'admin@sado-parts.ru'
      );
    `, [hashedPassword]);

    // Əgər admin artıq varsa, şifrəsini yenilə
    await client.query(`
      UPDATE users 
      SET name = 'Admin User',
          "isAdmin" = true,
          "isApproved" = true,
          password = $1
      WHERE email = 'admin@sado-parts.ru';
    `, [hashedPassword]);

    // 3. Mövcud istifadəçiləri yoxla
    const usersResult = await client.query('SELECT id, email, name, "isAdmin", "isApproved" FROM users');
    console.log('👥 Mövcud istifadəçilər:');
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - Admin: ${user.isAdmin} - Approved: ${user.isApproved}`);
    });

    // 4. Test admin login
    const adminUser = await client.query(
      'SELECT id, email, password, name, "isAdmin", "isApproved" FROM users WHERE email = $1',
      ['admin@sado-parts.ru']
    );

    if (adminUser.rows.length > 0) {
      const admin = adminUser.rows[0];
      const isPasswordValid = await bcrypt.compare('admin123', admin.password);
      
      console.log('✅ Admin məlumatları:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   IsAdmin: ${admin.isAdmin}`);
      console.log(`   IsApproved: ${admin.isApproved}`);
      console.log(`   Şifrə düzgün: ${isPasswordValid}`);
      console.log('   Şifrə: admin123');
      console.log('   Admin paneli: https://sado-parts.vercel.app/login');
    } else {
      console.log('❌ Admin istifadəçisi tapılmadı!');
    }

    // 5. Database connection test
    const testResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Ümumi istifadəçi sayı: ${testResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  } finally {
    await client.end();
  }
}

fixDatabase(); 