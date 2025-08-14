import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// CommerceML 2.05 Standard API
export async function GET(request: NextRequest) {
  let client: any;
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const format = searchParams.get('format') || 'xml';
    
    console.log('CommerceML GET request:', { action, format });

    if (!action) {
      return NextResponse.json(
        { error: 'Требуется параметр action' },
        { status: 400 }
      );
    }

    client = await pool.connect();

    switch (action) {
      case 'get_catalog':
        return await getCatalog(client, format);
      case 'get_offers':
        return await getOffers(client, format);
      case 'get_orders':
        return await getOrders(client, format);
      case 'get_classifier':
        return await getClassifier(client, format);
      case 'get_export_jobs':
        return await getExportJobs(client);
      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('CommerceML GET error:', error);
    return NextResponse.json(
      { error: `Ошибка CommerceML обмена: ${error.message}` },
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
    
    console.log('CommerceML POST request:', { action });

    if (!action) {
      return NextResponse.json(
        { error: 'Требуется параметр action' },
        { status: 400 }
      );
    }

    const body = await request.json();
    client = await pool.connect();

    switch (action) {
      case 'import_catalog':
        return await importCatalog(client, body);
      case 'import_offers':
        return await importOffers(client, body);
      case 'import_orders':
        return await importOrders(client, body);
      case 'export_data':
        return await exportData(client, body);
      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('CommerceML POST error:', error);
    return NextResponse.json(
      { error: `Ошибка CommerceML обмена: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

// CommerceML 2.05 Helper functions
async function getCatalog(client: any, format: string) {
  const result = await client.query(`
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p."salePrice",
      p.sku,
      p.stock,
      p.artikul,
      p."catalogNumber",
      p."isActive",
      p."isFeatured",
      p."createdAt",
      p."updatedAt",
      c.name as category_name,
      c.id as category_id
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
    category: {
      id: row.category_id,
      name: row.category_name
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));

  if (format === 'xml') {
    const xml = generateCommerceMLCatalog(products);
    return new NextResponse(xml, {
      headers: { 
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="catalog.xml"'
      }
    });
  }

  return NextResponse.json({
    success: true,
    count: products.length,
    catalog: products
  });
}

async function getOffers(client: any, format: string) {
  const result = await client.query(`
    SELECT 
      p.id,
      p.name,
      p.price,
      p."salePrice",
      p.sku,
      p.stock,
      p.artikul,
      p."catalogNumber",
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true AND p.stock > 0
    ORDER BY p.name
  `);

  const offers = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    price: parseFloat(row.price),
    salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
    sku: row.sku,
    artikul: row.artikul,
    catalogNumber: row.catalogNumber,
    stock: row.stock,
    category: row.category_name
  }));

  if (format === 'xml') {
    const xml = generateCommerceMLOffers(offers);
    return new NextResponse(xml, {
      headers: { 
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="offers.xml"'
      }
    });
  }

  return NextResponse.json({
    success: true,
    count: offers.length,
    offers
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
      u.inn,
      u.address
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
      inn: row.inn,
      address: row.address
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));

  if (format === 'xml') {
    const xml = generateCommerceMLOrders(orders);
    return new NextResponse(xml, {
      headers: { 
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="orders.xml"'
      }
    });
  }

  return NextResponse.json({
    success: true,
    count: orders.length,
    orders
  });
}

async function getClassifier(client: any, format: string) {
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
    const xml = generateCommerceMLClassifier(categories);
    return new NextResponse(xml, {
      headers: { 
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="classifier.xml"'
      }
    });
  }

  return NextResponse.json({
    success: true,
    count: categories.length,
    classifier: categories
  });
}

// Import functions
async function importCatalog(client: any, catalog: any) {
  let updated = 0;
  let created = 0;
  let errors = 0;

  for (const product of catalog.products || []) {
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
        let categoryId = '1'; // Default category
        
        if (product.category && product.category.name) {
          const categoryResult = await client.query(`
            SELECT id FROM categories WHERE name = $1
          `, [product.category.name]);
          
          if (categoryResult.rows.length > 0) {
            categoryId = categoryResult.rows[0].id;
          } else {
            const newCategoryResult = await client.query(`
              INSERT INTO categories (name, description, "isActive")
              VALUES ($1, $2, $3)
              RETURNING id
            `, [product.category.name, product.category.description || '', true]);
            categoryId = newCategoryResult.rows[0].id;
          }
        }

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
          categoryId
        ]);
        created++;
      }
    } catch (error) {
      console.error('Error importing product:', product, error);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Импорт каталога завершен',
    stats: {
      updated,
      created,
      errors
    }
  });
}

