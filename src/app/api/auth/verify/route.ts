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

    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Требуется email и код' }, { status: 400 });
    }

    const codes = await client.query(
      `SELECT id, code_hash, expires_at, used_at, attempts
       FROM email_verification_codes
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (codes.rows.length === 0) {
      return NextResponse.json({ error: 'Код не найден. Запросите новый.' }, { status: 400 });
    }

    const rec = codes.rows[0];

    if (rec.used_at) {
      return NextResponse.json({ error: 'Код уже использован. Запросите новый.' }, { status: 400 });
    }

    if (new Date(rec.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Срок действия кода истек.' }, { status: 400 });
    }

    const ok = await bcrypt.compare(String(code), rec.code_hash);
    if (!ok) {
      await client.query(
        `UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id = $1`,
        [rec.id]
      );
      return NextResponse.json({ error: 'Неверный код.' }, { status: 400 });
    }

    await client.query('UPDATE email_verification_codes SET used_at = NOW() WHERE id = $1', [rec.id]);
    await client.query('UPDATE users SET "emailVerified" = true WHERE email = $1', [email]);

    return NextResponse.json({ success: true, message: 'Email подтвержден' });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Ошибка подтверждения' }, { status: 500 });
  } finally {
    await client.end();
  }
}


