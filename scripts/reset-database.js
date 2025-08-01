const { PrismaClient } = require('@prisma/client');

async function resetDatabase() {
  try {
    console.log('🔧 Verilənlər bazası sıfırlanır...');
    
    const prisma = new PrismaClient();
    
    // Drop all tables
    await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
    await prisma.$executeRaw`CREATE SCHEMA public`;
    await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO postgres`;
    await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO public`;
    
    console.log('✅ Verilənlər bazası sıfırlandı');
    
    await prisma.$disconnect();
    
    console.log('🔄 Prisma migrate işə salınır...');
    console.log('npx prisma migrate dev --name init');
    
  } catch (error) {
    console.error('❌ Xəta baş verdi:', error);
  }
}

resetDatabase(); 