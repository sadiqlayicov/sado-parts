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

// Complete order
export async function POST(request: NextRequest) {
  try {
    const { orderId, userId } = await request.json();

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Sifariş ID və istifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get order from database
    const dbClient = await getClient();
    
    // First check if order exists
    const orderResult = await dbClient.query(
      'SELECT * FROM orders WHERE id = $1 AND "userId" = $2',
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];

    // Update order status to completed
    await dbClient.query(
      'UPDATE orders SET status = $1, "updatedAt" = NOW() WHERE id = $2',
      ['completed', orderId]
    );

    // Clear cart directly in DB
    try {
      await dbClient.query('DELETE FROM cart_items WHERE "userId" = $1', [userId]);
      console.log('Cart cleared for user after order completion:', userId);
    } catch (error) {
      console.error('Error clearing cart after completion:', error);
      // Continue even if cart clearing fails
    }

    return NextResponse.json({
      success: true,
      message: 'Sifariş uğurla tamamlandı',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: 'completed',
        totalAmount: order.totalAmount
      }
    });

  } catch (error) {
    console.error('Complete order error:', error);
    return NextResponse.json(
      { error: 'Sifariş tamamlama zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await closeClient();
  }
} 