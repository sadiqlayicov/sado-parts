import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function POST(request: NextRequest) {
  let client: any;
  
  try {
    const { orderId, itemId, quantity } = await request.json();
    
    console.log('POST /api/admin/orders/update-item-quantity called with:', { orderId, itemId, quantity });

    if (!orderId || !itemId || !quantity) {
      return NextResponse.json(
        { error: 'Требуется ID заказа, ID товара и количество' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Количество товара не может быть меньше 1' },
        { status: 400 }
      );
    }

    client = await pool.connect();
    
    // Update item quantity
    const itemResult = await client.query(
      `UPDATE order_items 
       SET quantity = $1, "updatedAt" = NOW() 
       WHERE id = $2 AND "orderId" = $3 
       RETURNING id, quantity, price`,
      [quantity, itemId, orderId]
    );

    if (itemResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    const updatedItem = itemResult.rows[0];
    const newTotalPrice = parseFloat(updatedItem.price) * quantity;

    // Get total amount for the order
    const itemsResult = await client.query(
      `SELECT quantity, price FROM order_items WHERE "orderId" = $1`,
      [orderId]
    );

    const totalAmount = itemsResult.rows.reduce((sum: number, item: any) => 
      sum + (parseFloat(item.price) * item.quantity), 0
    );

    // Update order total amount
    const orderResult = await client.query(
      `UPDATE orders 
       SET "totalAmount" = $1, "updatedAt" = NOW() 
       WHERE id = $2 
       RETURNING id, "totalAmount"`,
      [totalAmount, orderId]
    );

    if (orderResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    const updatedOrder = orderResult.rows[0];

    console.log('Item quantity updated:', { itemId, quantity, newTotalPrice, orderTotal: updatedOrder.totalAmount });

    return NextResponse.json({
      success: true,
      message: 'Количество товара успешно обновлено',
      data: {
        itemId,
        quantity,
        totalPrice: newTotalPrice,
        orderTotal: updatedOrder.totalAmount,
        itemCount: itemsResult.rows.length
      }
    });

  } catch (error: any) {
    console.error('Update item quantity error:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при обновлении количества товара' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 