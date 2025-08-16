import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  let client: Client | null = null;
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      inn,
      country,
      city,
      address,
    } = body || {};

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email və şifrə tələb olunur' }, { status: 200 });
    }

    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    await client.connect();

    // Ensure required columns/tables exist (best-effort)
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "firstName" TEXT'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastName" TEXT'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN DEFAULT false'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS inn TEXT'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT'); } catch {}
    try { await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT'); } catch {}
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS email_verification_codes (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        attempts INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    } catch {}

    // Check if exists
    const exist = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exist.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'Bu email ünvanı artıq istifadə olunub' }, { status: 200 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = `user_${Date.now()}`;
    await client.query(
      `INSERT INTO users (id, email, password, "firstName", "lastName", phone, role, "isApproved", "isActive", inn, country, city, address, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,'CUSTOMER',false,true,$7,$8,$9,$10,false,NOW(),NOW())`,
      [id, email, hashedPassword, firstName || null, lastName || null, phone || null, inn || null, country || null, city || null, address || null]
    );

    // Create verification code and send email
    const rawCode = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(rawCode, 10);
    const codeId = `code_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await client.query(
      'INSERT INTO email_verification_codes (id, email, code_hash, expires_at) VALUES ($1,$2,$3,$4)',
      [codeId, email, codeHash, expiresAt]
    );

    let debugCode: string | undefined = rawCode; // always return for UX while SMTP is tuned
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || '465'),
          secure: (process.env.SMTP_PORT || '465') === '465',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: 'Код подтверждения регистрации',
          text: `Ваш код подтверждения: ${rawCode}. Срок действия 10 минут.`,
        });
      } else {
        console.warn('SMTP env vars missing; skipping email send');
        // keep debugCode
      }
    } catch (mailError) {
      console.error('SendMail error on register:', mailError);
      // keep debugCode
    }

    return NextResponse.json({
      success: true,
      message: 'Qeydiyyat uğurla tamamlandı. Email-ə gələn kodla təsdiqləyin və daxil olun.',
      requiresVerification: true,
      debugCode,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ success: false, error: 'Qeydiyyat zamanı xəta baş verdi', details: (error && (error.message || error.code || String(error))) }, { status: 500 });
  } finally {
    if (client) await client.end();
  }
} 