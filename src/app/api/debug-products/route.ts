import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    
    // Get first 5 products with their price info
    const result = await client.query(`
      SELECT id, name, price, "salePrice", "isActive", "isFeatured"
      FROM products 
      WHERE "isActive" = true
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);

    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      discountPercentage: row.salePrice ? Math.round((1 - parseFloat(row.salePrice) / parseFloat(row.price)) * 100) : 0
    }));

    return NextResponse.json({
      success: true,
      data: products,
      message: 'Debug product data'
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  } finally {
    await client.end();
  }
}
