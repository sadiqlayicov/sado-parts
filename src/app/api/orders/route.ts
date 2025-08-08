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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'Требуется ID пользователя' },
      { status: 400 }
    );
  }

  let client: any;
  
  try {
    client = await pool.connect();

    // Check if orders table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Orders table does not exist, creating...');
      await client.query(`
        CREATE TABLE orders (
          id VARCHAR(255) PRIMARY KEY,
          "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
          "userId" VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          "totalAmount" DECIMAL(10,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'RUB',
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(`CREATE INDEX idx_orders_user_id ON orders("userId")`);
      await client.query(`CREATE INDEX idx_orders_status ON orders(status)`);
      console.log('Orders table created successfully');
    }

    // Check if order_items table exists
    const orderItemsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items'
      );
    `);
    
    if (!orderItemsTableCheck.rows[0].exists) {
      console.log('Order items table does not exist, creating...');
      await client.query(`
        CREATE TABLE order_items (
          id VARCHAR(255) PRIMARY KEY,
          "orderId" VARCHAR(255) NOT NULL,
          "productId" VARCHAR(255) NOT NULL,
          name VARCHAR(500) NOT NULL,
          sku VARCHAR(255),
          "categoryName" VARCHAR(255),
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          "totalPrice" DECIMAL(10,2) NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE
        )
      `);
      
      await client.query(`CREATE INDEX idx_order_items_order_id ON order_items("orderId")`);
      await client.query(`CREATE INDEX idx_order_items_product_id ON order_items("productId")`);
      console.log('Order items table created successfully');
    }

    // Get orders for user
    const ordersResult = await client.query(`
      SELECT o.*, 
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi."orderId"
      WHERE o."userId" = $1
      GROUP BY o.id
      ORDER BY o."createdAt" DESC
    `, [userId]);

    const orders = ordersResult.rows;

    // Get order items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order: any) => {
      const itemsResult = await client.query(`
        SELECT * FROM order_items 
        WHERE "orderId" = $1 
        ORDER BY "createdAt"
      `, [order.id]);

      return {
        ...order,
        items: itemsResult.rows
      };
    }));

    return NextResponse.json({
      success: true,
      orders: ordersWithItems
    });

  } catch (error: any) {
    console.error('Get orders error:', error);
    
    if (error.message?.includes('Max client connections reached')) {
      return NextResponse.json(
        { error: 'Достигнут лимит подключений к базе данных. Пожалуйста, подождите немного.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Не удалось получить данные заказов' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let client;
  
  try {
    const { userId, items, totalAmount, notes, orderNumber } = await request.json();

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Требуется ID пользователя и список товаров' },
        { status: 400 }
      );
    }

    console.log('Creating order:', { userId, orderNumber, totalAmount, itemCount: items.length });

    client = await pool.connect();

    // Check if orders table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating orders table...');
      await client.query(`
        CREATE TABLE orders (
          id VARCHAR(255) PRIMARY KEY,
          "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
          "userId" VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          "totalAmount" DECIMAL(10,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'RUB',
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(`CREATE INDEX idx_orders_user_id ON orders("userId")`);
      await client.query(`CREATE INDEX idx_orders_status ON orders(status)`);
      console.log('Orders table created successfully');
    }

    // Check if order_items table exists
    const orderItemsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items'
      );
    `);
    
    if (!orderItemsTableCheck.rows[0].exists) {
      console.log('Creating order items table...');
      await client.query(`
        CREATE TABLE order_items (
          id VARCHAR(255) PRIMARY KEY,
          "orderId" VARCHAR(255) NOT NULL,
          "productId" VARCHAR(255) NOT NULL,
          name VARCHAR(500) NOT NULL,
          sku VARCHAR(255),
          "categoryName" VARCHAR(255),
          quantity INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          "totalPrice" DECIMAL(10,2) NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE
        )
      `);
      
      await client.query(`CREATE INDEX idx_order_items_order_id ON order_items("orderId")`);
      await client.query(`CREATE INDEX idx_order_items_product_id ON order_items("productId")`);
      console.log('Order items table created successfully');
    }

    // Generate order ID
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (id, "orderNumber", "userId", "totalAmount", notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [orderId, orderNumber, userId, totalAmount, notes || '']);

    const order = orderResult.rows[0];

    // Create order items
    const orderItems = [];
    for (const item of items) {
      const itemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const itemResult = await client.query(`
        INSERT INTO order_items (id, "orderId", "productId", name, sku, "categoryName", quantity, price, "totalPrice")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        itemId,
        orderId,
        item.productId,
        item.name,
        item.sku || '',
        item.categoryName || '',
        item.quantity,
        item.price,
        item.totalPrice
      ]);

      orderItems.push(itemResult.rows[0]);
    }

    console.log('Order created successfully:', orderId);

    return NextResponse.json({
      success: true,
      message: 'Заказ успешно создан',
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    
    if (error.message?.includes('Max client connections reached')) {
      return NextResponse.json(
        { error: 'Достигнут лимит подключений к базе данных. Пожалуйста, подождите немного.' },
        { status: 503 }
      );
    }
    
    if (error.message?.includes('duplicate key value violates unique constraint')) {
      return NextResponse.json(
        { error: 'Этот номер заказа уже существует' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Произошла ошибка при создании заказа' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 