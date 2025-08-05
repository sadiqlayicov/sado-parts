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

    // Clear cart by removing all items
    try {
      const cartResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/cart?userId=${userId}`);
      const cartData = await cartResponse.json();
      
      if (cartData.success && cartData.cart && cartData.cart.items.length > 0) {
        for (const item of cartData.cart.items) {
          await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/cart`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cartItemId: item.id })
          });
        }
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
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