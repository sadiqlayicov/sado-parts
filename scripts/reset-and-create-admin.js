const bcrypt = require('bcryptjs');

async function createAdminWithNewClient() {
  try {
    console.log('🔧 Prisma client yenidən başladılır...');
    
    // Disconnect existing client
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('✅ Yeni Prisma client yaradıldı');

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
      await prisma.$disconnect();
      return;
    }

    console.log('🔧 Admin istifadəçisi yaradılır...');

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user with minimal data first
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

    console.log('✅ Admin istifadəçisi uğurla yaradıldı!');
    console.log('Admin məlumatları:');
    console.log(`Email: ${adminUser.email}`);
    console.log('Şifrə: admin123');
    console.log(`Ad: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`Rol: ${adminUser.role}`);

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error);
    
    // Try alternative approach
    try {
      console.log('🔄 Alternativ yanaşma sınanılır...');
      
      const { PrismaClient } = require('@prisma/client');
      const prisma2 = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });

      // Try to create admin with raw SQL
      await prisma2.$executeRaw`INSERT INTO users (id, email, password, "firstName", "lastName", role, "isApproved", "isActive", "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), 'admin@sado-parts.ru', ${await bcrypt.hash('admin123', 12)}, 'Admin', 'User', 'ADMIN', true, true, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING`;

      console.log('✅ Admin istifadəçisi raw SQL ilə yaradıldı!');
      console.log('Admin məlumatları:');
      console.log('Email: admin@sado-parts.ru');
      console.log('Şifrə: admin123');

      await prisma2.$disconnect();
    } catch (error2) {
      console.error('❌ Alternativ yanaşma da uğursuz oldu:', error2);
    }
  }
}

createAdminWithNewClient(); 