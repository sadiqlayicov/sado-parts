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
    
    // Test database connection first
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('Database connection successful');
    
    try {
      // Test if we can query the database
      console.log('Testing basic query...');
      const testResult = await client.query('SELECT 1 as test');
      console.log('Basic query successful:', testResult.rows);
      
      // Try to create settings table
      console.log('Creating settings table...');
      await ensureSettingsTable(client);
      console.log('Settings table created/ensured');
      
      // Get all settings from database
      console.log('Querying settings...');
      const result = await client.query('SELECT key, value FROM settings');
      console.log('Database settings result:', result.rows);
      
      // Convert to settings object
      const settings: any = {};
      result.rows.forEach(row => {
        settings[row.key] = row.value;
      });
      
      console.log('Retrieved settings from database:', settings);
      
      return NextResponse.json({
        success: true,
        settings: settings
      });
      
    } finally {
      client.release();
      console.log('Database client released');
    }

  } catch (error: any) {
    console.error('Get settings error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      { 
        success: false, 
        error: `Get settings error: ${error.message}`,
        details: error.stack
      },
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

    // Connect to database and save settings
    const client = await pool.connect();
    try {
      // Ensure settings table exists
      await ensureSettingsTable(client);
      
      // Save each setting to database
      for (const [key, value] of Object.entries(settings)) {
        console.log(`Saving setting: ${key} = ${value}`);
        
        await client.query(`
          INSERT INTO settings (id, key, value, "updatedAt") 
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (key) 
          DO UPDATE SET value = $3, "updatedAt" = NOW()
        `, [`setting_${key}`, key, value]);
      }
      
      console.log('Settings saved successfully to database');
      
      return NextResponse.json({
        success: true,
        message: 'Настройки успешно сохранены',
        savedSettings: settings
      });
      
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Update settings error:', error);
    return handleDatabaseError(error, 'Update settings');
  }
}
