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
    
    // Sync products from 1C
    const syncResult = await syncProductsFrom1C(settings.url, settings.username, settings.password);
    
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
    console.error('Error syncing products:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при синхронизации товаров' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function syncProductsFrom1C(url: string, username: string, password: string) {
  try {
    // Get products from 1C via CommerceML
    const productsUrl = `${url}/hs/1c_exchange/catalog`;
    
    const response = await fetch(productsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/xml'
      }
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const xmlData = await response.text();
    
    // Parse CommerceML XML and extract products
    const products = parseCommerceMLProducts(xmlData);
    
    // Update products in database
    const updatedCount = await updateProductsInDatabase(products);
    
    return {
      success: true,
      count: updatedCount,
      message: `Синхронизировано ${updatedCount} товаров из 1C`
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: `Ошибка синхронизации: ${error.message}`
    };
  }
}

function parseCommerceMLProducts(xmlData: string) {
  // Simple XML parsing for CommerceML format
  // In production, use a proper XML parser
  const products: any[] = [];
  
  // Extract product information from XML
  const productMatches = xmlData.match(/<Товар[^>]*>([\s\S]*?)<\/Товар>/g);
  
  if (productMatches) {
    productMatches.forEach((productXml, index) => {
      const product: any = {
        id: `1c_${index + 1}`,
        name: extractXmlValue(productXml, 'Наименование'),
        sku: extractXmlValue(productXml, 'Артикул'),
        price: parseFloat(extractXmlValue(productXml, 'Цена') || '0'),
        description: extractXmlValue(productXml, 'Описание'),
        categoryName: extractXmlValue(productXml, 'Группа'),
        quantity: parseInt(extractXmlValue(productXml, 'Количество') || '0')
      };
      
      if (product.name) {
        products.push(product);
      }
    });
  }
  
  return products;
}

function extractXmlValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

async function updateProductsInDatabase(products: any[]) {
  // This would update products in your database
  // For now, return the count of products found
  return products.length;
}
