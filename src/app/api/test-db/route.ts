import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET(request: NextRequest) {
  console.log('🔍 Testing database connection...')
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

    // Check data counts
    const productCountResult = await client.query('SELECT COUNT(*) as count FROM products')
    const categoryCountResult = await client.query('SELECT COUNT(*) as count FROM categories')
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM users')

    const productCount = parseInt(productCountResult.rows[0].count)
    const categoryCount = parseInt(categoryCountResult.rows[0].count)
    const userCount = parseInt(userCountResult.rows[0].count)

    console.log(`📊 Found ${productCount} products, ${categoryCount} categories, ${userCount} users`)

    // Check active products
    const activeProductsResult = await client.query('SELECT COUNT(*) as count FROM products WHERE "isActive" = true')
    const activeProducts = parseInt(activeProductsResult.rows[0].count)

    // Check active categories
    const activeCategoriesResult = await client.query('SELECT COUNT(*) as count FROM categories WHERE "isActive" = true')
    const activeCategories = parseInt(activeCategoriesResult.rows[0].count)

    // Sample products
    const sampleProductsResult = await client.query(`
      SELECT p.id, p.name, p.price, p."isActive", c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."isActive" = true
      ORDER BY p."createdAt" DESC
      LIMIT 5
    `)

    const sampleProducts = sampleProductsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      categoryName: row.category_name,
      isActive: row.isActive
    }))

    // Sample categories
    const sampleCategoriesResult = await client.query(`
      SELECT id, name, "isActive"
      FROM categories
      WHERE "isActive" = true
      ORDER BY name
      LIMIT 5
    `)

    const sampleCategories = sampleCategoriesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      isActive: row.isActive
    }))

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        productCount,
        categoryCount,
        userCount,
        activeProducts,
        activeCategories,
        sampleProducts,
        sampleCategories
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'N/A'
      }
    })
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })

    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'N/A'
        }
      },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
} 