async function importOffers(client: any, offers: any) {
  let updated = 0;
  let errors = 0;

  for (const offer of offers.offers || []) {
    try {
      await client.query(`
        UPDATE products 
        SET 
          price = $1,
          "salePrice" = $2,
          stock = $3,
          "updatedAt" = NOW()
        WHERE artikul = $4
      `, [offer.price, offer.salePrice, offer.stock, offer.artikul]);
      updated++;
    } catch (error) {
      console.error('Error importing offer:', offer, error);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Импорт предложений завершен',
    stats: {
      updated,
      errors
    }
  });
}

async function importOrders(client: any, orders: any) {
  let updated = 0;
  let errors = 0;

  for (const order of orders.orders || []) {
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
      console.error('Error importing order:', order, error);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Импорт заказов завершен',
    stats: {
      updated,
      errors
    }
  });
}

// Export functions
async function getExportJobs(client: any) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS export_jobs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        format VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        file_url TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await client.query(`
      SELECT 
        id,
        type,
        data_type,
        format,
        status,
        file_url,
        error_message,
        created_at
      FROM export_jobs 
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    return NextResponse.json({
      success: true,
      jobs: result.rows || []
    });

  } catch (error: any) {
    console.error('Error getting export jobs:', error);
    return NextResponse.json(
      { error: `Ошибка получения заданий экспорта: ${error.message}` },
      { status: 500 }
    );
  }
}

async function exportData(client: any, body: any) {
  try {
    const { data_type, format } = body;

    if (!data_type || !format) {
      return NextResponse.json(
        { error: 'Требуется data_type и format' },
        { status: 400 }
      );
    }

    const jobResult = await client.query(`
      INSERT INTO export_jobs (
        type, data_type, format, status
      ) VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      'export',
      data_type,
      format,
      'processing'
    ]);

    const jobId = jobResult.rows[0].id;

    let data: any[] = [];
    let fileName = '';

    switch (data_type) {
      case 'catalog':
        const catalogResult = await client.query(`
          SELECT 
            p.*,
            c.name as category_name,
            c.id as category_id
          FROM products p
          LEFT JOIN categories c ON p."categoryId" = c.id
          WHERE p."isActive" = true
          ORDER BY p."createdAt" DESC
        `);
        data = catalogResult.rows;
        fileName = `catalog_export_${Date.now()}`;
        break;

      case 'offers':
        const offersResult = await client.query(`
          SELECT 
            p.id,
            p.name,
            p.price,
            p."salePrice",
            p.sku,
            p.stock,
            p.artikul,
            p."catalogNumber",
            c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p."categoryId" = c.id
          WHERE p."isActive" = true AND p.stock > 0
          ORDER BY p.name
        `);
        data = offersResult.rows;
        fileName = `offers_export_${Date.now()}`;
        break;

      case 'orders':
        const ordersResult = await client.query(`
          SELECT 
            o.*,
            u."firstName",
            u."lastName",
            u.email,
            u.phone,
            u.inn,
            u.address
          FROM orders o
          LEFT JOIN users u ON o."userId" = u.id
          ORDER BY o."createdAt" DESC
        `);
        data = ordersResult.rows;
        fileName = `orders_export_${Date.now()}`;
        break;

      case 'classifier':
        const classifierResult = await client.query(`
          SELECT * FROM categories 
          WHERE "isActive" = true
          ORDER BY "createdAt" DESC
        `);
        data = classifierResult.rows;
        fileName = `classifier_export_${Date.now()}`;
        break;

      default:
        throw new Error('Неизвестный тип данных');
    }

    let fileContent = '';
    let fileUrl = '';

    switch (format) {
      case 'json':
        fileContent = JSON.stringify(data, null, 2);
        fileName += '.json';
        break;

      case 'xml':
        switch (data_type) {
          case 'catalog':
            fileContent = generateCommerceMLCatalog(data);
            break;
          case 'offers':
            fileContent = generateCommerceMLOffers(data);
            break;
          case 'orders':
            fileContent = generateCommerceMLOrders(data);
            break;
          case 'classifier':
            fileContent = generateCommerceMLClassifier(data);
            break;
        }
        fileName += '.xml';
        break;

      case 'csv':
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const csvRows = [headers.join(',')];
          
          for (const row of data) {
            const values = headers.map(header => {
              const value = row[header];
              if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value || '';
            });
            csvRows.push(values.join(','));
          }
          
          fileContent = csvRows.join('\n');
        }
        fileName += '.csv';
        break;

      default:
        throw new Error('Неподдерживаемый формат');
    }

    fileUrl = `data:text/plain;base64,${Buffer.from(fileContent).toString('base64')}`;

    await client.query(`
      UPDATE export_jobs 
      SET 
        status = 'completed',
        file_url = $1
      WHERE id = $2
    `, [fileUrl, jobId]);

    return NextResponse.json({
      success: true,
      message: 'Экспорт завершен успешно',
      jobId,
      fileName,
      fileUrl,
      recordCount: data.length
    });

  } catch (error: any) {
    console.error('Error exporting data:', error);
    
    if (client) {
      try {
        await client.query(`
          UPDATE export_jobs 
          SET 
            status = 'failed',
            error_message = $1
          WHERE status = 'processing'
        `, [error.message]);
      } catch (updateError) {
        console.error('Error updating job status:', updateError);
      }
    }
    
    return NextResponse.json(
      { error: `Ошибка экспорта: ${error.message}` },
      { status: 500 }
    );
  }
}

