import { NextRequest } from 'next/server'
import { successResponse, errorResponse, logError, ErrorMessages } from '@/lib/api-utils'
import { getProductsWithPagination, query, clearCache } from '@/lib/database'

/**
 * GET - Get products with pagination and caching
 * Fetches products with optimized database queries and caching
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return errorResponse('Invalid pagination parameters', 400);
    }

    // Get products with pagination and caching
    const result = await getProductsWithPagination(page, limit, categoryId || undefined, search || undefined);

    return successResponse(result, `${result.products.length} товаров найдено`);
  } catch (error: any) {
    logError('GET /api/products', error);
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
  }
}

/**
 * POST - Create new product
 * Creates a new product with validation and cache invalidation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, salePrice, sku, stock, images, categoryId, isActive, isFeatured, artikul, catalogNumber } = body

    // Validation
    if (!name) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Məhsul adı'), 400)
    }

    if (!price || isNaN(parseFloat(price))) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Qiymət'), 400)
    }

    // Create product
    const result = await query(`
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

    // Clear product cache after creation
    clearCache('products');

    return successResponse(result.rows[0], 'Məhsul uğurla yaradıldı')
  } catch (error: any) {
    logError('POST /api/products', error);
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
  }
} 