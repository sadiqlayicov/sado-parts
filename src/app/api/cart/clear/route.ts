import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Simple database connection function
async function getClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    console.log('Database connected successfully');
    return client;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function closeClient(client: Client) {
  try {
    if (client) {
      await client.end();
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Clear cart for user
export async function POST(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    const { userId } = await request.json();
    
    console.log('POST /api/cart/clear called with userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    // Clear cart from database
    try {
      dbClient = await getClient();
      
      const result = await dbClient.query(
        'DELETE FROM cart_items WHERE "userId" = $1',
        [userId]
      );

      console.log('Cart cleared for user:', userId, 'Items removed:', result.rowCount);

      return NextResponse.json({
        success: true,
        message: 'Səbət uğurla təmizləndi',
        itemsRemoved: result.rowCount
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Verilənlər bazası xətası' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Clear cart error:', error);
    return NextResponse.json(
      { error: 'Səbət təmizləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (dbClient) {
      await closeClient(dbClient);
    }
  }
}
