const { Client } = require('pg');

async function finalReset() {
  try {
    console.log('🔧 Final reset başladılır...');
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    await client.connect();

    try {
      // Drop and recreate schema
      await client.query('DROP SCHEMA IF EXISTS public CASCADE');
      await client.query('CREATE SCHEMA public');
      await client.query('GRANT ALL ON SCHEMA public TO postgres');
      await client.query('GRANT ALL ON SCHEMA public TO public');
      
      console.log('✅ Schema sıfırlandı');
      
      // Create users table with minimal fields
      await client.query(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          "firstName" TEXT,
          "lastName" TEXT,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'CUSTOMER',
          "isApproved" BOOLEAN NOT NULL DEFAULT false,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "discountPercentage" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      console.log('✅ Users cədvəli yaradıldı');
      
      // Create admin user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await client.query(`
        INSERT INTO users (id, email, password, "firstName", "lastName", role, "isApproved", "isActive")
        VALUES (gen_random_uuid(), 'admin@sado-parts.ru', $1, 'Admin', 'User', 'ADMIN', true, true)
      `, [hashedPassword]);
      
      console.log('✅ Admin istifadəçisi yaradıldı');
      console.log('Admin məlumatları:');
      console.log('Email: admin@sado-parts.ru');
      console.log('Şifrə: admin123');
      
    } catch (error) {
      console.error('❌ Xəta baş verdi:', error);
    } finally {
      await client.end();
    }
    
  } catch (error) {
    console.error('❌ Connection xətası:', error);
  }
}

finalReset(); 