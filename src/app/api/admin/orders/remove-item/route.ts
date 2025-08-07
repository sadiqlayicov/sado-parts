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

export async function DELETE(request: NextRequest) {
  try {
    const { orderId, itemId } = await request.json();
    
    console.log('DELETE /api/admin/orders/remove-item called with:', { orderId, itemId });

    if (!orderId || !itemId) {
      return NextResponse.json(
        { error: 'Sifariş ID və məhsul ID tələb olunur' },
        { status: 400 }
      );
    }

    const dbClient = await getClient();
    
    // Check if item exists and get its price
    const itemCheck = await dbClient.query(
      `SELECT id, price FROM order_items WHERE id = $1 AND "orderId" = $2`,
      [itemId, orderId]
    );

    if (itemCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Məhsul tapılmadı' },
        { status: 404 }
      );
    }

    // Delete the item
    await dbClient.query(
      `DELETE FROM order_items WHERE id = $1 AND "orderId" = $2`,
      [itemId, orderId]
    );

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
    console.log('Item removed:', { itemId, orderTotal: updatedOrder.totalAmount });

    return NextResponse.json({
      success: true,
      message: 'Məhsul uğurla silindi',
      data: {
        itemId,
        orderTotal: updatedOrder.totalAmount
      }
    });

  } catch (error) {
    console.error('Remove item error:', error);
    return NextResponse.json(
      { error: 'Məhsul silmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await closeClient();
  }
}
