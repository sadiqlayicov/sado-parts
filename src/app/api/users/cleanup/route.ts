import { NextRequest, NextResponse } from 'next/server';
import { prisma, resetPrismaClient } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting user cleanup via API...');

    // Get all users
    let allUsers;
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

    console.log(`📊 Found ${allUsers.length} users in database`);

    // Find admin user
    const adminUser = allUsers.find(user => 
      user.role === 'ADMIN' && 
      (user.email === 'admin@sado-parts.ru' || user.email.includes('admin'))
    );

    if (!adminUser) {
      console.log('❌ No admin user found! Creating one...');
      
      // Create admin user if not exists
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
    let remainingUsers;
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

    console.log(`📋 Final user count: ${remainingUsers.length}`);

    return NextResponse.json({
      success: true,
      message: 'User cleanup completed successfully',
      deletedCount: usersToDelete.length,
      remainingUsers: remainingUsers.length,
      users: remainingUsers
    });

  } catch (error) {
    console.error('❌ Error during user cleanup:', error);
    return NextResponse.json(
      { error: 'User cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 