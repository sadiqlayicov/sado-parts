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

// Get all orders for admin
export async function GET(request: NextRequest) {
  let dbClient: Client | null = null;
  
  try {
    console.log('GET /api/admin/orders called');

    // Get orders from database
    try {
      dbClient = await getClient();
      
      // Get all orders with user information
      const ordersResult = await dbClient.query(`
        SELECT 
          o.*,
          u.name as customer_name,
          u.email as customer_email,
          u.phone as customer_phone
        FROM orders o
        LEFT JOIN users u ON o."userId" = u.id
        ORDER BY o."createdAt" DESC
      `);

      console.log('Found orders:', ordersResult.rows.length);

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        ordersResult.rows.map(async (order) => {
          if (!dbClient) {
            throw new Error('Database client is null');
          }
          
          const itemsResult = await dbClient.query(`
            SELECT oi.*, p.name, p.sku, p.artikul, c.name as "categoryName"
            FROM order_items oi
            LEFT JOIN products p ON oi."productId" = p.id
            LEFT JOIN categories c ON p."categoryId" = c.id
            WHERE oi."orderId" = $1
          `, [order.id]);

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

      return NextResponse.json({
        success: true,
        orders: ordersWithItems
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Verilənlər bazası xətası' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Get admin orders error:', error);
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
    return NextResponse.json(
      { error: 'Sifariş yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (dbClient) {
      await closeClient(dbClient);
    }
  }
} 