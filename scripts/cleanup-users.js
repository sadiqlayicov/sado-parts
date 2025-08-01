const { PrismaClient } = require('@prisma/client');

let prisma = new PrismaClient();

// Function to reset Prisma client
async function resetPrismaClient() {
  await prisma.$disconnect();
  prisma = new PrismaClient();
}

async function cleanupUsers() {
  try {
    console.log('🧹 Starting user cleanup...');

    // Get all users with retry logic
    let allUsers = [];
    try {
      allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });
    } catch (error) {
      console.log('⚠️  First attempt failed, retrying with reset Prisma client...');
      await resetPrismaClient();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });
    }

    console.log(`📊 Found ${allUsers.length} users in database:`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
    });

    // Find admin user
    const adminUser = allUsers.find(user => 
      user.role === 'ADMIN' && 
      (user.email === 'admin@sado-parts.ru' || user.email.includes('admin'))
    );

    if (!adminUser) {
      console.log('❌ No admin user found! Creating one...');
      
      // Create admin user if not exists
      const { hashPassword } = require('../src/lib/auth');
      const adminPassword = await hashPassword('admin123');
      
      await prisma.user.create({
        data: {
          email: 'admin@sado-parts.ru',
          password: adminPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          isApproved: true,
          isActive: true
        }
      });
      
      console.log('✅ Admin user created: admin@sado-parts.ru');
    } else {
      console.log(`✅ Admin user found: ${adminUser.email}`);
    }

    // Delete all non-admin users
    const usersToDelete = allUsers.filter(user => user.role !== 'ADMIN');
    
    if (usersToDelete.length > 0) {
      console.log(`🗑️  Deleting ${usersToDelete.length} non-admin users...`);
      
      for (const user of usersToDelete) {
        try {
          console.log(`  - Deleting: ${user.email}`);
          await prisma.user.delete({
            where: { id: user.id }
          });
        } catch (deleteError) {
          console.log(`⚠️  Failed to delete ${user.email}, retrying...`);
          await resetPrismaClient();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await prisma.user.delete({
            where: { id: user.id }
          });
          console.log(`✅ Successfully deleted: ${user.email}`);
        }
      }
      
      console.log('✅ All non-admin users deleted successfully!');
    } else {
      console.log('ℹ️  No non-admin users to delete.');
    }

    // Verify final state
    let remainingUsers = [];
    try {
      remainingUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });
    } catch (error) {
      console.log('⚠️  Failed to get remaining users, retrying...');
      await resetPrismaClient();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      remainingUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });
    }

    console.log(`\n📋 Final user count: ${remainingUsers.length}`);
    remainingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
    });

    console.log('\n✅ User cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during user cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUsers(); 