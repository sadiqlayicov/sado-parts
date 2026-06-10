import { NextRequest } from 'next/server'
import { successResponse, errorResponse, ErrorMessages } from '@/lib/api-utils'
import { withConnection } from '@/lib/db'

/**
 * GET - Get all products
 * Fetches all active products with their category information
 */
export async function GET(request: NextRequest) {
  return withConnection(async (client) => {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p."salePrice",
        p.sku,
        p.stock,
        p.images,
        p."isActive",
        p."isFeatured",
        p.artikul,
        p."catalogNumber",
        p."createdAt",
        p."updatedAt",
        p."categoryId",
        c.name as category_name,
        c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."isActive" = true
    `;

    const queryParams: any[] = [];

    if (categoryId) {
      try {
        const categoryExistsQuery = 'SELECT id, name FROM categories WHERE id = $1 AND "isActive" = true';
        const categoryExistsResult = await client.query(categoryExistsQuery, [categoryId]);

        if (categoryExistsResult.rows.length === 0) {
          return successResponse([], '0 товаров найдено');
        }

        const subcategoriesQuery = 'SELECT id FROM categories WHERE "parentId" = $1 AND "isActive" = true';
        const subcategoriesResult = await client.query(subcategoriesQuery, [categoryId]);
        const subcategoryIds = subcategoriesResult.rows.map(row => row.id);

        if (subcategoryIds.length === 0) {
          query += ` AND p."categoryId" = $1`;
          queryParams.push(categoryId);
        } else {
          const allCategoryIds = [categoryId, ...subcategoryIds];
          const placeholders = allCategoryIds.map((_, index) => `$${index + 1}`).join(', ');
          query += ` AND p."categoryId" IN (${placeholders})`;
          queryParams.push(...allCategoryIds);
        }
      } catch (error) {
        console.error('Error in category filtering:', error);
        query += ` AND p."categoryId" = $1`;
        queryParams.push(categoryId);
      }
    }

    query += ` ORDER BY p."createdAt" DESC`;

    const productsResult = await client.query(query, queryParams);

    const products = productsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      salePrice: row.salePrice ? parseFloat(row.salePrice) : null,
      sku: row.sku,
      stock: parseInt(row.stock),
      images: row.images || [],
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      artikul: row.artikul,
      catalogNumber: row.catalogNumber,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      categoryId: row.categoryId,
      category: row.category_name ? {
        id: row.categoryId,
        name: row.category_name,
        description: row.category_description
      } : null
    }));

    return successResponse(products, `${products.length} товаров найдено`);
  }, 'GET /api/products');
}

/**
 * POST - Create new product
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, price, salePrice, sku, stock, images, categoryId, isActive, isFeatured, artikul, catalogNumber } = body;

  if (!name) {
    return errorResponse(ErrorMessages.REQUIRED_FIELD('Məhsul adı'), 400);
  }

  if (!price || isNaN(parseFloat(price))) {
    return errorResponse(ErrorMessages.REQUIRED_FIELD('Qiymət'), 400);
  }

  return withConnection(async (client) => {
    const result = await client.query(`
      INSERT INTO products (
        name, description, price, "salePrice", sku, stock, images, 
        "categoryId", "isActive", "isFeatured", artikul, "catalogNumber"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      name, description, parseFloat(price), salePrice ? parseFloat(salePrice) : null,
      sku, stock || 0, images || [], categoryId, isActive !== false, isFeatured || false,
      artikul, catalogNumber
    ]);

    return successResponse(result.rows[0], 'Məhsul uğurla yaradıldı');
  }, 'POST /api/products');
}
