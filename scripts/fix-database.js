const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDatabase() {
  try {
    console.log('🔧 Verilənlər bazası düzəldilir...');

    // Add missing columns to users table
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(255)`;
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(255)`;
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS inn VARCHAR(255)`;
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`;

    // Update existing records to have default values
    await prisma.$executeRaw`UPDATE users SET country = '' WHERE country IS NULL`;
    await prisma.$executeRaw`UPDATE users SET city = '' WHERE city IS NULL`;
    await prisma.$executeRaw`UPDATE users SET address = '' WHERE address IS NULL`;

    console.log('✅ Verilənlər bazası uğurla düzəldildi!');

    // Now create admin user
    const bcrypt = require('bcryptjs');
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (existingAdmin) {
      console.log(`✅ Admin artıq mövcuddur: ${existingAdmin.email}`);
      console.log('Admin məlumatları:');
      console.log(`Email: ${existingAdmin.email}`);
      console.log('Şifrə: admin123 (əgər yeni yaradılıbsa)');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@sado-parts.ru',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isApproved: true,
        isActive: true,
        country: '',
        city: '',
        address: '',
        phone: '',
        inn: ''
      }
    });

    console.log('✅ Admin istifadəçisi uğurla yaradıldı!');
    console.log('Admin məlumatları:');
    console.log(`Email: ${adminUser.email}`);
    console.log('Şifrə: admin123');
    console.log(`Ad: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`Rol: ${adminUser.role}`);

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase(); 