import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    // Ensure emailVerified column exists
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false');
    // Ensure codes table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verification_codes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        attempts INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email və şifrə tələb olunur' },
        { status: 400 }
      );
    }

    // Find user with actual database schema
    const result = await client.query(
      `SELECT id, email, password, "firstName", "lastName", role, "isApproved", "isActive", "discountPercentage", "emailVerified"
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

    // Check if user is active (if isActive column exists)
    if (user.isActive === false) {
      return NextResponse.json(
        { error: 'Hesabınız bloklanıb' },
        { status: 401 }
      );
    }

    // Require email verification on first login
    if (!user.emailVerified) {
      const rawCode = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = await bcrypt.hash(rawCode, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await client.query(
        `INSERT INTO email_verification_codes (email, code_hash, expires_at) VALUES ($1, $2, $3)`,
        [email, codeHash, expiresAt]
      );

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || '465'),
        secure: (process.env.SMTP_PORT || '465') === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Код подтверждения входа',
        text: `Ваш код подтверждения: ${rawCode}. Срок действия 10 минут.`,
      });

      return NextResponse.json({
        error: 'Email не подтвержден. Мы отправили код подтверждения на вашу почту.',
        requiresVerification: true
      }, { status: 403 });
    }

    // Return user data (without password) and convert role to isAdmin
    const { password: passwordField, ...userWithoutPassword } = user;
    const isAdmin = user.role === 'ADMIN';
    
    return NextResponse.json({
      success: true,
      message: user.isApproved ? 'Uğurla daxil oldunuz' : 'Daxil oldunuz, amma hesabınız hələ admin tərəfindən təsdiqlənməyib',
      user: {
        ...userWithoutPassword,
        isAdmin,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        discountPercentage: user.discountPercentage || 0
      },
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