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
    console.log('Testing upload flow...');
    
    const client = await pool.connect();
    
    // Son əlavə edilən məhsulları yoxla
    const result = await client.query(`
      SELECT id, name, images 
      FROM products 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    client.release();
    
    console.log('Recent products with images:', result.rows);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      message: 'Upload flow test completed'
    });
    
  } catch (error: any) {
    console.error('Upload flow test error:', error);
    return NextResponse.json({
      success: false,
      error: `Test failed: ${error.message}`
    }, { status: 500 });
  }
}
