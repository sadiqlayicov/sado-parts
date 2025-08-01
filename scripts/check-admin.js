const { Client } = require('pg');

async function checkAdmin() {
  try {
    console.log('🔍 Admin istifadəçisi yoxlanılır...');
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
      // Check if admin exists
      const result = await client.query(
        'SELECT id, email, "firstName", "lastName", role, "isApproved", "isActive" FROM users WHERE email = $1',
        ['admin@sado-parts.ru']
      );

      if (result.rows.length > 0) {
        const admin = result.rows[0];
        console.log('✅ Admin tapıldı:');
        console.log('ID:', admin.id);
        console.log('Email:', admin.email);
        console.log('Ad:', admin.firstName, admin.lastName);
        console.log('Rol:', admin.role);
        console.log('Təsdiqlənib:', admin.isApproved);
        console.log('Aktiv:', admin.isActive);
      } else {
        console.log('❌ Admin tapılmadı');
      }

      // Check all users
      const allUsers = await client.query('SELECT email, role, "isApproved", "isActive" FROM users');
      console.log('\n📋 Bütün istifadəçilər:');
      allUsers.rows.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Təsdiqlənib: ${user.isApproved}, Aktiv: ${user.isActive}`);
      });

    } catch (error) {
      console.error('❌ Xəta baş verdi:', error);
    } finally {
      await client.end();
    }
    
  } catch (error) {
    console.error('❌ Connection xətası:', error);
  }
}

checkAdmin(); 