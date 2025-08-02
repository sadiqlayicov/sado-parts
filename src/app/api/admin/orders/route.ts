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

export async function GET(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`o.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (userId) {
      whereConditions.push(`o."userId" = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get orders with user details and item count
    const ordersResult = await dbClient.query(`
      SELECT 
        o.id, o."orderNumber", o.status, o."totalAmount", o.currency, o.notes,
        o."createdAt", o."updatedAt",
        u.id as "userId", u.email, u."firstName", u."lastName", u.phone,
        COUNT(oi.id) as "itemsCount"
      FROM orders o
      JOIN users u ON o."userId" = u.id
      LEFT JOIN order_items oi ON o.id = oi."orderId"
      ${whereClause}
      GROUP BY o.id, o."orderNumber", o.status, o."totalAmount", o.currency, o.notes, o."createdAt", o."updatedAt",
               u.id, u.email, u."firstName", u."lastName", u.phone
      ORDER BY o."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, skip]);

    // Get total count
    const countResult = await dbClient.query(`
      SELECT COUNT(*) as total
      FROM orders o
      JOIN users u ON o."userId" = u.id
      ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      success: true,
      orders: ordersResult.rows.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        notes: order.notes,
        itemsCount: parseInt(order.itemsCount),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: {
          id: order.userId,
          email: order.email,
          name: `${order.firstName} ${order.lastName}`,
          phone: order.phone
        }
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get admin orders error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Sifariş məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

// Update order status
export async function PUT(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Sifariş ID və status tələb olunur' },
        { status: 400 }
      );
    }

    const result = await dbClient.query(`
      UPDATE orders 
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id, "orderNumber", status
    `, [status, orderId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sifariş statusu yeniləndi',
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Update order error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Sifariş yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 