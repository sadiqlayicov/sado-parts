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

// Get product info from database by productId
async function getProductInfo(productId: string) {
  try {
    const dbClient = await getClient();
    
    // Try to find by productId (UUID) first
    let result = await dbClient.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p."categoryId" = c.id WHERE p.id = $1',
      [productId]
    );
    
    // If not found by ID, try to find by SKU
    if (result.rows.length === 0) {
      result = await dbClient.query(
        'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p."categoryId" = c.id WHERE p.sku = $1',
        [productId]
      );
    }
    
    if (result.rows.length > 0) {
      const product = result.rows[0];
      return {
        name: product.name,
        price: parseFloat(product.price) || 100,
        salePrice: parseFloat(product.salePrice) || parseFloat(product.price) || 80,
        sku: product.sku || product.artikul || `SKU-${productId}`,
        categoryName: product.category_name || 'General'
      };
    }
    
    return null;
  } catch (dbError) {
    console.error('Error getting product info from database:', dbError);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    console.log('GET /api/admin/orders/[id] called for orderId:', orderId);
    
    const dbClient = await getClient();
    
    // Get order with user information
    const orderResult = await dbClient.query(`
      SELECT o.*, 
             u."firstName", u."lastName", u.email, u.phone
      FROM orders o
      LEFT JOIN users u ON o."userId" = u.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];
    console.log('Found order:', order.orderNumber);

    // Get order items
    const itemsResult = await dbClient.query(
      'SELECT * FROM order_items WHERE "orderId" = $1',
      [orderId]
    );

    const items = itemsResult.rows;
    console.log('Found items:', items.length);

    // Enhance items with product information
    const enhancedItems = await Promise.all(items.map(async (item: any) => {
      try {
        const productInfo = await getProductInfo(item.productId);
        
        return {
          id: item.id,
          productId: item.productId,
          name: productInfo?.name || `Məhsul ${item.productId}`,
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0,
          totalPrice: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
          sku: productInfo?.sku || item.productId,
          categoryName: productInfo?.categoryName || 'General'
        };
      } catch (itemError) {
        console.error('Error processing item:', itemError);
        return {
          id: item.id,
          productId: item.productId,
          name: `Məhsul ${item.productId}`,
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0,
          totalPrice: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
          sku: item.productId,
          categoryName: 'General'
        };
      }
    }));

    // Ensure totalAmount is a number
    const totalAmount = parseFloat(order.totalAmount?.toString() || '0') || 0;

    const enhancedOrder = {
      ...order,
      totalAmount: totalAmount,
      items: enhancedItems,
      customerName: order.firstName && order.lastName ? `${order.firstName} ${order.lastName}` : order.email,
      customerEmail: order.email,
      customerPhone: order.phone
    };

    console.log('Enhanced order processed');

    return NextResponse.json({
      success: true,
      order: enhancedOrder
    });

  } catch (error) {
    console.error('Get order details error:', error);
    return NextResponse.json(
      { error: 'Sifariş məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await closeClient();
  }
} 