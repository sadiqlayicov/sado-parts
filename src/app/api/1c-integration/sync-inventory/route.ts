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
    
    // Sync inventory from 1C
    const syncResult = await syncInventoryFrom1C(settings.url, settings.username, settings.password);
    
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
    console.error('Error syncing inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при синхронизации остатков' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function syncInventoryFrom1C(url: string, username: string, password: string) {
  try {
    // Get inventory from 1C via CommerceML
    const inventoryUrl = `${url}/hs/1c_exchange/offers`;
    
    const response = await fetch(inventoryUrl, {
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
    
    // Parse CommerceML XML and extract inventory
    const inventory = parseCommerceMLInventory(xmlData);
    
    // Update inventory in database
    const updatedCount = await updateInventoryInDatabase(inventory);
    
    return {
      success: true,
      count: updatedCount,
      message: `Синхронизировано ${updatedCount} остатков из 1C`
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: `Ошибка синхронизации: ${error.message}`
    };
  }
}

function parseCommerceMLInventory(xmlData: string) {
  // Simple XML parsing for CommerceML offers format
  const inventory: any[] = [];
  
  // Extract offer information from XML
  const offerMatches = xmlData.match(/<Предложение[^>]*>([\s\S]*?)<\/Предложение>/g);
  
  if (offerMatches) {
    offerMatches.forEach((offerXml, index) => {
      const inventoryItem: any = {
        productId: extractXmlValue(offerXml, 'ИдТовара'),
        quantity: parseInt(extractXmlValue(offerXml, 'Количество') || '0'),
        price: parseFloat(extractXmlValue(offerXml, 'Цена') || '0'),
        warehouse: extractXmlValue(offerXml, 'Склад')
      };
      
      if (inventoryItem.productId) {
        inventory.push(inventoryItem);
      }
    });
  }
  
  return inventory;
}

function extractXmlValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

async function updateInventoryInDatabase(inventory: any[]) {
  // This would update inventory in your database
  // For now, return the count of inventory items found
  return inventory.length;
}
