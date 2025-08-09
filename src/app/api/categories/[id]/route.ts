import { NextRequest } from 'next/server'
import { Pool } from 'pg'
import { successResponse, errorResponse, logError, ErrorMessages } from '@/lib/api-utils'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 2, // Limit connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

/**
 * GET - Get single category by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let client;
  
  try {
    const { id } = params;
    
    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya ID'), 400)
    }

    client = await pool.connect();

    const result = await client.query(`
      SELECT id, name, description, "isActive", "createdAt", "updatedAt"
      FROM categories
      WHERE id = $1
    `, [id])

    if (result.rows.length === 0) {
      return errorResponse(ErrorMessages.NOT_FOUND('Kateqoriya'), 404)
    }

    return successResponse(result.rows[0], 'Kateqoriya tapıldı')
  } catch (error: any) {
    logError('GET /api/categories/[id]', error)
    
    if (error.message?.includes('Max client connections reached')) {
      return errorResponse('Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.', 503)
    }
    
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
  } finally {
    if (client) {
      client.release()
    }
  }
}

/**
 * PUT - Update category by ID
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let client;
  
  try {
    const { id } = params;
    const body = await request.json()
    const { name, description, isActive } = body

    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya ID'), 400)
    }

    if (!name) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya adı'), 400)
    }

    client = await pool.connect();

    const result = await client.query(`
      UPDATE categories 
      SET 
        name = $1, 
        description = $2, 
        "isActive" = $3,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [name, description || '', isActive !== false, id])

    if (result.rows.length === 0) {
      return errorResponse(ErrorMessages.NOT_FOUND('Kateqoriya'), 404)
    }

    return successResponse(result.rows[0], 'Kateqoriya uğurla yeniləndi')
  } catch (error: any) {
    logError('PUT /api/categories/[id]', error)
    
    if (error.message?.includes('Max client connections reached')) {
      return errorResponse('Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.', 503)
    }
    
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
  } finally {
    if (client) {
      client.release()
    }
  }
}

/**
 * DELETE - Delete category by ID (soft delete by setting isActive to false)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let client;
  
  try {
    const { id } = params;

    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya ID'), 400)
    }

    client = await pool.connect();

    // Check if category has products
    const productsResult = await client.query(`
      SELECT COUNT(*) as count FROM products WHERE "categoryId" = $1 AND "isActive" = true
    `, [id])

    const productCount = parseInt(productsResult.rows[0].count)
    
    if (productCount > 0) {
      return errorResponse(`Bu kateqoriyada ${productCount} məhsul var. Əvvəlcə məhsulları başqa kateqoriyaya köçürün və ya silin.`, 400)
    }

    // Soft delete - set isActive to false
    const result = await client.query(`
      UPDATE categories 
      SET 
        "isActive" = false,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return errorResponse(ErrorMessages.NOT_FOUND('Kateqoriya'), 404)
    }

    return successResponse(result.rows[0], 'Kateqoriya uğurla silindi')
  } catch (error: any) {
    logError('DELETE /api/categories/[id]', error)
    
    if (error.message?.includes('Max client connections reached')) {
      return errorResponse('Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.', 503)
    }
    
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
  } finally {
    if (client) {
      client.release()
    }
  }
}