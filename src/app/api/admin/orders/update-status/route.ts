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
    const { orderId, status } = await request.json();
    
    console.log('POST /api/admin/orders/update-status called with:', { orderId, status });

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Sifariş ID və status tələb olunur' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Etibarsız status' },
        { status: 400 }
      );
    }

    const dbClient = await getClient();
    
    // Update order status
    const result = await dbClient.query(
      `UPDATE orders 
       SET status = $1, "updatedAt" = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, "orderNumber", status`,
      [status, orderId]
    );

    if (result.rows.length === 0) {
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

  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: 'Status yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await closeClient();
  }
} 