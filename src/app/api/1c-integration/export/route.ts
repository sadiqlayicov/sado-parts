import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function POST(request: NextRequest) {
  let client: any;
  
  try {
    client = await pool.connect();
    
    // Get integration settings
    const settingsResult = await client.query(`
      SELECT url, username, password, enabled
      FROM integration_settings 
      WHERE integration_type = '1c'
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    
    if (settingsResult.rows.length === 0 || !settingsResult.rows[0].enabled) {
      return NextResponse.json(
        { success: false, error: 'Интеграция с 1C не настроена или отключена' },
        { status: 400 }
      );
    }
    
    const settings = settingsResult.rows[0];
    
    // Export data to 1C
    const exportResult = await exportDataTo1C(settings.url, settings.username, settings.password);
    
    // Update integration status
    await client.query(`
      INSERT INTO integration_status (
        integration_type, 
        is_connected, 
        last_sync, 
        sync_status, 
        error_message, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (integration_type) 
      DO UPDATE SET 
        is_connected = EXCLUDED.is_connected,
        last_sync = EXCLUDED.last_sync,
        sync_status = EXCLUDED.sync_status,
        error_message = EXCLUDED.error_message,
        updated_at = NOW()
    `, [
      '1c', 
      exportResult.success, 
      exportResult.success ? new Date().toISOString() : null,
      exportResult.success ? 'success' : 'error',
      exportResult.success ? null : exportResult.error
    ]);
    
    return NextResponse.json(exportResult);
    
  } catch (error: any) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при экспорте данных' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function exportDataTo1C(url: string, username: string, password: string) {
  try {
    // Get data to export from database
    const dataToExport = await getDataForExport();
    
    // Create CommerceML XML for export
    const xmlData = createCommerceMLExport(dataToExport);
    
    // Send data to 1C
    const exportUrl = `${url}/hs/1c_exchange/import`;
    
    const response = await fetch(exportUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/xml'
      },
      body: xmlData,
      timeout: 60000
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const result = await response.text();
    
    return {
      success: true,
      message: 'Данные успешно экспортированы в 1C',
      exportedCount: dataToExport.orders.length + dataToExport.products.length
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: `Ошибка экспорта: ${error.message}`
    };
  }
}

async function getDataForExport() {
  // This would get data from your database for export
  // For now, return mock data
  return {
    orders: [
      {
        id: 'BP0000001',
        date: new Date().toISOString(),
        customer: 'Test Customer',
        total: 1000,
        items: [
          { productId: '1', name: 'Test Product', quantity: 2, price: 500 }
        ]
      }
    ],
    products: [
      {
        id: '1',
        name: 'Test Product',
        sku: 'TEST-001',
        price: 500,
        description: 'Test product description'
      }
    ]
  };
}

function createCommerceMLExport(data: any) {
  // Create CommerceML XML format for export
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<КоммерческаяИнформация ВерсияСхемы="2.05" ДатаФормирования="${new Date().toISOString()}">
  <Классификатор>
    <Ид>1</Ид>
    <Наименование>Классификатор товаров</Наименование>
  </Классификатор>
  
  <Каталог СодержитТолькоИзменения="false">
    <Ид>1</Ид>
    <ИдКлассификатора>1</ИдКлассификатора>
    <Наименование>Каталог товаров</Наименование>
    <Товары>
      ${data.products.map((product: any) => `
        <Товар>
          <Ид>${product.id}</Ид>
          <Наименование>${product.name}</Наименование>
          <Артикул>${product.sku}</Артикул>
          <Описание>${product.description}</Описание>
          <Цены>
            <Цена>
              <ИдТипаЦены>1</ИдТипаЦены>
              <ЦенаЗаЕдиницу>${product.price}</ЦенаЗаЕдиницу>
            </Цена>
          </Цены>
        </Товар>
      `).join('')}
    </Товары>
  </Каталог>
  
  <Документы>
    ${data.orders.map((order: any) => `
      <Документ>
        <Ид>${order.id}</Ид>
        <Номер>${order.id}</Номер>
        <Дата>${order.date}</Дата>
        <ХозОперация>Заказ товара</ХозОперация>
        <Роль>Продавец</Роль>
        <Сумма>${order.total}</Сумма>
        <Товары>
          ${order.items.map((item: any) => `
            <Товар>
              <ИдТовара>${item.productId}</ИдТовара>
              <Наименование>${item.name}</Наименование>
              <Количество>${item.quantity}</Количество>
              <ЦенаЗаЕдиницу>${item.price}</ЦенаЗаЕдиницу>
            </Товар>
          `).join('')}
        </Товары>
      </Документ>
    `).join('')}
  </Документы>
</КоммерческаяИнформация>`;
  
  return xml;
}
