const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Admin istifadəçisi yaradılır...');

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

createAdmin(); 