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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get user profile data
    const userResult = await dbClient.query(`
      SELECT id, email, "firstName", "lastName", phone, inn, address, country, city, 
             "isApproved", "discountPercentage", "createdAt", "updatedAt"
      FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Get user orders (with error handling for missing table)
    let ordersResult;
    try {
      ordersResult = await dbClient.query(`
        SELECT o.id, o."orderNumber", o.status, o."totalAmount", o.currency, o.notes, 
               o."createdAt", o."updatedAt",
               COUNT(oi.id) as "itemsCount"
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi."orderId"
        WHERE o."userId" = $1
        GROUP BY o.id, o."orderNumber", o.status, o."totalAmount", o.currency, o.notes, o."createdAt", o."updatedAt"
        ORDER BY o."createdAt" DESC
      `, [userId]);
    } catch (error) {
      console.log('Orders table not found, using empty array');
      ordersResult = { rows: [] };
    }

    // Get user addresses (with error handling for missing table)
    let addressesResult;
    try {
      addressesResult = await dbClient.query(`
        SELECT id, street, city, state, "postalCode", country, "isDefault", "createdAt"
        FROM addresses
        WHERE "userId" = $1
        ORDER BY "isDefault" DESC, "createdAt" DESC
      `, [userId]);
    } catch (error) {
      console.log('Addresses table not found, using empty array');
      addressesResult = { rows: [] };
    }

    // Calculate statistics
    const totalOrders = ordersResult.rows.length;
    const totalSpent = ordersResult.rows.reduce((sum, order: any) => sum + parseFloat(order.totalAmount), 0);
    const completedOrders = ordersResult.rows.filter((order: any) => order.status === 'delivered').length;
    const pendingOrders = ordersResult.rows.filter((order: any) => ['pending', 'processing'].includes(order.status)).length;

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        inn: user.inn,
        address: user.address,
        country: user.country,
        city: user.city,
        isApproved: user.isApproved,
        discountPercentage: user.discountPercentage || 0,
        registrationDate: user.createdAt,
        lastLogin: user.updatedAt
      },
      statistics: {
        totalOrders,
        totalSpent: Math.round(totalSpent * 100) / 100,
        completedOrders,
        pendingOrders,
        discountPercentage: user.discountPercentage || 0
      },
      orders: ordersResult.rows.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        itemsCount: parseInt(order.itemsCount),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      })),
      addresses: addressesResult.rows
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Profil məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 