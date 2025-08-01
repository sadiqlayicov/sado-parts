import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Sadə admin yaratma başladılır...')

    // PostgreSQL connection string
    const { Client } = await import('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    await client.connect()

    try {
      // Check if admin exists
      const checkResult = await client.query(
        'SELECT id, email, "firstName", "lastName", role FROM "User" WHERE role = $1 LIMIT 1',
        ['ADMIN']
      )

      if (checkResult.rows.length > 0) {
        const admin = checkResult.rows[0]
        await client.end()
        return NextResponse.json({
          success: true,
          message: 'Admin artıq mövcuddur',
          admin: {
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role
          }
        })
      }

      console.log('🔧 Admin istifadəçisi yaradılır...')

      // Hash password
      const hashedPassword = await bcrypt.hash('admin123', 12)

      // Create admin user
      const insertResult = await client.query(
        `INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "isApproved", "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id, email, "firstName", "lastName", role`,
        ['admin@sado-parts.ru', hashedPassword, 'Admin', 'User', 'ADMIN', true, true]
      )

      await client.end()

      const adminUser = insertResult.rows[0]
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
      await client.end()
      
      return NextResponse.json(
        { error: 'Admin yaratma xətası', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Setup xətası', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 