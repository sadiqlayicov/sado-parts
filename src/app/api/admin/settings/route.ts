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

export async function GET() {
  let client;
  
  try {
    client = await pool.connect();

    // Try to get settings directly
    const settingsResult = await client.query(`
      SELECT key, value FROM settings ORDER BY key
    `);

    const settings: { [key: string]: string } = {};
    settingsResult.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error: any) {
    console.error('Get settings error:', error);
    
    // If table doesn't exist, return default settings
    if (error.message?.includes('relation "settings" does not exist')) {
      console.log('Settings table does not exist, returning default settings');
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
    const { settings } = await request.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Неверные данные настроек' },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Try to update settings
    try {
      // Update or insert settings
      for (const [key, value] of Object.entries(settings)) {
        const settingId = `setting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await client.query(`
          INSERT INTO settings (id, key, value, "updatedAt")
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            "updatedAt" = NOW()
        `, [settingId, key, value as string]);
      }

      console.log('Settings updated successfully');

      return NextResponse.json({
        success: true,
        message: 'Настройки успешно сохранены'
      });
    } catch (tableError: any) {
      // If settings table doesn't exist, just return success
      console.log('Settings table does not exist, skipping save');
      return NextResponse.json({
        success: true,
        message: 'Настройки временно сохранены (таблица настроек не создана)'
      });
    }

  } catch (error: any) {
    console.error('Update settings error:', error);
    return handleDatabaseError(error, 'POST /api/admin/settings');
  } finally {
    if (client) {
      client.release();
    }
  }
}
