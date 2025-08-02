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
    
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      inn, 
      address, 
      country, 
      city 
    } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email və şifrə tələb olunur' },
        { status: 200 }
      );
    }

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu email ünvanı artıq istifadə olunub' },
        { status: 200 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with all fields including country, city, inn, address
    const result = await client.query(`
      INSERT INTO users (id, email, password, "firstName", "lastName", phone, inn, address, country, city, role, "isApproved", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id, email, "firstName", "lastName", phone, inn, address, country, city, "isApproved"
    `, [
      email, 
      hashedPassword, 
      firstName || 'User', 
      lastName || 'User', 
      phone || null, 
      inn || null,
      address || null,
      country || null,
      city || null,
      'CUSTOMER', 
      true, // Approved by default as requested
    ]);

    const user = result.rows[0];

    await client.end();

    return NextResponse.json(
      {
        success: true,
        message: 'Qeydiyyat uğurla tamamlandı. İndi daxil ola bilərsiniz.',
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
          inn: user.inn,
          address: user.address,
          country: user.country,
          city: user.city,
          isApproved: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    await client.end();
    return NextResponse.json(
      { success: false, error: 'Qeydiyyat xətası' },
      { status: 500 }
    );
  }
} 