import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ success: true, products: [] });
  }

  return withConnection(async (client) => {
    const searchQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p."salePrice",
        p.sku,
        p.artikul,
        p."catalogNumber",
        p.stock,
        p.images,
        p."isActive",
        p."isFeatured",
        p."createdAt",
        p."updatedAt",
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."isActive" = true
        AND (
          LOWER(p.name) LIKE LOWER($1) OR
          LOWER(p.description) LIKE LOWER($1) OR
          LOWER(p.sku) LIKE LOWER($1) OR
          LOWER(p.artikul) LIKE LOWER($1) OR
          LOWER(p."catalogNumber") LIKE LOWER($1) OR
          LOWER(c.name) LIKE LOWER($1)
        )
      ORDER BY 
        CASE 
          WHEN LOWER(p.name) LIKE LOWER($1) THEN 1
          WHEN LOWER(p.sku) LIKE LOWER($1) THEN 2
          WHEN LOWER(p.artikul) LIKE LOWER($1) THEN 3
          WHEN LOWER(p."catalogNumber") LIKE LOWER($1) THEN 4
          ELSE 5
        END,
        p."isFeatured" DESC,
        p."createdAt" DESC
      LIMIT 10
    `;

    const searchTerm = `%${query.trim()}%`;
    const result = await client.query(searchQuery, [searchTerm]);

    const products = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
      sku: row.sku,
      artikul: row.artikul,
      catalogNumber: row.catalogNumber,
      stock: parseInt(row.stock),
      images: row.images ? JSON.parse(row.images) : [],
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      categoryName: row.category_name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    return NextResponse.json({
      success: true,
      products,
      total: products.length
    });
  }, 'GET /api/products/search');
}
