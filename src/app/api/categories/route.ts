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
 * GET - Get all categories
 * Fetches all active categories
 */
export async function GET(request: NextRequest) {
  let client;
  
  try {
    client = await pool.connect();

    const result = await client.query(`
      SELECT id, name, description, "isActive", "createdAt", "updatedAt"
      FROM categories
      WHERE "isActive" = true
      ORDER BY name ASC
    `)

    return successResponse(result.rows, `${result.rows.length} kateqoriya tapıldı`)
  } catch (error) {
    logError('GET /api/categories', error)
    
    if (error.message.includes('Max client connections reached')) {
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
 * POST - Create new category
 * Creates a new category with validation
 */
export async function POST(request: NextRequest) {
  let client;
  
  try {
    const body = await request.json()
    const { name, description, isActive } = body

    // Validation
    if (!name) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya adı'), 400)
    }

    client = await pool.connect();

    const result = await client.query(`
      INSERT INTO categories (name, description, "isActive")
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, description || '', isActive !== false])

    return successResponse(result.rows[0], 'Kateqoriya uğurla yaradıldı')
  } catch (error) {
    logError('POST /api/categories', error)
    
    if (error.message.includes('Max client connections reached')) {
      return errorResponse('Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.', 503)
    }
    
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
  } finally {
    if (client) {
      client.release()
    }
  }
} 