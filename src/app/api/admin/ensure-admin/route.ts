import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export async function POST(_request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();

    // Make sure columns we rely on exist
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "firstName" TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastName" TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "discountPercentage" INT DEFAULT 0');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false');

    const email = 'admin@sado-parts.ru';
    const password = 'admin123';
    const hashed = await bcrypt.hash(password, 12);

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE users SET password = $1, role = 'ADMIN', "isApproved" = true, "isActive" = true,
         "firstName" = COALESCE("firstName", 'Admin'), "lastName" = COALESCE("lastName", 'User'),
         "discountPercentage" = COALESCE("discountPercentage", 0), "emailVerified" = true, "updatedAt" = NOW()
         WHERE email = $2`
      , [hashed, email]);
    } else {
      await client.query(
        `INSERT INTO users (id, email, password, name, role, "isApproved", "isActive", "firstName", "lastName", "discountPercentage", "emailVerified", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, 'ADMIN', true, true, 'Admin', 'User', 0, true, NOW(), NOW())`
      , [email, hashed, 'Admin User']);
    }

    return NextResponse.json({ success: true, message: 'Admin ensured with default credentials', email, password });
  } catch (error: any) {
    console.error('ensure-admin error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  } finally {
    await client.end();
  }
}


