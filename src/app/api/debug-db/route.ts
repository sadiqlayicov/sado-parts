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
    
    // Check if products table exists and get its structure
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return NextResponse.json({
        error: 'Products table does not exist'
      }, { status: 404 });
    }
    
    // Get table structure
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);
    
    // Get sample products
    const products = await client.query(`
      SELECT id, name, "categoryId", "isActive", "createdAt"
      FROM products 
      WHERE "isActive" = true
      LIMIT 3
    `);
    
    // Get categories
    const categories = await client.query(`
      SELECT id, name, "parentId"
      FROM categories
      LIMIT 5
    `);
    
    return NextResponse.json({
      success: true,
      tableExists: tableCheck.rows[0].exists,
      structure: structure.rows,
      products: products.rows,
      categories: categories.rows,
      productCount: products.rows.length,
      categoryCount: categories.rows.length
    });
    
  } catch (error: any) {
    console.error('Debug DB error:', error);
    return NextResponse.json(
      { error: 'Failed to debug database', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
