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

// Create new order
export async function POST(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { userId, notes, shippingAddress } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get user cart items
    const cartResult = await dbClient.query(`
      SELECT ci.id, ci.quantity, ci."productId",
             p.name, p.price, p."salePrice", p.stock
      FROM cart_items ci
      JOIN products p ON ci."productId" = p.id
      WHERE ci."userId" = $1 AND ci."isActive" = true
    `, [userId]);

    if (cartResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Səbətdə məhsul yoxdur' },
        { status: 400 }
      );
    }

    // Check stock availability
    for (const item of cartResult.rows) {
      if (parseInt(item.stock) < parseInt(item.quantity)) {
        return NextResponse.json(
          { error: `${item.name} məhsulundan kifayət qədər stok yoxdur` },
          { status: 400 }
        );
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    cartResult.rows.forEach(item => {
      const price = item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price);
      totalAmount += price * parseInt(item.quantity);
    });

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Start transaction
    await dbClient.query('BEGIN');

    try {
      // Create order
      const orderResult = await dbClient.query(`
        INSERT INTO orders (id, "orderNumber", "userId", status, "totalAmount", currency, notes, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, 'pending', $3, 'AZN', $4, NOW(), NOW())
        RETURNING id, "orderNumber"
      `, [orderNumber, userId, totalAmount, notes]);

      const orderId = orderResult.rows[0].id;

      // Create order items
      for (const item of cartResult.rows) {
        const price = item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price);
        
        await dbClient.query(`
          INSERT INTO order_items (id, "orderId", "productId", quantity, price, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
        `, [orderId, item.productId, item.quantity, price]);

        // Update product stock
        await dbClient.query(`
          UPDATE products 
          SET stock = stock - $1, "updatedAt" = NOW()
          WHERE id = $2
        `, [item.quantity, item.productId]);
      }

      // Clear cart (deactivate cart items)
      await dbClient.query(`
        UPDATE cart_items 
        SET "isActive" = false, "updatedAt" = NOW()
        WHERE "userId" = $1 AND "isActive" = true
      `, [userId]);

      // Add shipping address if provided
      if (shippingAddress) {
        await dbClient.query(`
          INSERT INTO addresses (id, "userId", street, city, state, "postalCode", country, "isDefault", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, false, NOW(), NOW())
        `, [userId, shippingAddress.street, shippingAddress.city, shippingAddress.state, shippingAddress.postalCode, shippingAddress.country]);
      }

      await dbClient.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Sifariş uğurla yaradıldı',
        order: {
          id: orderId,
          orderNumber: orderResult.rows[0].orderNumber,
          totalAmount: totalAmount,
          status: 'pending'
        }
      });

    } catch (error) {
      await dbClient.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Create order error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Sifariş yaratma zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

// Get user orders
export async function GET(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];
    let paramIndex = 1;

    if (userId) {
      whereClause = `WHERE o."userId" = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    // Get orders with item count
    const ordersResult = await dbClient.query(`
      SELECT o.id, o."orderNumber", o.status, o."totalAmount", o.currency, o.notes, 
             o."createdAt", o."updatedAt",
             COUNT(oi.id) as "itemsCount"
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi."orderId"
      ${whereClause}
      GROUP BY o.id, o."orderNumber", o.status, o."totalAmount", o.currency, o.notes, o."createdAt", o."updatedAt"
      ORDER BY o."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, skip]);

    // Get total count
    const countResult = await dbClient.query(`
      SELECT COUNT(*) as total
      FROM orders o
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
        updatedAt: order.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Sifarişləri əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 