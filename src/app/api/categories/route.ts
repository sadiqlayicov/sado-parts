import { NextRequest } from 'next/server'
import { Client } from 'pg'
import { successResponse, errorResponse, logError, ErrorMessages } from '@/lib/api-utils'

/**
 * GET - Get all categories
 * Fetches all active categories
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

    const categoriesResult = await client.query(`
      SELECT id, name, description, image, "isActive", "createdAt", "updatedAt"
      FROM categories
      WHERE "isActive" = true
      ORDER BY name ASC
    `)

    const categories = categoriesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      image: row.image,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))

    return successResponse(categories, `${categories.length} kateqoriya tapıldı`)
  } catch (error) {
    logError('GET /api/categories', error)
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
  } finally {
    await client.end()
  }
}

/**
 * POST - Create new category
 * Creates a new category with validation
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
    const { name, description, image, isActive } = body

    if (!name) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya adı'), 400)
    }

    await client.connect()

    const result = await client.query(`
      INSERT INTO categories (name, description, image, "isActive")
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      name,
      description,
      image,
      isActive !== undefined ? isActive : true
    ])

    const category = result.rows[0]

    return successResponse(category, 'Kateqoriya uğurla yaradıldı', 201)
  } catch (error) {
    logError('POST /api/categories', error)
    return errorResponse(ErrorMessages.CREATION_FAILED('kateqoriya'), 500)
  } finally {
    await client.end()
  }
} 