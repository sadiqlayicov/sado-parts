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
  try {
    console.log('GET /api/admin/settings called');
    
    // For now, return hardcoded settings to test the flow
    const hardcodedSettings = {
      siteName: 'Test-Site-Name',
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

    console.log('Returning hardcoded settings:', hardcodedSettings);

    return NextResponse.json({
      success: true,
      settings: hardcodedSettings
    });

  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: `Get settings error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/settings called');
    
    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    
    const { settings } = body;
    console.log('Received settings:', settings);

    if (!settings || typeof settings !== 'object') {
      console.error('Invalid settings data');
      return NextResponse.json(
        { success: false, error: 'Неверные данные настроек' },
        { status: 400 }
      );
    }

    // For now, just return success to test the flow
    console.log('Settings received successfully:', settings);
    
    return NextResponse.json({
      success: true,
      message: 'Настройки успешно сохранены (test mode)',
      receivedSettings: settings
    });

  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: `Update settings error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
