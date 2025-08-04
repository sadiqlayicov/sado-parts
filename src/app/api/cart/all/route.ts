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

// Get all cart items for admin
export async function GET(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    dbClient = await getClient();
    
    // Get all cart items with user and product details
    const cartResult = await dbClient.query(`
      SELECT ci.id, ci.quantity, ci."createdAt",
             u.id as "userId", u.email, u."firstName", u."lastName",
             p.id as "productId", p.name, p.description, p.price, p."salePrice", p.images, p.stock, p.sku,
             c.name as "categoryName"
      FROM cart_items ci
      JOIN users u ON ci."userId" = u.id
      JOIN products p ON ci."productId" = p.id
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE ci."isActive" = true
      ORDER BY ci."createdAt" DESC
    `);

    const cartItems = cartResult.rows.map((item: any) => {
      const quantity = parseInt(item.quantity);
      const price = parseFloat(item.price);
      const salePrice = item.salePrice ? parseFloat(item.salePrice) : price;
      
      return {
        id: item.id,
        userId: item.userId,
        userEmail: item.email,
        userName: `${item.firstName} ${item.lastName}`,
        productId: item.productId,
        productName: item.name,
        productDescription: item.description,
        price: price,
        salePrice: salePrice,
        images: item.images,
        stock: parseInt(item.stock),
        sku: item.sku,
        categoryName: item.categoryName,
        quantity: quantity,
        totalPrice: price * quantity,
        totalSalePrice: salePrice * quantity,
        createdAt: item.createdAt
      };
    });

    // Group by user
    const userCarts: Record<string, any> = {};
    cartItems.forEach(item => {
      if (!userCarts[item.userId]) {
        userCarts[item.userId] = {
          userId: item.userId,
          userEmail: item.userEmail,
          userName: item.userName,
          items: [],
          totalItems: 0,
          totalPrice: 0,
          totalSalePrice: 0
        };
      }
      userCarts[item.userId].items.push(item);
      userCarts[item.userId].totalItems += item.quantity;
      userCarts[item.userId].totalPrice += item.totalPrice;
      userCarts[item.userId].totalSalePrice += item.totalSalePrice;
    });

    return NextResponse.json({
      success: true,
      cartItems: Object.values(userCarts),
      totalUsers: Object.keys(userCarts).length,
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    });

  } catch (error) {
    console.error('Get all cart items error:', error);
    await closeClient();
    return NextResponse.json(
      { error: 'Səbət məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 