// CommerceML 2.05 XML Generation Functions
function generateCommerceMLCatalog(products: any[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<КоммерческаяИнформация ВерсияСхемы="2.05" ДатаФормирования="' + new Date().toISOString() + '">\n';
  xml += '  <Классификатор>\n';
  xml += '    <Ид>1</Ид>\n';
  xml += '    <Наименование>Каталог товаров</Наименование>\n';
  xml += '  </Классификатор>\n';
  xml += '  <Каталог СодержитТолькоИзменения="false">\n';
  xml += '    <Ид>1</Ид>\n';
  xml += '    <ИдКлассификатора>1</ИдКлассификатора>\n';
  xml += '    <Наименование>Каталог товаров</Наименование>\n';
  
  for (const product of products) {
    xml += '    <Товар>\n';
    xml += `      <Ид>${product.id}</Ид>\n`;
    xml += `      <Наименование>${escapeXml(product.name)}</Наименование>\n`;
    if (product.description) {
      xml += `      <Описание>${escapeXml(product.description)}</Описание>\n`;
    }
    xml += `      <Артикул>${escapeXml(product.artikul || '')}</Артикул>\n`;
    xml += `      <БазоваяЕдиница Код="796" НаименованиеПолное="Штука" МеждународноеСокращение="PCE">шт</БазоваяЕдиница>\n`;
    xml += `      <Группы>\n`;
    xml += `        <Ид>${product.category?.id || '1'}</Ид>\n`;
    xml += `      </Группы>\n`;
    xml += `      <СтавкиНалогов>\n`;
    xml += `        <СтавкаНалога>\n`;
    xml += `          <Наименование>НДС</Наименование>\n`;
    xml += `          <Ставка>20</Ставка>\n`;
    xml += `        </СтавкаНалога>\n`;
    xml += `      </СтавкиНалогов>\n`;
    xml += '    </Товар>\n';
  }
  
  xml += '  </Каталог>\n';
  xml += '</КоммерческаяИнформация>';
  return xml;
}

function generateCommerceMLOffers(offers: any[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<КоммерческаяИнформация ВерсияСхемы="2.05" ДатаФормирования="' + new Date().toISOString() + '">\n';
  xml += '  <ПакетПредложений СодержитТолькоИзменения="false">\n';
  xml += '    <Ид>1</Ид>\n';
  xml += '    <Наименование>Прайс-лист</Наименование>\n';
  xml += '    <ИдКаталога>1</ИдКаталога>\n';
  xml += '    <ИдКлассификатора>1</ИдКлассификатора>\n';
  xml += '    <Владелец>\n';
  xml += '      <Ид>1</Ид>\n';
  xml += '      <Наименование>Sado-Parts</Наименование>\n';
  xml += '      <ПолноеНаименование>Sado-Parts</ПолноеНаименование>\n';
  xml += '    </Владелец>\n';
  xml += '    <ТипыЦен>\n';
  xml += '      <ТипЦены>\n';
  xml += '        <Ид>1</Ид>\n';
  xml += '        <Наименование>Розничная</Наименование>\n';
  xml += '      </ТипЦены>\n';
  xml += '    </ТипыЦен>\n';
  
  for (const offer of offers) {
    xml += '    <Предложение>\n';
    xml += `      <Ид>${offer.id}</Ид>\n`;
    xml += `      <ИдТовара>${offer.id}</ИдТовара>\n`;
    xml += `      <Количество>${offer.stock}</Количество>\n`;
    xml += '      <Цены>\n';
    xml += '        <Цена>\n';
    xml += '          <ИдТипаЦены>1</ИдТипаЦены>\n';
    xml += `          <ЦенаЗаЕдиницу>${offer.price}</ЦенаЗаЕдиницу>\n`;
    xml += '          <Валюта>AZN</Валюта>\n';
    xml += '          <Налог>\n';
    xml += '            <Наименование>НДС</Наименование>\n';
    xml += '            <УчтеноВСумме>false</УчтеноВСумме>\n';
    xml += '          </Налог>\n';
    xml += '        </Цена>\n';
    xml += '      </Цены>\n';
    xml += '    </Предложение>\n';
  }
  
  xml += '  </ПакетПредложений>\n';
  xml += '</КоммерческаяИнформация>';
  return xml;
}

function generateCommerceMLOrders(orders: any[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<КоммерческаяИнформация ВерсияСхемы="2.05" ДатаФормирования="' + new Date().toISOString() + '">\n';
  xml += '  <Документы>\n';
  
  for (const order of orders) {
    xml += '    <Документ>\n';
    xml += '      <Ид>' + order.orderNumber + '</Ид>\n';
    xml += '      <Номер>' + order.orderNumber + '</Номер>\n';
    xml += '      <Дата>' + new Date(order.createdAt).toISOString().split('T')[0] + '</Дата>\n';
    xml += '      <ХозОперация>Заказ товара</ХозОперация>\n';
    xml += '      <Роль>Продавец</Роль>\n';
    xml += '      <Валюта>' + (order.currency || 'AZN') + '</Валюта>\n';
    xml += '      <Курс>1</Курс>\n';
    xml += '      <Сумма>' + order.totalAmount + '</Сумма>\n';
    xml += '      <Контрагенты>\n';
    xml += '        <Контрагент>\n';
    xml += '          <Ид>1</Ид>\n';
    xml += '          <Наименование>' + escapeXml(order.customer?.firstName + ' ' + order.customer?.lastName) + '</Наименование>\n';
    xml += '          <ПолноеНаименование>' + escapeXml(order.customer?.firstName + ' ' + order.customer?.lastName) + '</ПолноеНаименование>\n';
    xml += '          <Роль>Покупатель</Роль>\n';
    if (order.customer?.email) {
      xml += '          <Контакты>\n';
      xml += '            <Контакт>\n';
      xml += '              <Тип>Почта</Тип>\n';
      xml += '              <Значение>' + escapeXml(order.customer.email) + '</Значение>\n';
      xml += '            </Контакт>\n';
      xml += '          </Контакты>\n';
    }
    xml += '        </Контрагент>\n';
    xml += '      </Контрагенты>\n';
    xml += '      <Товары>\n';
    // Here you would add order items if available
    xml += '      </Товары>\n';
    xml += '    </Документ>\n';
  }
  
  xml += '  </Документы>\n';
  xml += '</КоммерческаяИнформация>';
  return xml;
}

function generateCommerceMLClassifier(categories: any[]) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<КоммерческаяИнформация ВерсияСхемы="2.05" ДатаФормирования="' + new Date().toISOString() + '">\n';
  xml += '  <Классификатор>\n';
  xml += '    <Ид>1</Ид>\n';
  xml += '    <Наименование>Классификатор товаров</Наименование>\n';
  xml += '    <Группы>\n';
  
  for (const category of categories) {
    xml += '      <Группа>\n';
    xml += `        <Ид>${category.id}</Ид>\n`;
    xml += `        <Наименование>${escapeXml(category.name)}</Наименование>\n`;
    if (category.description) {
      xml += `        <Описание>${escapeXml(category.description)}</Описание>\n`;
    }
    xml += '      </Группа>\n';
  }
  
  xml += '    </Группы>\n';
  xml += '  </Классификатор>\n';
  xml += '</КоммерческаяИнформация>';
  return xml;
}

function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
} 