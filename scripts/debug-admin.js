const { Client } = require('pg');

async function debugAdmin() {
  try {
    console.log('🔍 Admin debug başladılır...');
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    await client.connect();

    try {
      // Check if users table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      console.log('📋 Users cədvəli mövcuddur:', tableCheck.rows[0].exists);

      if (!tableCheck.rows[0].exists) {
        console.log('❌ Users cədvəli mövcud deyil!');
        return;
      }

      // Check table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Users cədvəlinin strukturu:');
      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });

      // Check if admin exists
      const adminCheck = await client.query(
        'SELECT id, email, "firstName", "lastName", role, "isApproved", "isActive", "createdAt" FROM users WHERE email = $1',
        ['admin@sado-parts.ru']
      );

      if (adminCheck.rows.length > 0) {
        const admin = adminCheck.rows[0];
        console.log('\n✅ Admin tapıldı:');
        console.log('ID:', admin.id);
        console.log('Email:', admin.email);
        console.log('Ad:', admin.firstName, admin.lastName);
        console.log('Rol:', admin.role);
        console.log('Təsdiqlənib:', admin.isApproved);
        console.log('Aktiv:', admin.isActive);
        console.log('Yaradılma tarixi:', admin.createdAt);
      } else {
        console.log('\n❌ Admin tapılmadı');
      }

      // Check all users
      const allUsers = await client.query('SELECT email, role, "isApproved", "isActive" FROM users');
      console.log('\n📋 Bütün istifadəçilər:');
      allUsers.rows.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Təsdiqlənib: ${user.isApproved}, Aktiv: ${user.isActive}`);
      });

      // Test password hash
      if (adminCheck.rows.length > 0) {
        const bcrypt = require('bcryptjs');
        const testPassword = 'admin123';
        const storedHash = adminCheck.rows[0].password;
        
        console.log('\n🔐 Şifrə testi:');
        console.log('Test şifrəsi:', testPassword);
        console.log('Hash mövcuddur:', !!storedHash);
        
        if (storedHash) {
          const isValid = await bcrypt.compare(testPassword, storedHash);
          console.log('Şifrə düzgündür:', isValid);
        }
      }

    } catch (error) {
      console.error('❌ Xəta baş verdi:', error);
    } finally {
      await client.end();
    }
    
  } catch (error) {
    console.error('❌ Connection xətası:', error);
  }
}

debugAdmin(); 