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

    // Get user cart items from cart API
    let userCart;
    try {
      console.log('Fetching cart for userId:', userId);
      const cartResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/cart?userId=${userId}`);
      console.log('Cart response status:', cartResponse.status);
      
      const cartData = await cartResponse.json();
      console.log('Cart data received:', cartData);
      
      if (!cartData.success) {
        console.error('Cart API returned success: false');
        return NextResponse.json(
          { error: 'Səbət məlumatları alınmadı' },
          { status: 400 }
        );
      }
      
      if (!cartData.cart) {
        console.error('Cart data missing cart property');
        return NextResponse.json(
          { error: 'Səbət məlumatları düzgün deyil' },
          { status: 400 }
        );
      }
      
      if (!cartData.cart.items || cartData.cart.items.length === 0) {
        console.error('Cart items array is empty or missing');
        return NextResponse.json(
          { error: 'Səbətdə məhsul yoxdur' },
          { status: 400 }
        );
      }
      
      userCart = cartData.cart.items;
      console.log('Cart items for order:', userCart); // Debug log
    } catch (error) {
      console.error('Error fetching cart:', error);
      return NextResponse.json(
        { error: 'Səbət məlumatları alınmadı' },
        { status: 500 }
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    userCart.forEach((item: any) => {
      const price = item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price);
      totalAmount += price * parseInt(item.quantity);
    });

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
      items: await Promise.all(userCart.map(async (item: any) => {
        // Get real product info from database
        let productInfo = null;
        try {
          productInfo = await getProductInfo(item.productId);
        } catch (error) {
          console.error('Error getting product info for order:', error);
        }
        
        return {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId: item.productId,
          name: productInfo?.name || item.name, // Use real product name from database
          quantity: item.quantity,
          price: item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price),
          totalPrice: (item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price)) * parseInt(item.quantity),
          sku: productInfo?.sku || item.sku,
          categoryName: productInfo?.categoryName || item.categoryName
        };
      }))
    };

    // Store order in database
    try {
      const dbClient = await getClient();
      
      console.log('Inserting order into database:', {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        totalAmount: order.totalAmount
      });
      
      // Insert order into database
      const orderResult = await dbClient.query(
        `INSERT INTO orders (id, "orderNumber", "userId", status, "totalAmount", currency, notes, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          order.id,
          order.orderNumber,
          order.userId,
          order.status,
          order.totalAmount,
          order.currency,
          order.notes,
          order.createdAt,
          order.updatedAt
        ]
      );
      
      console.log('Order inserted successfully:', orderResult.rows[0]);

      // Insert order items into database
      for (const item of order.items) {
        console.log('Inserting order item:', {
          id: item.id,
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        });
        
        await dbClient.query(
          `INSERT INTO order_items (id, "orderId", "productId", quantity, price, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            item.id,
            order.id,
            item.productId,
            item.quantity,
            item.price,
            item.createdAt || new Date().toISOString(),
            item.updatedAt || new Date().toISOString()
          ]
        );
      }
      
      console.log('All order items inserted successfully');
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

         // Clear cart by removing all items
     try {
       for (const item of userCart) {
         console.log('Clearing cart item:', item.id); // Debug log
         await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/cart`, {
           method: 'DELETE',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({ cartItemId: item.id })
         });
       }
       console.log('Cart cleared successfully'); // Debug log
     } catch (error) {
       console.error('Error clearing cart:', error);
       // Continue with order creation even if cart clearing fails
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

  } catch (error) {
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

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Sifarişləri əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 