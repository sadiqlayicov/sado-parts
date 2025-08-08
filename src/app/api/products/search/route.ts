import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({
      success: true,
      products: []
    });
  }

  let client;
  
  try {
    client = await pool.connect();

    // Search in products table with multiple fields
    const searchQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.sale_price,
        p.sku,
        p.artikul,
        p.catalog_number,
        p.stock,
        p.images,
        p.is_active,
        p.is_featured,
        p.created_at,
        p.updated_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
        AND (
          LOWER(p.name) LIKE LOWER($1) OR
          LOWER(p.description) LIKE LOWER($1) OR
          LOWER(p.sku) LIKE LOWER($1) OR
          LOWER(p.artikul) LIKE LOWER($1) OR
          LOWER(p.catalog_number) LIKE LOWER($1) OR
          LOWER(c.name) LIKE LOWER($1)
        )
      ORDER BY 
        CASE 
          WHEN LOWER(p.name) LIKE LOWER($1) THEN 1
          WHEN LOWER(p.sku) LIKE LOWER($1) THEN 2
          WHEN LOWER(p.artikul) LIKE LOWER($1) THEN 3
          WHEN LOWER(p.catalog_number) LIKE LOWER($1) THEN 4
          ELSE 5
        END,
        p.is_featured DESC,
        p.created_at DESC
      LIMIT 10
    `;

    const searchTerm = `%${query.trim()}%`;
    const result = await client.query(searchQuery, [searchTerm]);

    const products = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      salePrice: row.sale_price ? parseFloat(row.sale_price) : null,
      sku: row.sku,
      artikul: row.artikul,
      catalogNumber: row.catalog_number,
      stock: parseInt(row.stock),
      images: row.images ? JSON.parse(row.images) : [],
      isActive: row.is_active,
      isFeatured: row.is_featured,
      categoryName: row.category_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return NextResponse.json({
      success: true,
      products,
      total: products.length
    });

  } catch (error: any) {
    console.error('Search error:', error);
    
    if (error.message?.includes('Max client connections reached')) {
      return NextResponse.json(
        { error: 'Достигнут лимит подключений к базе данных. Пожалуйста, подождите немного.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Ошибка при поиске товаров' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
