import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2, // Limit connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function POST(request: NextRequest) {
  let client;
  
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    console.log('Clearing cart for userId:', userId);

    client = await pool.connect();

    // Delete all cart items for the user
    const result = await client.query(
      'DELETE FROM cart_items WHERE "userId" = $1 RETURNING id',
      [userId]
    );

    console.log('Cleared cart items:', result.rows.length);

    return NextResponse.json({
      success: true,
      message: 'Səbət təmizləndi',
      clearedItems: result.rows.length
    });

  } catch (error: any) {
    console.error('Clear cart error:', error);
    
    if (error.message?.includes('Max client connections reached')) {
      return NextResponse.json(
        { error: 'Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Səbəti təmizləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
