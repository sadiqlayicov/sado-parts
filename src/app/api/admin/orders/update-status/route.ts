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
    const { orderId, status } = await request.json();
    
    console.log('POST /api/admin/orders/update-status called with:', { orderId, status });

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Sifariş ID və status tələb olunur' },
        { status: 400 }
      );
    }

    // Validate status - include new statuses from the order system
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Etibarsız status' },
        { status: 400 }
      );
    }

    client = await pool.connect();
    
    // Update order status
    const result = await client.query(
      `UPDATE orders 
       SET status = $1, "updatedAt" = NOW() 
       WHERE id = $2 
       RETURNING id, "orderNumber", status`,
      [status, orderId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      );
    }

    const updatedOrder = result.rows[0];
    console.log('Order status updated:', updatedOrder);

    return NextResponse.json({
      success: true,
      message: 'Sifariş statusu uğurla yeniləndi',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status
      }
    });

  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: 'Status yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 