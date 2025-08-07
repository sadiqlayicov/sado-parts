import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Simple database connection function
async function getClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    console.log('Database connected successfully');
    return client;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function closeClient(client: Client) {
  try {
    if (client) {
      await client.end();
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
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
        salePrice: parseFloat(product.salePrice) || null,
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
  let dbClient: Client | null = null;
  
  try {
    const { userId, notes, shippingAddress, cartItems } = await request.json();

    console.log('=== ORDER CREATION START ===');
    console.log('Request body:', { userId, notes, cartItemsCount: cartItems?.length });

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    console.log('Creating order for userId:', userId);

    // Use cart items from request body if provided, otherwise get from database
    let userCart = cartItems || [];
    
    console.log('Cart items from request:', userCart.length);
    console.log('Cart items data:', userCart);
    
    if (userCart.length === 0) {
      // Fallback to database if no cart items provided
      console.log('No cart items in request, getting from database...');
      userCart = await getCartItems(userId);
      console.log('Cart items from database:', userCart.length);
    }
    
    console.log('Final cart items found:', userCart.length);

    if (userCart.length === 0) {
      console.log('No cart items found, returning error');
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
    const timestamp = Date.now();
    const orderNumber = `SIF-${String(timestamp).slice(-8)}`;

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
    console.log('Order details:', {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      totalAmount: order.totalAmount,
      itemsCount: order.items.length
    });

    // Store order in database
    try {
      dbClient = await getClient();
      
      // Check if orders table exists and create if needed
      try {
        await dbClient.query('SELECT 1 FROM orders LIMIT 1');
      } catch (tableError) {
        await dbClient.query(`
          CREATE TABLE orders (
            id VARCHAR(255) PRIMARY KEY,
            "orderNumber" VARCHAR(255) NOT NULL,
            "userId" VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            "totalAmount" DECIMAL(10,2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'AZN',
            notes TEXT,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await dbClient.query(`
          CREATE TABLE order_items (
            id VARCHAR(255) PRIMARY KEY,
            "orderId" VARCHAR(255) NOT NULL,
            "productId" VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await dbClient.query(`CREATE INDEX idx_orders_user_id ON orders("userId")`);
        await dbClient.query(`CREATE INDEX idx_order_items_order_id ON order_items("orderId")`);
      }
      
      // Insert order
      await dbClient.query(
        `INSERT INTO orders (id, "orderNumber", "userId", status, "totalAmount", currency, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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

      // Clear cart by removing all items
      for (const item of userCart) {
        await dbClient.query(
          'DELETE FROM cart_items WHERE id = $1',
          [item.id]
        );
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
      
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Sifariş yaratma zamanı verilənlər bazası xətası baş verdi'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('=== GENERAL ERROR ===');
    console.error('Create order error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { error: 'Sifariş yaratma zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (dbClient) {
      console.log('Closing database connection...');
      await closeClient(dbClient);
      console.log('Database connection closed');
    }
  }
}

// Get user orders
export async function GET(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('GET /api/orders called with:', { userId, page, limit });

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get orders from database
    try {
      dbClient = await getClient();
      
      const skip = (page - 1) * limit;
      
      // First, get orders
      const ordersResult = await dbClient.query(
        `SELECT * FROM orders 
         WHERE "userId" = $1 
         ORDER BY "createdAt" DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, skip]
      );

      console.log('Found orders:', ordersResult.rows.length);

      // Then, get order items for each order
      const ordersWithItems = await Promise.all(
        ordersResult.rows.map(async (order) => {
          if (!dbClient) {
            throw new Error('Database client is null');
          }
          
          const itemsResult = await dbClient.query(
            `SELECT oi.*, p.name, p.sku, p.artikul, c.name as "categoryName"
             FROM order_items oi
             LEFT JOIN products p ON oi."productId" = p.id
             LEFT JOIN categories c ON p."categoryId" = c.id
             WHERE oi."orderId" = $1`,
            [order.id]
          );

          return {
            ...order,
            items: itemsResult.rows.map(item => ({
              id: item.id,
              productId: item.productId,
              name: item.name || 'Unknown Product',
              quantity: item.quantity,
              price: parseFloat(item.price) || 0,
              totalPrice: (parseFloat(item.price) || 0) * item.quantity,
              sku: item.sku || item.artikul || 'N/A',
              categoryName: item.categoryName || 'General'
            }))
          };
        })
      );

      console.log('Orders with items processed:', ordersWithItems.length);

      return NextResponse.json(ordersWithItems);

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Verilənlər bazası xətası' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Sifarişlər əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (dbClient) {
      await closeClient(dbClient);
    }
  }
} 