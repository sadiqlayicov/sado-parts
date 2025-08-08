import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function GET() {
  let client;
  
  try {
    client = await pool.connect();

    // Check if settings table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'settings'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Settings table does not exist, creating...');
      await client.query(`
        CREATE TABLE settings (
          id VARCHAR(255) PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          value TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default settings
      const defaultSettings = [
        { key: 'siteName', value: 'Sado-Parts' },
        { key: 'companyName', value: 'ООО "Спецтехника"' },
        { key: 'companyAddress', value: 'г. Москва, ул. Примерная, д. 123' },
        { key: 'inn', value: '7707083893' },
        { key: 'kpp', value: '770701001' },
        { key: 'bik', value: '044525225' },
        { key: 'accountNumber', value: '40702810123456789012' },
        { key: 'bankName', value: 'Сбербанк' },
        { key: 'bankBik', value: '044525225' },
        { key: 'bankAccountNumber', value: '30101810200000000225' },
        { key: 'directorName', value: 'Иванов И.И.' },
        { key: 'accountantName', value: 'Петрова П.П.' }
      ];

      for (const setting of defaultSettings) {
        await client.query(`
          INSERT INTO settings (id, key, value)
          VALUES ($1, $2, $3)
        `, [`setting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, setting.key, setting.value]);
      }
      
      console.log('Settings table created with default values');
    }

    // Get all settings
    const result = await client.query(`
      SELECT key, value FROM settings
      ORDER BY key
    `);

    const settings: { [key: string]: string } = {};
    result.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error: any) {
    console.error('Get settings error:', error);
    
    if (error.message?.includes('Max client connections reached')) {
      return NextResponse.json(
        { error: 'Достигнут лимит подключений к базе данных. Пожалуйста, подождите немного.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Не удалось получить настройки' },
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
    const { settings } = await request.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Неверные данные настроек' },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Check if settings table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'settings'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating settings table...');
      await client.query(`
        CREATE TABLE settings (
          id VARCHAR(255) PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          value TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Update or insert settings
    for (const [key, value] of Object.entries(settings)) {
      const settingId = `setting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await client.query(`
        INSERT INTO settings (id, key, value)
        VALUES ($1, $2, $3)
        ON CONFLICT (key) 
        DO UPDATE SET 
          value = EXCLUDED.value,
          "updatedAt" = CURRENT_TIMESTAMP
      `, [settingId, key, value as string]);
    }

    console.log('Settings updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Настройки успешно сохранены'
    });

  } catch (error: any) {
    console.error('Update settings error:', error);
    
    if (error.message?.includes('Max client connections reached')) {
      return NextResponse.json(
        { error: 'Достигнут лимит подключений к базе данных. Пожалуйста, подождите немного.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Не удалось сохранить настройки' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
