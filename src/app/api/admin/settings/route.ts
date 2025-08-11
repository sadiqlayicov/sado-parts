import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool optimized for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
});

// Helper function to handle database errors
function handleDatabaseError(error: any, operation: string) {
  console.error(`${operation} error:`, error)
  
  if (error.message?.includes('Max client connections reached')) {
    return NextResponse.json(
      { success: false, error: 'Достигнут лимит подключений к базе данных. Пожалуйста, подождите немного.' },
      { status: 503 }
    )
  }
  
  return NextResponse.json(
    { success: false, error: `Database xətası: ${error.message}` },
    { status: 500 }
  )
}

// Helper function to create settings table if it doesn't exist
async function ensureSettingsTable(client: any) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(255) PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Settings table ensured');
  } catch (error) {
    console.error('Error creating settings table:', error);
    throw error;
  }
}

export async function GET() {
  let client;
  
  try {
    client = await pool.connect();

    // Ensure settings table exists
    await ensureSettingsTable(client);

    // Try to get settings directly
    const settingsResult = await client.query(`
      SELECT key, value FROM settings ORDER BY key
    `);

    const settings: { [key: string]: string } = {};
    settingsResult.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    // If no settings found, return default settings
    if (Object.keys(settings).length === 0) {
      const defaultSettings = {
        siteName: 'Sado-Parts',
        companyName: 'ООО "Спецтехника"',
        companyAddress: 'г. Москва, ул. Примерная, д. 123',
        inn: '7707083893',
        kpp: '770701001',
        bik: '044525225',
        accountNumber: '40702810123456789012',
        bankName: 'Сбербанк',
        bankBik: '044525225',
        bankAccountNumber: '30101810200000000225',
        directorName: 'Иванов И.И.',
        accountantName: 'Петрова П.П.'
      };

      return NextResponse.json({
        success: true,
        settings: defaultSettings
      });
    }

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error: any) {
    console.error('Get settings error:', error);
    return handleDatabaseError(error, 'GET /api/admin/settings');
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let client;
  
  try {
    console.log('POST /api/admin/settings called');
    
    const body = await request.json();
    console.log('Received body:', body);
    
    const { settings } = body;
    console.log('Received settings:', settings);

    if (!settings || typeof settings !== 'object') {
      console.error('Invalid settings data');
      return NextResponse.json(
        { error: 'Неверные данные настроек' },
        { status: 400 }
      );
    }

    // Test database connection first
    try {
      client = await pool.connect();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Test simple query first
    try {
      const testResult = await client.query('SELECT 1 as test');
      console.log('Test query successful:', testResult.rows);
    } catch (testError) {
      console.error('Test query failed:', testError);
      return NextResponse.json(
        { error: 'Database test query failed' },
        { status: 500 }
      );
    }

    // Ensure settings table exists
    try {
      await ensureSettingsTable(client);
      console.log('Settings table ensured');
    } catch (tableError) {
      console.error('Error ensuring settings table:', tableError);
      return NextResponse.json(
        { error: 'Ошибка создания таблицы настроек' },
        { status: 500 }
      );
    }

    // Update or insert settings
    for (const [key, value] of Object.entries(settings)) {
      const settingId = `setting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`Updating setting: ${key} = ${value}`);
      
      try {
        await client.query(`
          INSERT INTO settings (id, key, value, "updatedAt")
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            "updatedAt" = NOW()
        `, [settingId, key, value as string]);
        console.log(`Setting ${key} updated successfully`);
      } catch (queryError) {
        console.error(`Error updating setting ${key}:`, queryError);
        throw queryError;
      }
    }

    console.log('All settings updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Настройки успешно сохранены'
    });

  } catch (error: any) {
    console.error('Update settings error:', error);
    return handleDatabaseError(error, 'POST /api/admin/settings');
  } finally {
    if (client) {
      client.release();
      console.log('Database connection released');
    }
  }
}
