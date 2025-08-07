import { NextRequest } from 'next/server'
import { Client } from 'pg'
import { successResponse, errorResponse, logError, ErrorMessages } from '@/lib/api-utils'

/**
 * GET - Get all products
 * Fetches all active products with their category information
 */
export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    await client.connect()

    // Get products with categories
    const productsResult = await client.query(`
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
      ORDER BY p."createdAt" DESC
    `)

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

    return successResponse(products, `${products.length} məhsul tapıldı`)
  } catch (error) {
    logError('GET /api/products', error)
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
  } finally {
    await client.end()
  }
}

/**
 * POST - Create new product
 * Creates a new product with validation
 */
export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    const body = await request.json()
    const { name, description, price, salePrice, sku, stock, images, categoryId, isActive, isFeatured, artikul, catalogNumber } = body

    // Validation
    if (!name) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Məhsul adı'), 400)
    }

    if (!price || isNaN(parseFloat(price))) {
      return errorResponse(ErrorMessages.INVALID_PRICE, 400)
    }

    await client.connect()

    const imagesArray = images ? (Array.isArray(images) ? images : [images]) : []
    
    const result = await client.query(`
      INSERT INTO products (
        id, name, description, price, "salePrice", sku, stock, images, 
        "categoryId", "isActive", "isFeatured", artikul, "catalogNumber"
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      name,
      description,
      parseFloat(price),
      salePrice ? parseFloat(salePrice) : null,
      sku,
      parseInt(stock) || 0,
      imagesArray,
      categoryId,
      isActive !== undefined ? isActive : true,
      isFeatured !== undefined ? isFeatured : false,
      artikul || null,
      catalogNumber || null
    ])

    const product = result.rows[0]

    return successResponse(
      { ...product, images: imagesArray },
      'Məhsul uğurla əlavə olundu',
      201
    )
  } catch (error) {
    logError('POST /api/products', error)
    return errorResponse(ErrorMessages.CREATION_FAILED('məhsul'), 500)
  } finally {
    await client.end()
  }
} 