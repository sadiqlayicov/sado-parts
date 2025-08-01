import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Admin setup başladılır...')

    // Dynamic import to avoid prepared statement issues
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      // Check if admin already exists
      const existingAdmin = await prisma.user.findFirst({
        where: {
          role: 'ADMIN'
        }
      })

      if (existingAdmin) {
        await prisma.$disconnect()
        return NextResponse.json({
          success: true,
          message: 'Admin artıq mövcuddur',
          admin: {
            email: existingAdmin.email,
            firstName: existingAdmin.firstName,
            lastName: existingAdmin.lastName,
            role: existingAdmin.role
          }
        })
      }

      console.log('🔧 Admin istifadəçisi yaradılır...')

      // Hash password
      const hashedPassword = await bcrypt.hash('admin123', 12)

      // Create admin user with minimal required fields
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
      })

      await prisma.$disconnect()

      console.log('✅ Admin uğurla yaradıldı!')

      return NextResponse.json({
        success: true,
        message: 'Admin istifadəçisi uğurla yaradıldı',
        admin: {
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: adminUser.role
        }
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      await prisma.$disconnect()
      
      // Try alternative approach with raw SQL
      try {
        console.log('🔄 Raw SQL ilə cəhd edilir...')
        
        const prisma2 = new PrismaClient()
        const hashedPassword = await bcrypt.hash('admin123', 12)
        
        await prisma2.$executeRaw`
          INSERT INTO users (id, email, password, "firstName", "lastName", role, "isApproved", "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), 'admin@sado-parts.ru', ${hashedPassword}, 'Admin', 'User', 'ADMIN', true, true, NOW(), NOW())
          ON CONFLICT (email) DO NOTHING
        `
        
        await prisma2.$disconnect()
        
        return NextResponse.json({
          success: true,
          message: 'Admin istifadəçisi raw SQL ilə yaradıldı',
          admin: {
            email: 'admin@sado-parts.ru',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN'
          }
        })
        
      } catch (rawSqlError) {
        console.error('Raw SQL error:', rawSqlError)
        return NextResponse.json(
          { error: 'Admin yaratma xətası', details: rawSqlError instanceof Error ? rawSqlError.message : 'Unknown error' },
          { status: 500 }
        )
      }
    }

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Setup xətası', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 