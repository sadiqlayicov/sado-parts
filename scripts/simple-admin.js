const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createSimpleAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('🔧 Database-ə bağlandı...');

    // Check if admin exists
    const checkResult = await client.query(
      'SELECT email, name FROM users WHERE email = $1',
      ['admin@sado-parts.ru']
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Admin artıq mövcuddur:');
      console.log(`Email: ${checkResult.rows[0].email}`);
      console.log(`Ad: ${checkResult.rows[0].name}`);
      console.log('Şifrə: admin123');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const result = await client.query(
      `INSERT INTO users (id, email, password, name, "isAdmin", "isApproved", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING email, name`,
      [
        'admin-' + Date.now(),
        'admin@sado-parts.ru',
        hashedPassword,
        'Admin User',
        true,
        true
      ]
    );

    console.log('✅ Admin istifadəçisi uğurla yaradıldı!');
    console.log('Admin məlumatları:');
    console.log(`Email: ${result.rows[0].email}`);
    console.log(`Ad: ${result.rows[0].name}`);
    console.log('Şifrə: admin123');

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  } finally {
    await client.end();
  }
}

createSimpleAdmin(); 