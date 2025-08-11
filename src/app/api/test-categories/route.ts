import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Create a connection pool optimized for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
})

export async function GET(request: NextRequest) {
  let client;
  
  try {
    console.log('GET /api/test-categories called');
    
    client = await pool.connect();
    console.log('Database connected successfully');

    // Simple test query
    const result = await client.query('SELECT COUNT(*) as count FROM categories WHERE "isActive" = true');
    const count = result.rows[0].count;

    console.log(`Found ${count} active categories`);

    return NextResponse.json({
      success: true,
      count: parseInt(count),
      message: `${count} aktiv kateqoriya tapıldı`
    });
    
  } catch (error: any) {
    console.error('Database error in GET /api/test-categories:', error);
    
    if (error.message?.includes('relation "categories" does not exist')) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'Kateqoriyalar cədvəli mövcud deyil'
      });
    }
    
    return NextResponse.json(
      { success: false, error: `Database xətası: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
