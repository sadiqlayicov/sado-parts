const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('🔧 SQLite admin yaratma başladılır...');
    
    const prisma = new PrismaClient();

    try {
      // Check if admin exists
      const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (existingAdmin) {
        console.log('✅ Admin artıq mövcuddur:');
        console.log('Email:', existingAdmin.email);
        console.log('Ad:', existingAdmin.firstName, existingAdmin.lastName);
        console.log('Rol:', existingAdmin.role);
        await prisma.$disconnect();
        return;
      }

      console.log('🔧 Admin istifadəçisi yaradılır...');

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
          isActive: true
        }
      });

      console.log('✅ Admin uğurla yaradıldı!');
      console.log('Admin məlumatları:');
      console.log('ID:', adminUser.id);
      console.log('Email:', adminUser.email);
      console.log('Ad:', adminUser.firstName, adminUser.lastName);
      console.log('Rol:', adminUser.role);
      console.log('Təsdiqlənib:', adminUser.isApproved);
      console.log('Aktiv:', adminUser.isActive);

      await prisma.$disconnect();

    } catch (error) {
      console.error('❌ Xəta baş verdi:', error);
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('❌ Prisma xətası:', error);
  }
}

createAdmin(); 