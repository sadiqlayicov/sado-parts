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

export async function POST(request: NextRequest) {
  try {
    const { orderId, itemId, quantity } = await request.json();
    
    console.log('POST /api/admin/orders/update-item-quantity called with:', { orderId, itemId, quantity });

    if (!orderId || !itemId || !quantity) {
      return NextResponse.json(
        { error: 'Sifariş ID, məhsul ID və sayı tələb olunur' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Məhsul sayı 1-dən az ola bilməz' },
        { status: 400 }
      );
    }

    const dbClient = await getClient();
    
    // Update item quantity
    const itemResult = await dbClient.query(
      `UPDATE order_items 
       SET quantity = $1, "updatedAt" = CURRENT_TIMESTAMP 
       WHERE id = $2 AND "orderId" = $3 
       RETURNING id, quantity, price`,
      [quantity, itemId, orderId]
    );

    if (itemResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Məhsul tapılmadı' },
        { status: 404 }
      );
    }

    const updatedItem = itemResult.rows[0];
    const newTotalPrice = parseFloat(updatedItem.price) * quantity;

    // Update order total amount
    const orderResult = await dbClient.query(
      `UPDATE orders 
       SET "totalAmount" = (
         SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
         FROM order_items oi
         WHERE oi."orderId" = $1
       ),
       "updatedAt" = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, "totalAmount"`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      );
    }

    const updatedOrder = orderResult.rows[0];
    console.log('Item quantity updated:', { itemId, quantity, newTotalPrice, orderTotal: updatedOrder.totalAmount });

    return NextResponse.json({
      success: true,
      message: 'Məhsul sayı uğurla yeniləndi',
      data: {
        itemId,
        quantity,
        totalPrice: newTotalPrice,
        orderTotal: updatedOrder.totalAmount
      }
    });

  } catch (error) {
    console.error('Update item quantity error:', error);
    return NextResponse.json(
      { error: 'Məhsul sayı yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await closeClient();
  }
} 