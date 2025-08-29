import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function GET(request: NextRequest) {
  let client: any;
  
  try {
    client = await pool.connect();
    
    // Get integration status from database
    const result = await client.query(`
      SELECT 
        is_connected,
        last_sync,
        sync_status,
        error_message
      FROM integration_status 
      WHERE integration_type = '1c'
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const status = result.rows[0];
      return NextResponse.json({
        isConnected: status.is_connected,
        lastSync: status.last_sync,
        syncStatus: status.sync_status || 'idle',
        errorMessage: status.error_message
      });
    } else {
      // Return default status if no record exists
      return NextResponse.json({
        isConnected: false,
        lastSync: null,
        syncStatus: 'idle',
        errorMessage: null
      });
    }
    
  } catch (error: any) {
    console.error('Error getting integration status:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статуса интеграции' },
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
    const body = await request.json();
    const { isConnected, lastSync, syncStatus, errorMessage } = body;
    
    client = await pool.connect();
    
    // Update or insert integration status
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
    `, ['1c', isConnected, lastSync, syncStatus, errorMessage]);
    
    return NextResponse.json({
      success: true,
      message: 'Статус интеграции обновлен'
    });
    
  } catch (error: any) {
    console.error('Error updating integration status:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении статуса интеграции' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
