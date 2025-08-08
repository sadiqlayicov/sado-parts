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
      
      // Very simple query first - just count orders
      console.log('Executing simple count query...');
      const countResult = await client.query('SELECT COUNT(*) FROM orders');
      console.log('Total orders in database:', countResult.rows[0].count);
      
      // Simple query to get orders without joins
      console.log('Executing simple orders query...');
      const simpleOrdersResult = await client.query(`
        SELECT id, "orderNumber", status, "totalAmount", "createdAt", "userId"
        FROM orders 
        ORDER BY "createdAt" DESC 
        LIMIT 10
      `);
      
      console.log('Simple query successful, found orders:', simpleOrdersResult.rows.length);
      
      // Return simple data first
      return NextResponse.json({
        success: true,
        orders: simpleOrdersResult.rows.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: parseFloat(order.totalAmount) || 0,
          createdAt: order.createdAt,
          userId: order.userId,
          items: [], // Empty items for now
          customerName: 'Müştəri',
          customerEmail: 'email@example.com',
          customerPhone: '',
          customerInn: ''
        }))
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