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

// Get order details with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    


    if (!orderId) {
      return NextResponse.json(
        { error: 'Sifariş ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get order details with user info
    const orderResult = await dbClient.query(`
      SELECT o.id, o."orderNumber", o.status, o."totalAmount", o.currency, o.notes,
             o."createdAt", o."updatedAt",
             u.id as "userId", u.email, u."firstName", u."lastName", u.phone,
             u.inn, u.address, u.country, u.city
      FROM orders o
      JOIN users u ON o."userId" = u.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];

    // Get order items with product details
    const itemsResult = await dbClient.query(`
      SELECT oi.id, oi.quantity, oi.price, oi."createdAt",
             p.id as "productId", p.name, p.description, p.sku, p.images,
             c.name as "categoryName"
      FROM order_items oi
      JOIN products p ON oi."productId" = p.id
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE oi."orderId" = $1
      ORDER BY oi."createdAt" ASC
    `, [orderId]);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: {
          id: order.userId,
          email: order.email,
          name: `${order.firstName} ${order.lastName}`,
          firstName: order.firstName,
          lastName: order.lastName,
          phone: order.phone,
          inn: order.inn,
          address: order.address,
          country: order.country,
          city: order.city
        },
        items: itemsResult.rows.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          description: item.description,
          sku: item.sku,
          images: item.images,
          categoryName: item.categoryName,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          totalPrice: parseFloat(item.price) * parseInt(item.quantity),
          createdAt: item.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get order details error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Sifariş detallarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

// PUT - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { status } = await request.json();

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