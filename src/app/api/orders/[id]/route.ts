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

// Get product info from database by productId
async function getProductInfo(productId: string) {
  try {
    // First try to get from products API (this is more reliable)
    try {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://sado-parts.vercel.app';
      const productsResponse = await fetch(`${baseUrl}/api/products`);
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

// Get single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let dbClient: Client | null = null;
  
  try {
    const { id: orderId } = await params;
    
    console.log('GET /api/orders/[id] called with orderId:', orderId);

    if (!orderId) {
      console.log('No orderId provided');
      return NextResponse.json(
        { error: 'Sifariş ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get order from database
    try {
      console.log('Getting database client...');
      dbClient = await getClient();
      console.log('Database client obtained');
      
      // Get order details
      console.log('Querying order with ID:', orderId);
      const orderResult = await dbClient.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      console.log('Order query result:', orderResult.rows);

      if (orderResult.rows.length === 0) {
        console.log('Order not found in database');
        return NextResponse.json(
          { error: 'Sifariş tapılmadı' },
          { status: 404 }
        );
      }

      const order = orderResult.rows[0];
      console.log('Order found:', order);

      // Get order items
      console.log('Querying order items for orderId:', orderId);
      const itemsResult = await dbClient.query(
        'SELECT * FROM order_items WHERE "orderId" = $1',
        [orderId]
      );

      const items = itemsResult.rows;
      console.log('Order items found:', items);

      // Enhance items with product information
      console.log('Enhancing items with product information...');
      const enhancedItems = await Promise.all(items.map(async (item: any) => {
        console.log('Getting product info for:', item.productId);
        const productInfo = await getProductInfo(item.productId);
        console.log('Product info:', productInfo);
        
        const enhanced = {
          id: item.id,
          productId: item.productId,
          name: productInfo?.name || `Məhsul ${item.productId}`,
          quantity: item.quantity,
          price: parseFloat(item.price) || 0,
          totalPrice: (parseFloat(item.price) || 0) * item.quantity,
          sku: productInfo?.sku || item.productId,
          categoryName: productInfo?.categoryName || 'General'
        };
        console.log('Enhanced item:', enhanced);
        return enhanced;
      }));

      const orderWithItems = {
        ...order,
        items: enhancedItems
      };
      
      console.log('Final order with items:', orderWithItems);

      return NextResponse.json(orderWithItems);

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Verilənlər bazası xətası' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Sifariş əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (dbClient) {
      try {
        await closeClient(dbClient);
      } catch (closeError) {
        console.error('Error releasing client:', closeError);
      }
    }
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
    return NextResponse.json(
      { error: 'Sifariş yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (dbClient) {
      try {
        await closeClient(dbClient);
      } catch (closeError) {
        console.error('Error releasing client:', closeError);
      }
    }
  }
} 