import { NextResponse } from 'next/server';
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

export async function GET() {
  let client;
  
  try {
    console.log('Test DB GET called');
    
    // Test database connection
    try {
      client = await pool.connect();
      console.log('Database connected successfully');
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError?.message || 'Unknown error' },
        { status: 500 }
      );
    }

    // Test simple query
    try {
      const testResult = await client.query('SELECT 1 as test');
      console.log('Test query successful:', testResult.rows);
    } catch (testError: any) {
      console.error('Test query failed:', testError);
      return NextResponse.json(
        { error: 'Database test query failed', details: testError?.message || 'Unknown error' },
        { status: 500 }
      );
    }

    // Test settings table
    let settingsResult;
    try {
      settingsResult = await client.query('SELECT COUNT(*) as count FROM settings');
      console.log('Settings table query successful:', settingsResult.rows);
    } catch (settingsError: any) {
      console.error('Settings table query failed:', settingsError);
      return NextResponse.json(
        { error: 'Settings table query failed', details: settingsError?.message || 'Unknown error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection and queries successful',
      settingsCount: settingsResult.rows[0].count
    });

  } catch (error: any) {
    console.error('Test DB error:', error);
    return NextResponse.json(
      { error: `Test DB error: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
      console.log('Database connection released');
    }
  }
}
