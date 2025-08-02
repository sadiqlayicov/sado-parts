import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Vercel üçün connection pool
let client: Client | null = null;

async function getClient() {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
  }
  return client;
}

async function closeClient() {
  if (client) {
    await client.end();
    client = null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, email, phone, isApproved, isAdmin } = body;

    // Validate user exists
    const existingUser = await dbClient.query(
      'SELECT id, email, "firstName", "lastName", phone, role, "isApproved" FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    const user = existingUser.rows[0];

    // Update user data
    const updatedUser = await dbClient.query(
      `UPDATE users SET 
        "firstName" = $1, 
        "lastName" = $2, 
        email = $3, 
        phone = $4, 
        "isApproved" = $5, 
        role = $6,
        "updatedAt" = NOW()
       WHERE id = $7 
       RETURNING id, email, "firstName", "lastName", phone, role, "isApproved"`,
      [
        firstName !== undefined ? firstName : user.firstName,
        lastName !== undefined ? lastName : user.lastName,
        email !== undefined ? email : user.email,
        phone !== undefined ? phone : user.phone,
        isApproved !== undefined ? isApproved : user.isApproved,
        isAdmin !== undefined ? (isAdmin ? 'ADMIN' : 'CUSTOMER') : user.role,
        id
      ]
    );

    const updated = updatedUser.rows[0];

    return NextResponse.json({
      success: true,
      message: 'İstifadəçi məlumatları yeniləndi',
      user: {
        id: updated.id,
        email: updated.email,
        name: `${updated.firstName} ${updated.lastName}`,
        phone: updated.phone,
        isApproved: updated.isApproved,
        isAdmin: updated.role === 'ADMIN'
      }
    });

  } catch (error) {
    console.error('User update error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'İstifadəçi məlumatlarını yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { id } = await params;

    const user = await dbClient.query(
      `SELECT id, email, "firstName", "lastName", phone, role, "isApproved", "createdAt", "updatedAt"
       FROM users WHERE id = $1`,
      [id]
    );

    if (user.rows.length === 0) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    const userData = user.rows[0];

    return NextResponse.json({ 
      user: {
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`,
        isAdmin: userData.role === 'ADMIN'
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'İstifadəçi məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 