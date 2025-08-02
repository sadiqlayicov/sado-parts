import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Client } from 'pg'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Admin setup başladılır...')

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    try {
      await client.connect()
      console.log('✅ Database-ə qoşuldu')

      // Check if admin already exists
      const existingAdmin = await client.query(
        'SELECT id, email FROM users WHERE email = $1',
        ['admin@sado-parts.ru']
      )

      if (existingAdmin.rows.length > 0) {
        console.log('🔄 Admin artıq mövcuddur, şifrə yenilənir...')
        
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 12)
        
        // Update admin password and role
        await client.query(`
          UPDATE users 
          SET password = $1, role = 'ADMIN', "isApproved" = true, "isActive" = true
          WHERE email = $2
        `, [hashedPassword, 'admin@sado-parts.ru'])
        
        await client.end()
        
        return NextResponse.json({
          success: true,
          message: 'Admin şifrəsi yeniləndi',
          admin: {
            email: existingAdmin.rows[0].email
          }
        })
      }

      console.log('🔧 Admin istifadəçisi yaradılır...')

      // Hash password
      const hashedPassword = await bcrypt.hash('admin123', 12)

      // Create admin user with actual database schema
      const result = await client.query(`
        INSERT INTO users (id, email, password, "firstName", "lastName", role, "isApproved", "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, email
      `, ['admin@sado-parts.ru', hashedPassword, 'Admin', 'User', 'ADMIN', true, true])

      await client.end()

      console.log('✅ Admin uğurla yaradıldı!')

      return NextResponse.json({
        success: true,
        message: 'Admin istifadəçisi uğurla yaradıldı',
        admin: {
          email: result.rows[0].email,
          id: result.rows[0].id
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