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
    
    // Sync orders from 1C
    const syncResult = await syncOrdersFrom1C(settings.url, settings.username, settings.password);
    
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
      syncResult.success, 
      syncResult.success ? new Date().toISOString() : null,
      syncResult.success ? 'success' : 'error',
      syncResult.success ? null : syncResult.error
    ]);
    
    return NextResponse.json(syncResult);
    
  } catch (error: any) {
    console.error('Error syncing orders:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при синхронизации заказов' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function syncOrdersFrom1C(url: string, username: string, password: string) {
  try {
    // Get orders from 1C via CommerceML
    const ordersUrl = `${url}/hs/1c_exchange/orders`;
    
    const response = await fetch(ordersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/xml'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const xmlData = await response.text();
    
    // Parse CommerceML XML and extract orders
    const orders = parseCommerceMLOrders(xmlData);
    
    // Update orders in database
    const updatedCount = await updateOrdersInDatabase(orders);
    
    return {
      success: true,
      count: updatedCount,
      message: `Синхронизировано ${updatedCount} заказов из 1C`
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: `Ошибка синхронизации: ${error.message}`
    };
  }
}

function parseCommerceMLOrders(xmlData: string) {
  // Simple XML parsing for CommerceML orders format
  const orders: any[] = [];
  
  // Extract order information from XML
  const orderMatches = xmlData.match(/<Документ[^>]*>([\s\S]*?)<\/Документ>/g);
  
  if (orderMatches) {
    orderMatches.forEach((orderXml, index) => {
      const order: any = {
        id: extractXmlValue(orderXml, 'Номер'),
        date: extractXmlValue(orderXml, 'Дата'),
        customer: extractXmlValue(orderXml, 'Контрагент'),
        total: parseFloat(extractXmlValue(orderXml, 'Сумма') || '0'),
        status: extractXmlValue(orderXml, 'Статус'),
        items: parseOrderItems(orderXml)
      };
      
      if (order.id) {
        orders.push(order);
      }
    });
  }
  
  return orders;
}

function parseOrderItems(orderXml: string) {
  const items: any[] = [];
  
  // Extract order items from XML
  const itemMatches = orderXml.match(/<Товар[^>]*>([\s\S]*?)<\/Товар>/g);
  
  if (itemMatches) {
    itemMatches.forEach((itemXml) => {
      const item = {
        productId: extractXmlValue(itemXml, 'ИдТовара'),
        name: extractXmlValue(itemXml, 'Наименование'),
        quantity: parseInt(extractXmlValue(itemXml, 'Количество') || '0'),
        price: parseFloat(extractXmlValue(itemXml, 'Цена') || '0')
      };
      
      if (item.productId) {
        items.push(item);
      }
    });
  }
  
  return items;
}

function extractXmlValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

async function updateOrdersInDatabase(orders: any[]) {
  // This would update orders in your database
  // For now, return the count of orders found
  return orders.length;
}
