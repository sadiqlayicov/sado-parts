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
    // Add caching headers
    const response = new Response();
    response.headers.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    response.headers.set('Vary', 'Accept-Encoding');
    
    client = await pool.connect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    // Build query based on filters
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
    
    const queryParams = [];
    let paramCount = 1;
    
    if (categoryId) {
      // Include products in the requested category and all its subcategories
      // Build a recursive CTE to collect descendant category IDs
      query = `
        WITH RECURSIVE cat_tree AS (
          -- Base case: the selected category
          SELECT id, name, "parentId", 0 as level FROM categories WHERE id = $${paramCount}
          UNION ALL
          -- Recursive case: all subcategories
          SELECT c.id, c.name, c."parentId", ct.level + 1 
          FROM categories c
          INNER JOIN cat_tree ct ON c."parentId" = ct.id
          WHERE c."isActive" = true
        )
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
        WHERE p."isActive" = true AND p."categoryId" IN (SELECT id FROM cat_tree)
      `;
      queryParams.push(categoryId);
      paramCount++;
      
      // Debug: Log the category tree
      const debugQuery = `
        WITH RECURSIVE cat_tree AS (
          SELECT id, name, "parentId", 0 as level FROM categories WHERE id = $1
          UNION ALL
          SELECT c.id, c.name, c."parentId", ct.level + 1 
          FROM categories c
          INNER JOIN cat_tree ct ON c."parentId" = ct.id
          WHERE c."isActive" = true
        )
        SELECT * FROM cat_tree ORDER BY level, name
      `;
      const debugResult = await client.query(debugQuery, [categoryId]);
      console.log('Category tree for ID', categoryId, ':', debugResult.rows);
      
      // Debug: Log products count by category
      const productsByCategoryQuery = `
        WITH RECURSIVE cat_tree AS (
          SELECT id, name, "parentId", 0 as level FROM categories WHERE id = $1
          UNION ALL
          SELECT c.id, c.name, c."parentId", ct.level + 1 
          FROM categories c
          INNER JOIN cat_tree ct ON c."parentId" = ct.id
          WHERE c."isActive" = true
        )
        SELECT c.name as category_name, COUNT(p.id) as product_count
        FROM cat_tree ct
        LEFT JOIN categories c ON ct.id = c.id
        LEFT JOIN products p ON c.id = p."categoryId" AND p."isActive" = true
        GROUP BY c.name, ct.level
        ORDER BY ct.level, c.name
      `;
      const productsByCategoryResult = await client.query(productsByCategoryQuery, [categoryId]);
      console.log('Products by category for ID', categoryId, ':', productsByCategoryResult.rows);
    }
    
    query += ` ORDER BY p."createdAt" DESC`;

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

    return successResponse(products, `${products.length} товаров найдено`)
  } catch (error: any) {
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