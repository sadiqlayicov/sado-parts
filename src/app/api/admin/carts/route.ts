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
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    let whereClause = 'WHERE ci."isActive" = true';
    let queryParams = [];
    let paramIndex = 1;

    if (userId) {
      whereClause += ` AND ci."userId" = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    // Get all user carts with details
    const cartsResult = await dbClient.query(`
      SELECT 
        ci.id as "cartItemId",
        ci.quantity,
        ci."createdAt" as "addedToCart",
        u.id as "userId",
        u.email,
        u."firstName",
        u."lastName",
        u."isApproved",
        p.id as "productId",
        p.name as "productName",
        p.price,
        p."salePrice",
        p.sku,
        p.stock,
        c.name as "categoryName"
      FROM cart_items ci
      JOIN users u ON ci."userId" = u.id
      JOIN products p ON ci."productId" = p.id
      LEFT JOIN categories c ON p."categoryId" = c.id
      ${whereClause}
      ORDER BY ci."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, skip]);

    // Get total count
    const countResult = await dbClient.query(`
      SELECT COUNT(*) as total
      FROM cart_items ci
      JOIN users u ON ci."userId" = u.id
      JOIN products p ON ci."productId" = p.id
      ${whereClause}
    `, queryParams);

    // Group cart items by user
    const userCarts = {};
    cartsResult.rows.forEach(item => {
      const userId = item.userId;
      if (!userCarts[userId]) {
        userCarts[userId] = {
          userId: userId,
          userEmail: item.email,
          userName: `${item.firstName} ${item.lastName}`,
          isApproved: item.isApproved,
          items: [],
          totalItems: 0,
          totalPrice: 0,
          totalSalePrice: 0
        };
      }

      const quantity = parseInt(item.quantity);
      const price = parseFloat(item.price);
      const salePrice = item.salePrice ? parseFloat(item.salePrice) : price;

      userCarts[userId].items.push({
        cartItemId: item.cartItemId,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        categoryName: item.categoryName,
        price: price,
        salePrice: salePrice,
        stock: parseInt(item.stock),
        quantity: quantity,
        totalPrice: price * quantity,
        totalSalePrice: salePrice * quantity,
        addedToCart: item.addedToCart
      });

      userCarts[userId].totalItems += quantity;
      userCarts[userId].totalPrice += price * quantity;
      userCarts[userId].totalSalePrice += salePrice * quantity;
    });

    // Convert to array and round totals
    const carts = Object.values(userCarts).map(cart => ({
      ...cart,
      totalPrice: Math.round(cart.totalPrice * 100) / 100,
      totalSalePrice: Math.round(cart.totalSalePrice * 100) / 100,
      savings: Math.round((cart.totalPrice - cart.totalSalePrice) * 100) / 100
    }));

    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      success: true,
      carts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get admin carts error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Səbət məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 