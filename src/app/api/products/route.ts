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
      try {
        // First, check if the category exists
        const categoryExistsQuery = 'SELECT id, name FROM categories WHERE id = $1 AND "isActive" = true';
        const categoryExistsResult = await client.query(categoryExistsQuery, [categoryId]);
        
        if (categoryExistsResult.rows.length === 0) {
          console.log('Category not found or inactive:', categoryId);
          return successResponse([], '0 товаров найдено');
        }
        
        console.log('Found category:', categoryExistsResult.rows[0]);
        
        // First, get all subcategory IDs for the given category
        const subcategoriesQuery = `
          WITH RECURSIVE cat_tree AS (
            SELECT id, name, "parentId", 0 as level 
            FROM categories 
            WHERE id = $1 AND "isActive" = true
            UNION ALL
            SELECT c.id, c.name, c."parentId", ct.level + 1 
            FROM categories c
            INNER JOIN cat_tree ct ON c."parentId" = ct.id
            WHERE c."isActive" = true AND ct.level < 10
          )
          SELECT id, name, level FROM cat_tree
        `;
        
        const subcategoriesResult = await client.query(subcategoriesQuery, [categoryId]);
        const categoryIds = subcategoriesResult.rows.map(row => row.id);
        
        console.log('Category tree:', subcategoriesResult.rows);
        console.log('Category IDs to search:', categoryIds);
        
        // If no categories found, return empty result
        if (categoryIds.length === 0) {
          console.log('No categories found for ID:', categoryId);
          return successResponse([], '0 товаров найдено');
        }
        
        // Build the main query with the collected category IDs
        const placeholders = categoryIds.map((_, index) => `$${index + 2}`).join(',');
        query = `
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
          WHERE p."isActive" = true AND p."categoryId" IN (${placeholders})
        `;
        
        queryParams.push(...categoryIds);
        
        // Debug: Log products by category
        for (const catId of categoryIds) {
          const catNameQuery = 'SELECT name FROM categories WHERE id = $1';
          const catNameResult = await client.query(catNameQuery, [catId]);
          const catName = catNameResult.rows[0]?.name || 'Unknown';
          
          const productCountQuery = 'SELECT COUNT(*) as count FROM products WHERE "categoryId" = $1 AND "isActive" = true';
          const productCountResult = await client.query(productCountQuery, [catId]);
          const productCount = productCountResult.rows[0]?.count || 0;
          
          console.log(`Category "${catName}" (ID: ${catId}): ${productCount} products`);
        }
      } catch (error) {
        console.error('Error in category filtering:', error);
        // Fallback to simple category filtering
        query = `
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
          WHERE p."isActive" = true AND p."categoryId" = $1
        `;
        queryParams.push(categoryId);
      }
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