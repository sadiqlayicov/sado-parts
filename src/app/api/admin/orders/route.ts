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
    // First try to get from products API (this is more reliable)
    try {
      const productsResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/products`);
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        const foundProduct = products.find((p: any) => p.id === productId);
        if (foundProduct) {
          return {
            name: foundProduct.name,
            price: parseFloat(foundProduct.price) || 100,
            salePrice: parseFloat(foundProduct.salePrice) || parseFloat(foundProduct.price) || 80,
            sku: foundProduct.sku || foundProduct.artikul || `SKU-${productId}`,
            categoryName: foundProduct.category?.name || 'General'
          };
        }
      }
    } catch (error) {
      console.error('Error fetching from products API:', error);
    }
    
    // If API fails, try database
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
    } catch (dbError) {
      console.error('Error getting product info from database:', dbError);
    }
    
    return null;
  } catch (error) {
    console.error('Error in getProductInfo:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const dbClient = await getClient();
    
    // Get all orders with user information
    const ordersResult = await dbClient.query(`
      SELECT o.*, 
             u."firstName", u."lastName", u.email, u.phone
      FROM orders o
      LEFT JOIN users u ON o."userId" = u.id
      ORDER BY o."createdAt" DESC
    `);

    const orders = ordersResult.rows;
    console.log('Found orders:', orders.length);

    // Enhance orders with items and customer info
    const enhancedOrders = await Promise.all(orders.map(async (order: any) => {
      try {
        // Get order items
        const itemsResult = await dbClient.query(
          'SELECT * FROM order_items WHERE "orderId" = $1',
          [order.id]
        );

        const items = itemsResult.rows;
        console.log(`Order ${order.id} has ${items.length} items`);

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

        return {
          ...order,
          totalAmount: totalAmount,
          items: enhancedItems,
          customerName: order.firstName && order.lastName ? `${order.firstName} ${order.lastName}` : order.email,
          customerEmail: order.email,
          customerPhone: order.phone
        };
      } catch (orderError) {
        console.error('Error processing order:', orderError);
        return {
          ...order,
          totalAmount: parseFloat(order.totalAmount?.toString() || '0') || 0,
          items: [],
          customerName: order.firstName && order.lastName ? `${order.firstName} ${order.lastName}` : order.email,
          customerEmail: order.email,
          customerPhone: order.phone
        };
      }
    }));

    console.log('Enhanced orders processed:', enhancedOrders.length);

    return NextResponse.json({
      success: true,
      orders: enhancedOrders
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    return NextResponse.json(
      { error: 'Sifarişləri əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await closeClient();
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