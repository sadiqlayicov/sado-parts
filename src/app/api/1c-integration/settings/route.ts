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
    
    // Get integration settings from database
    const result = await client.query(`
      SELECT 
        url,
        username,
        password,
        enabled
      FROM integration_settings 
      WHERE integration_type = '1c'
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const settings = result.rows[0];
      return NextResponse.json({
        url: settings.url,
        username: settings.username,
        password: settings.password,
        enabled: settings.enabled
      });
    } else {
      // Return default settings if no record exists
      return NextResponse.json({
        url: '',
        username: '',
        password: '',
        enabled: false
      });
    }
    
  } catch (error: any) {
    console.error('Error getting integration settings:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении настроек интеграции' },
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
    const { url, username, password, enabled } = body;
    
    client = await pool.connect();
    
    // Update or insert integration settings
    await client.query(`
      INSERT INTO integration_settings (
        integration_type, 
        url, 
        username, 
        password, 
        enabled, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (integration_type) 
      DO UPDATE SET 
        url = EXCLUDED.url,
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        enabled = EXCLUDED.enabled,
        updated_at = NOW()
    `, ['1c', url, username, password, enabled]);
    
    return NextResponse.json({
      success: true,
      message: 'Настройки интеграции сохранены'
    });
    
  } catch (error: any) {
    console.error('Error updating integration settings:', error);
    return NextResponse.json(
      { error: 'Ошибка при сохранении настроек интеграции' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
