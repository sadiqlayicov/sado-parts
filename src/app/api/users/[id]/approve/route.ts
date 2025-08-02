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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { id } = await params;
    const body = await request.json();
    const { isApproved, action } = body;

    // Validate user exists
    const existingUser = await dbClient.query(
      'SELECT id, email, "firstName", "lastName", role, "isApproved" FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    // Determine the action and update accordingly
    let updateData: any = {};
    let message = '';

    if (action === 'approve') {
      updateData = { isApproved: true };
      message = 'İstifadəçi uğurla təsdiqləndi!';
    } else if (action === 'block') {
      updateData = { isApproved: false };
      message = 'İstifadəçi uğurla bloklandı!';
    } else if (action === 'unblock') {
      updateData = { isApproved: true };
      message = 'İstifadəçi blokdan uğurla çıxarıldı!';
    } else {
      // Fallback for backward compatibility
      updateData = { isApproved: isApproved };
      message = isApproved ? 'İstifadəçi təsdiqləndi' : 'İstifadəçi təsdiqlənmədi';
    }

    // Update user status
    const updatedUser = await dbClient.query(
      `UPDATE users SET "isApproved" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, email, "firstName", "lastName", role, "isApproved"`,
      [updateData.isApproved, id]
    );

    const user = updatedUser.rows[0];

    return NextResponse.json({
      success: true,
      message: message,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        isApproved: user.isApproved,
        isAdmin: user.role === 'ADMIN'
      }
    });

  } catch (error) {
    console.error('User status update error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'İstifadəçi statusu yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 