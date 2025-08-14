import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 1C ERP Integration API
export async function GET(request: NextRequest) {
  let client: any;
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const format = searchParams.get('format') || 'json';
    
    console.log('1C Exchange GET request:', { action, format });

    if (!action) {
      return NextResponse.json(
        { error: 'Требуется параметр action' },
        { status: 400 }
      );
    }

    client = await pool.connect();

    switch (action) {
      case 'get_products':
        return await getProducts(client, format);
      case 'get_orders':
        return await getOrders(client, format);
      case 'get_categories':
        return await getCategories(client, format);
      case 'get_inventory':
        return await getInventory(client, format);
      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('1C Exchange GET error:', error);
    return NextResponse.json(
      { error: `Ошибка 1C обмена: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let client: any;
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    console.log('1C Exchange POST request:', { action });

    if (!action) {
      return NextResponse.json(
        { error: 'Требуется параметр action' },
        { status: 400 }
      );
    }

    const body = await request.json();
    client = await pool.connect();

    switch (action) {
      case 'sync_products':
        return await syncProducts(client, body);
      case 'sync_orders':
        return await syncOrders(client, body);
      case 'update_inventory':
        return await updateInventory(client, body);
      case 'create_order':
        return await createOrder(client, body);
      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('1C Exchange POST error:', error);
    return NextResponse.json(
      { error: `Ошибка 1C обмена: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Helper functions
async function getProducts(client: any, format: string) {
  const result = await client.query(`
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p.salePrice,
      p.sku,
      p.stock,
      p.artikul,
      p."catalogNumber",
      p."isActive",
      p."isFeatured",
      p."createdAt",
      p."updatedAt",
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true
    ORDER BY p."createdAt" DESC
  `);

  const products = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
    sku: row.sku,
    artikul: row.artikul,
    catalogNumber: row.catalogNumber,
    stock: row.stock,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    category: row.category_name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));

  if (format === 'xml') {
    const xml = generateProductsXML(products);
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml' }
    });
  }

  return NextResponse.json({
    success: true,
    count: products.length,
    products
  });
}

async function getOrders(client: any, format: string) {
  const result = await client.query(`
    SELECT 
      o.id,
      o."orderNumber",
      o.status,
      o."totalAmount",
      o.currency,
      o.notes,
      o."createdAt",
      o."updatedAt",
      u."firstName",
      u."lastName",
      u.email,
      u.phone,
      u.inn
    FROM orders o
    LEFT JOIN users u ON o."userId" = u.id
    WHERE o.status IN ('pending', 'confirmed', 'processing')
    ORDER BY o."createdAt" DESC
  `);

  const orders = result.rows.map((row: any) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    totalAmount: parseFloat(row.totalAmount),
    currency: row.currency,
    notes: row.notes,
    customer: {
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      inn: row.inn
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));

  if (format === 'xml') {
    const xml = generateOrdersXML(orders);
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml' }
    });
  }

  return NextResponse.json({
    success: true,
    count: orders.length,
    orders
  });
}

async function getCategories(client: any, format: string) {
  const result = await client.query(`
    SELECT 
      id,
      name,
      description,
      "isActive",
      "createdAt",
      "updatedAt"
    FROM categories
    WHERE "isActive" = true
    ORDER BY name
  `);

  const categories = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));

  if (format === 'xml') {
    const xml = generateCategoriesXML(categories);
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml' }
    });
  }

  return NextResponse.json({
    success: true,
    count: categories.length,
    categories
  });
}

async function getInventory(client: any, format: string) {
  const result = await client.query(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.stock,
      p."isActive",
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true
    ORDER BY p.name
  `);

  const inventory = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    stock: row.stock,
    category: row.category_name,
    isActive: row.isActive
  }));

  if (format === 'xml') {
    const xml = generateInventoryXML(inventory);
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml' }
    });
  }

  return NextResponse.json({
    success: true,
    count: inventory.length,
    inventory
  });
}

async function syncProducts(client: any, products: any[]) {
  let updated = 0;
  let created = 0;
  let errors = 0;

  for (const product of products) {
    try {
      if (product.id) {
        // Update existing product
        await client.query(`
          UPDATE products 
          SET 
            name = $1,
            description = $2,
            price = $3,
            "salePrice" = $4,
            sku = $5,
            stock = $6,
            artikul = $7,
            "catalogNumber" = $8,
            "isActive" = $9,
            "updatedAt" = NOW()
          WHERE id = $10
        `, [
          product.name,
          product.description,
          product.price,
          product.salePrice,
          product.sku,
          product.stock,
          product.artikul,
          product.catalogNumber,
          product.isActive,
          product.id
        ]);
        updated++;
      } else {
        // Create new product
        await client.query(`
          INSERT INTO products (
            name, description, price, "salePrice", sku, stock, 
            artikul, "catalogNumber", "isActive", "categoryId"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          product.name,
          product.description,
          product.price,
          product.salePrice,
          product.sku,
          product.stock,
          product.artikul,
          product.catalogNumber,
          product.isActive,
          product.categoryId || '1' // Default category
        ]);
        created++;
      }
    } catch (error) {
      console.error('Error syncing product:', product, error);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Синхронизация товаров завершена',
    stats: {
      updated,
      created,
      errors
    }
  });
}

async function syncOrders(client: any, orders: any[]) {
  let updated = 0;
  let errors = 0;

  for (const order of orders) {
    try {
      await client.query(`
        UPDATE orders 
        SET 
          status = $1,
          notes = $2,
          "updatedAt" = NOW()
        WHERE "orderNumber" = $3
      `, [order.status, order.notes, order.orderNumber]);
      updated++;
    } catch (error) {
      console.error('Error syncing order:', order, error);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Синхронизация заказов завершена',
    stats: {
      updated,
      errors
    }
  });
}

