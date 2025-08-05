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

// In-memory order storage (temporary solution)
const orderStorage = new Map<string, any[]>();

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

// Get cart items directly from database
async function getCartItems(userId: string) {
  try {
    console.log('Getting cart items for userId:', userId);
    
    const dbClient = await getClient();
    
    // Check if cart_items table exists
    const tableCheck = await dbClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Cart items table does not exist, returning empty cart');
      return [];
    }
    
    // Get cart items with product info
    const result = await dbClient.query(`
      SELECT ci.*, p.name, p.price, p."salePrice", p.sku, p.artikul, c.name as category_name
      FROM cart_items ci
      LEFT JOIN products p ON ci."productId" = p.id
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE ci."userId" = $1
    `, [userId]);
    
    console.log('Cart items found in database:', result.rows.length);
    
    return result.rows.map(row => ({
      id: row.id,
      productId: row.productId,
      name: row.name || 'Unknown Product',
      description: 'Product description',
      price: parseFloat(row.price) || 0,
      salePrice: parseFloat(row.salePrice) || parseFloat(row.price) || 0,
      quantity: parseInt(row.quantity) || 1,
      sku: row.sku || row.artikul || 'SKU-UNKNOWN',
      stock: 10,
      images: [],
      categoryName: row.category_name || 'General',
      totalPrice: (parseFloat(row.price) || 0) * (parseInt(row.quantity) || 1),
      totalSalePrice: (parseFloat(row.salePrice) || parseFloat(row.price) || 0) * (parseInt(row.quantity) || 1),
      createdAt: row.createdAt || new Date().toISOString()
    }));
    
  } catch (error: any) {
    console.error('Error getting cart items from database:', error);
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    return [];
  }
}

// Create new order
export async function POST(request: NextRequest) {
  try {
    const { userId, notes, shippingAddress } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    console.log('Creating order for userId:', userId);

    // Get user cart items directly from database
    const userCart = await getCartItems(userId);
    console.log('Cart items found:', userCart.length);

    if (userCart.length === 0) {
      return NextResponse.json(
        { error: 'Səbətdə məhsul yoxdur' },
        { status: 400 }
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    userCart.forEach((item: any) => {
      const price = item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price);
      totalAmount += price * parseInt(item.quantity);
    });

    console.log('Total amount calculated:', totalAmount);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order object
    const order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: orderNumber,
      userId: userId,
      status: 'pending',
      totalAmount: totalAmount,
      currency: 'AZN',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: userCart.map((item: any) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price),
        totalPrice: (item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price)) * parseInt(item.quantity),
        sku: item.sku,
        categoryName: item.categoryName
      }))
    };

    console.log('Order object created:', order.id);

    // Store order in database
    try {
      const dbClient = await getClient();
      
      console.log('Attempting to insert order into database...');
      
      // Insert order
      const orderResult = await dbClient.query(
        `INSERT INTO orders (id, "orderNumber", "userId", status, "totalAmount", currency, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          order.id,
          order.orderNumber,
          order.userId,
          order.status,
          order.totalAmount,
          order.currency,
          order.notes || ''
        ]
      );
      
      console.log('Order inserted successfully');

      // Insert order items
      for (const item of order.items) {
        await dbClient.query(
          `INSERT INTO order_items (id, "orderId", "productId", quantity, price)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            item.id,
            order.id,
            item.productId,
            item.quantity,
            item.price
          ]
        );
      }
      
      console.log('All order items inserted successfully');

      // Clear cart by removing all items
      for (const item of userCart) {
        await dbClient.query(
          'DELETE FROM cart_items WHERE id = $1',
          [item.id]
        );
      }
      
      console.log('Cart cleared successfully');
      await closeClient();
      
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      console.error('Database error details:', {
        message: dbError?.message,
        code: dbError?.code,
        detail: dbError?.detail
      });
      // Continue with in-memory storage as fallback
      const userOrders = orderStorage.get(userId) || [];
      userOrders.push(order);
      orderStorage.set(userId, userOrders);
    }

    return NextResponse.json({
      success: true,
      message: 'Sifariş uğurla yaradıldı',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status
      }
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Sifariş yaratma zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

// Get user orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get orders from database
    try {
      const dbClient = await getClient();
      
      const skip = (page - 1) * limit;
      
      // Get orders with items
      const ordersResult = await dbClient.query(
        `SELECT o.*, 
                json_agg(
                  json_build_object(
                    'id', oi.id,
                    'productId', oi."productId",
                    'quantity', oi.quantity,
                    'price', oi.price
                  )
                ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi."orderId"
         WHERE o."userId" = $1
         GROUP BY o.id
         ORDER BY o."createdAt" DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, skip]
      );

      await closeClient();
      return NextResponse.json(ordersResult.rows);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Fallback to in-memory storage
      const userOrders = orderStorage.get(userId) || [];
      const skip = (page - 1) * limit;
      const paginatedOrders = userOrders.slice(skip, skip + limit);
      return NextResponse.json(paginatedOrders);
    }

  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Sifarişləri əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 