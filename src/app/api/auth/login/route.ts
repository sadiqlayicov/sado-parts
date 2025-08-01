import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email və şifrə tələb olunur' },
        { status: 400 }
      )
    }

    // PostgreSQL client istifadə et
    const { Client } = await import('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    await client.connect()

    try {
      const result = await client.query(
        'SELECT id, email, password, "firstName", "lastName", role, "isApproved", "isActive" FROM users WHERE email = $1',
        [email]
      )

      await client.end()

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Yanlış email və ya şifrə' },
          { status: 401 }
        )
      }

      const user = result.rows[0]

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Yanlış email və ya şifrə' },
          { status: 401 }
        )
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Hesab deaktivdir' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isApproved: user.isApproved,
          discountPercentage: 0
        }
      })

    } catch (dbError) {
      await client.end()
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Verilənlər bazası xətası' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Daxil olma xətası' },
      { status: 500 }
    )
  }
} 