async function updateInventory(client: any, inventory: any[]) {
  let updated = 0;
  let errors = 0;

  for (const item of inventory) {
    try {
      await client.query(`
        UPDATE products 
        SET 
          stock = $1,
          "updatedAt" = NOW()
        WHERE sku = $2
      `, [item.stock, item.sku]);
      updated++;
    } catch (error) {
      console.error('Error updating inventory:', item, error);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Обновление остатков завершено',
    stats: {
      updated,
      errors
    }
  });
}

async function createOrder(client: any, orderData: any) {
  try {
    const orderNumber = `SADO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const result = await client.query(`
      INSERT INTO orders (
        "orderNumber", "userId", status, "totalAmount", currency, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      orderNumber,
      orderData.userId,
      'pending',
      orderData.totalAmount,
      orderData.currency || 'AZN',
      orderData.notes
    ]);

    const orderId = result.rows[0].id;

    // Add order items
    for (const item of orderData.items) {
      await client.query(`
        INSERT INTO order_items (
          "orderId", "productId", quantity, price
        ) VALUES ($1, $2, $3, $4)
      `, [orderId, item.productId, item.quantity, item.price]);
    }

    return NextResponse.json({
      success: true,
      message: 'Заказ успешно создан',
      orderId,
      orderNumber
    });

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: `Ошибка создания заказа: ${error.message}` },
      { status: 500 }
    );
  }
}

// XML generation functions
function generateProductsXML(products: any[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<products>\n';
  
  for (const product of products) {
    xml += '  <product>\n';
    xml += `    <id>${product.id}</id>\n`;
    xml += `    <name>${escapeXml(product.name)}</name>\n`;
    xml += `    <description>${escapeXml(product.description || '')}</description>\n`;
    xml += `    <price>${product.price}</price>\n`;
    xml += `    <salePrice>${product.salePrice || ''}</salePrice>\n`;
    xml += `    <sku>${escapeXml(product.sku || '')}</sku>\n`;
    xml += `    <artikul>${escapeXml(product.artikul || '')}</artikul>\n`;
    xml += `    <catalogNumber>${escapeXml(product.catalogNumber || '')}</catalogNumber>\n`;
    xml += `    <stock>${product.stock}</stock>\n`;
    xml += `    <category>${escapeXml(product.category || '')}</category>\n`;
    xml += `    <isActive>${product.isActive}</isActive>\n`;
    xml += `    <isFeatured>${product.isFeatured}</isFeatured>\n`;
    xml += `    <createdAt>${product.createdAt}</createdAt>\n`;
    xml += `    <updatedAt>${product.updatedAt}</updatedAt>\n`;
    xml += '  </product>\n';
  }
  
  xml += '</products>';
  return xml;
}

function generateOrdersXML(orders: any[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<orders>\n';
  
  for (const order of orders) {
    xml += '  <order>\n';
    xml += `    <id>${order.id}</id>\n`;
    xml += `    <orderNumber>${order.orderNumber}</orderNumber>\n`;
    xml += `    <status>${order.status}</status>\n`;
    xml += `    <totalAmount>${order.totalAmount}</totalAmount>\n`;
    xml += `    <currency>${order.currency}</currency>\n`;
    xml += `    <notes>${escapeXml(order.notes || '')}</notes>\n`;
    xml += '    <customer>\n';
    xml += `      <firstName>${escapeXml(order.customer.firstName || '')}</firstName>\n`;
    xml += `      <lastName>${escapeXml(order.customer.lastName || '')}</lastName>\n`;
    xml += `      <email>${escapeXml(order.customer.email || '')}</email>\n`;
    xml += `      <phone>${escapeXml(order.customer.phone || '')}</phone>\n`;
    xml += `      <inn>${escapeXml(order.customer.inn || '')}</inn>\n`;
    xml += '    </customer>\n';
    xml += `    <createdAt>${order.createdAt}</createdAt>\n`;
    xml += `    <updatedAt>${order.updatedAt}</updatedAt>\n`;
    xml += '  </order>\n';
  }
  
  xml += '</orders>';
  return xml;
}

function generateCategoriesXML(categories: any[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<categories>\n';
  
  for (const category of categories) {
    xml += '  <category>\n';
    xml += `    <id>${category.id}</id>\n`;
    xml += `    <name>${escapeXml(category.name)}</name>\n`;
    xml += `    <description>${escapeXml(category.description || '')}</description>\n`;
    xml += `    <isActive>${category.isActive}</isActive>\n`;
    xml += `    <createdAt>${category.createdAt}</createdAt>\n`;
    xml += `    <updatedAt>${category.updatedAt}</updatedAt>\n`;
    xml += '  </category>\n';
  }
  
  xml += '</categories>';
  return xml;
}

function generateInventoryXML(inventory: any[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<inventory>\n';
  
  for (const item of inventory) {
    xml += '  <item>\n';
    xml += `    <id>${item.id}</id>\n`;
    xml += `    <name>${escapeXml(item.name)}</name>\n`;
    xml += `    <sku>${escapeXml(item.sku || '')}</sku>\n`;
    xml += `    <stock>${item.stock}</stock>\n`;
    xml += `    <category>${escapeXml(item.category || '')}</category>\n`;
    xml += `    <isActive>${item.isActive}</isActive>\n`;
    xml += '  </item>\n';
  }
  
  xml += '</inventory>';
  return xml;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
} 