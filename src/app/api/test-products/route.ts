import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
});

export async function GET(request: NextRequest) {
  let client;
  
  try {
    client = await pool.connect();
    
    // Get a few products to see their ID format
    const result = await client.query(`
      SELECT id, name, "categoryId", "isActive"
      FROM products 
      WHERE "isActive" = true
      LIMIT 5
    `);
    
    return NextResponse.json({
      success: true,
      products: result.rows,
      count: result.rows.length
    });
    
  } catch (error: any) {
    console.error('Test products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test products', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
