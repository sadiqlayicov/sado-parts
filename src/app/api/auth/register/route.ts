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
        { error: 'Email və şifrə tələb olunur' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu email ünvanı artıq istifadə olunub' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with actual database schema
    const result = await client.query(`
      INSERT INTO users (id, email, password, "firstName", "lastName", phone, role, "isApproved", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, email, "firstName", "lastName", "isApproved"
    `, [
      email, 
      hashedPassword, 
      firstName || 'User', 
      lastName || 'User', 
      phone || null, 
      'CUSTOMER', 
      true, // Auto-approve for now
      true  // Active
    ]);

    const user = result.rows[0];

    // Create default address if provided
    if (address && country && city) {
      await client.query(`
        INSERT INTO addresses (id, street, city, country, state, "postalCode", "isDefault", "userId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [address, city, country, '', '', true, user.id]);
    }

    await client.end();

    return NextResponse.json(
      {
        success: true,
        message: 'Qeydiyyat uğurla tamamlandı.',
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          isApproved: user.isApproved,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    await client.end();
    return NextResponse.json(
      { error: 'Qeydiyyat xətası' },
      { status: 500 }
    );
  }
} 