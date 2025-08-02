import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';

export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email və şifrə tələb olunur' },
        { status: 400 }
      );
    }

    // Find user without name column
    const result = await client.query(
      `SELECT id, email, password, "isAdmin", "isApproved"
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 401 }
      );
    }
    
    const user = result.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Yanlış şifrə' },
        { status: 401 }
      );
    }

    // Check if user is approved
    if (!user.isApproved) {
      return NextResponse.json(
        { error: 'Hesabınız hələ təsdiqlənməyib' },
        { status: 401 }
      );
    }

    // Return user data (without password)
    const { password: passwordField, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      message: 'Uğurla daxil oldunuz',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Daxil olma xətası' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
} 