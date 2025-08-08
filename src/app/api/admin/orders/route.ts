import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2, // Limit connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Get all orders for admin
export async function GET(request: NextRequest) {
  let client: any;
  
  try {
    console.log('GET /api/admin/orders called');

    // Get orders from database
    try {
      client = await pool.connect();
      console.log('Database connected successfully');
      
      // Simple query first - just get orders without joins
      console.log('Executing simple orders query...');
      const simpleOrdersResult = await client.query(`
        SELECT * FROM orders ORDER BY "createdAt" DESC LIMIT 10
      `);
      
      console.log('Simple query successful, found orders:', simpleOrdersResult.rows.length);
      
      // Now try with user join
      console.log('Executing orders with user join...');
      const ordersResult = await client.query(`
        SELECT 
          o.*,
          u.name as customer_name,
          u.firstName as customer_first_name,
          u.lastName as customer_last_name,
          u.email as customer_email,
          u.phone as customer_phone,
          u.inn as customer_inn
        FROM orders o
        LEFT JOIN users u ON o."userId" = u.id
        ORDER BY o."createdAt" DESC
      `);

      console.log('Orders with user data found:', ordersResult.rows.length);

      // Get order items for each order (simplified)
      console.log('Getting order items...');
      const ordersWithItems = await Promise.all(
        ordersResult.rows.map(async (order: any) => {
          if (!client) {
            throw new Error('Database client is null');
          }
          
          try {
            const itemsResult = await client.query(`
              SELECT oi.*, p.name, p.sku, p.artikul, c.name as "categoryName"
              FROM order_items oi
              LEFT JOIN products p ON oi."productId" = p.id
              LEFT JOIN categories c ON p."categoryId" = c.id
              WHERE oi."orderId" = $1
            `, [order.id]);

            return {
              ...order,
              items: itemsResult.rows.map((item: any) => ({
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
          } catch (itemError: any) {
            console.error(`Error getting items for order ${order.id}:`, itemError.message);
            return {
              ...order,
              items: []
            };
          }
        })
      );

      console.log('Orders with items processed:', ordersWithItems.length);

      return NextResponse.json({
        success: true,
        orders: ordersWithItems
      });

    } catch (dbError: any) {
      console.error('Database error details:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        hint: dbError.hint,
        where: dbError.where
      });
      
      if (dbError.message?.includes('Max client connections reached')) {
        return NextResponse.json(
          { error: 'Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.' },
          { status: 503 }
        );
      }
      
      if (dbError.message?.includes('relation "orders" does not exist')) {
        return NextResponse.json(
          { error: 'Orders table does not exist in database' },
          { status: 500 }
        );
      }
      
      if (dbError.message?.includes('relation "order_items" does not exist')) {
        return NextResponse.json(
          { error: 'Order_items table does not exist in database' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Verilənlər bazası xətası: ${dbError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Get admin orders error:', error);
    return NextResponse.json(
      { error: 'Sifarişlər əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Update order status
export async function PUT(request: NextRequest) {
  let client: any;
  
  try {
    client = await pool.connect();
    
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Sifariş ID və status tələb olunur' },
        { status: 400 }
      );
    }

    const result = await client.query(`
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

  } catch (error: any) {
    console.error('Update order error:', error);
    
    if (error.message?.includes('Max client connections reached')) {
      return NextResponse.json(
        { error: 'Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Sifariş yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 