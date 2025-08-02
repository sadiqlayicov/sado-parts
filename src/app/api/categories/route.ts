import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET(request: NextRequest) {
  console.log('GET /api/categories called')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    await client.connect()
    console.log('✅ Database connected successfully for categories')

    const categoriesResult = await client.query(`
      SELECT id, name, description, image, "isActive", "createdAt", "updatedAt"
      FROM categories
      WHERE "isActive" = true
      ORDER BY name ASC
    `)

    console.log(`Found ${categoriesResult.rows.length} categories`)

    const categories = categoriesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      image: row.image,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    
    return NextResponse.json([])
  } finally {
    await client.end()
  }
}

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
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
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

    return NextResponse.json({
      message: 'Category created successfully',
      category
    }, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    
    return NextResponse.json(
      { error: typeof error === 'object' && error && 'message' in error ? (error as any).message : 'Category creation error' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
} 