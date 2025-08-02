import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

// GET - Get all products
export async function GET(request: NextRequest) {
  console.log('GET /api/products called')
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Database URL exists:', !!process.env.DATABASE_URL)

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    await client.connect()
    console.log('✅ Database connected successfully')

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

    console.log(`Found ${productsResult.rows.length} products`)

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

    console.log('Returning products with categories')

    return NextResponse.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })

    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    console.log('POST /api/products called')
    const body = await request.json()
    console.log('Received data:', JSON.stringify(body, null, 2))

    const { name, description, price, salePrice, sku, stock, images, categoryId, isActive, isFeatured, artikul, catalogNumber } = body

    // Validation
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!price) {
      return NextResponse.json({ error: 'Price is required' }, { status: 400 })
    }

    await client.connect()

    const imagesArray = images ? (Array.isArray(images) ? images : [images]) : []
    
    const result = await client.query(`
      INSERT INTO products (
        name, description, price, "salePrice", sku, stock, images, 
        "categoryId", "isActive", "isFeatured", artikul, "catalogNumber"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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

    console.log('Created product:', JSON.stringify(product, null, 2))

    return NextResponse.json({
      message: 'Məhsul uğurla əlavə olundu',
      product: { ...product, images: imagesArray }
    }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    
    return NextResponse.json(
      { error: typeof error === 'object' && error && 'message' in error ? (error as any).message : 'Məhsul əlavə etmə xətası' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
} 