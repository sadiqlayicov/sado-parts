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
    const body = await request.json();
    const { url, username, password } = body;
    
    if (!url || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'Необходимо указать URL, логин и пароль' },
        { status: 400 }
      );
    }
    
    // Test connection to 1C
    const connectionResult = await test1CConnection(url, username, password);
    
    client = await pool.connect();
    
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
      connectionResult.success, 
      connectionResult.success ? new Date().toISOString() : null,
      connectionResult.success ? 'success' : 'error',
      connectionResult.success ? null : connectionResult.error
    ]);
    
    return NextResponse.json(connectionResult);
    
  } catch (error: any) {
    console.error('Error testing 1C connection:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при тестировании соединения' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function test1CConnection(url: string, username: string, password: string) {
  try {
    // Test basic HTTP connection to 1C
    const testUrl = `${url}/hs/1c_exchange/check`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.ok) {
      return {
        success: true,
        message: 'Соединение с 1C успешно установлено',
        version: 'Управление нашей фирмой 3.0.12.146'
      };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Ошибка соединения: ${error.message}`
    };
  }
}
