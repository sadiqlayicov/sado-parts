import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function GET() {
  try {
    console.log('Testing product images...');
    
    const client = await pool.connect();
    
    // Məhsulları və onların şəkillərini al
    const result = await client.query(`
      SELECT id, name, images 
      FROM products 
      WHERE images IS NOT NULL 
      LIMIT 5
    `);
    
    client.release();
    
    console.log('Products with images:', result.rows);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      message: 'Product images test completed'
    });
    
  } catch (error: any) {
    console.error('Test product images error:', error);
    return NextResponse.json(
      { error: `Test error: ${error.message}` },
      { status: 500 }
    );
  }
}
