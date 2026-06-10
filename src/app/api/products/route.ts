import { NextRequest } from 'next/server'
import { Pool } from 'pg'
import { successResponse, errorResponse, logError, ErrorMessages } from '@/lib/api-utils'

// Create a connection pool optimized for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3, // Increase connection limit for Supabase
  idleTimeoutMillis: 60000, // Increase idle timeout
  connectionTimeoutMillis: 5000, // Increase connection timeout
})

// Helper function to handle database errors
function handleDatabaseError(error: any, operation: string) {
  logError(operation, error)
  
  if (error.message?.includes('Max client connections reached')) {
    return errorResponse('Достигнут лимит подключений к базе данных. Пожалуйста, подождите немного.', 503)
  }
  
  return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
}

/**
 * GET - Get all products
 * Fetches all active products with their category information
 */
export async function GET(request: NextRequest) {
  let client;
  
  try {
    client = await pool.connect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    console.log('API called with categoryId:', categoryId);

    // Base query for products
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
        console.log('Processing categoryId:', categoryId);
        
        // First, check if the category exists
        const categoryExistsQuery = 'SELECT id, name FROM categories WHERE id = $1 AND "isActive" = true';
        const categoryExistsResult = await client.query(categoryExistsQuery, [categoryId]);
        
        if (categoryExistsResult.rows.length === 0) {
          console.log('Category not found or inactive:', categoryId);
          return successResponse([], '0 товаров найдено');
        }
        
        console.log('Found category:', categoryExistsResult.rows[0]);
        
        // Get all subcategory IDs for this category
        const subcategoriesQuery = 'SELECT id FROM categories WHERE "parentId" = $1 AND "isActive" = true';
        const subcategoriesResult = await client.query(subcategoriesQuery, [categoryId]);
        const subcategoryIds = subcategoriesResult.rows.map(row => row.id);
        
        console.log('Subcategory IDs found:', subcategoryIds);
        
        // Build the WHERE clause for category filtering
        if (subcategoryIds.length === 0) {
          // Only main category, no subcategories
          query += ` AND p."categoryId" = $1`;
          queryParams.push(categoryId);
        } else {
          // Main category + subcategories
          const allCategoryIds = [categoryId, ...subcategoryIds];
          
          // Create placeholders for the IN clause
          const placeholders = allCategoryIds.map((_, index) => `$${index + 1}`).join(', ');
          query += ` AND p."categoryId" IN (${placeholders})`;
          queryParams.push(...allCategoryIds);
        }
        
        console.log('Using category filter with IDs:', queryParams);
        
      } catch (error) {
        console.error('Error in category filtering for categoryId', categoryId, '- falling back to simple filter:', error instanceof Error ? error.message : error);
        query += ` AND p."categoryId" = $1`;
        queryParams.push(categoryId);
      }
    }
    
    query += ` ORDER BY p."createdAt" DESC`;

    console.log('Final query:', query);
    console.log('Query parameters:', queryParams);

    // Get products with categories
    const productsResult = await client.query(query, queryParams)

    // Transform the data to match the expected format
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
    }))

    console.log(`Found ${products.length} products`);

    return successResponse(products, `${products.length} товаров найдено`)
  } catch (error: any) {
    console.error('Error in GET /api/products:', error);
    return handleDatabaseError(error, 'GET /api/products')
  } finally {
    if (client) {
      client.release()
    }
  }
}

/**
 * POST - Create new product
 * Creates a new product with validation
 */
export async function POST(request: NextRequest) {
  let client;
  
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

    client = await pool.connect();

    // Create product
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
    ])

    return successResponse(result.rows[0], 'Məhsul uğurla yaradıldı')
  } catch (error: any) {
    return handleDatabaseError(error, 'POST /api/products')
  } finally {
    if (client) {
      client.release()
    }
  }
} 