import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

// GET - Get all marketplaces
export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    await client.connect()
    
    // Check if marketplaces table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplaces'
      )
    `)
    
    if (!tableExists.rows[0].exists) {
      return NextResponse.json([])
    }
    
    const marketplacesResult = await client.query(`
      SELECT * FROM marketplaces 
      WHERE "isActive" = true 
      ORDER BY name
    `)
    
    return NextResponse.json(marketplacesResult.rows)
  } catch (error) {
    console.error('Get marketplaces error:', error)
    return NextResponse.json(
      { error: 'Marketplaceləri əldə etmə xətası' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// POST - Create new marketplace
export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    const body = await request.json()
    const { name, description, url, isActive } = body

    await client.connect()
    
    const result = await client.query(`
      INSERT INTO marketplaces (name, description, url, "isActive")
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description, url, isActive !== undefined ? isActive : true])

    const marketplace = result.rows[0]

    return NextResponse.json({
      message: 'Marketplace uğurla əlavə olundu',
      marketplace
    }, { status: 201 })
  } catch (error) {
    console.error('Create marketplace error:', error)
    return NextResponse.json(
      { error: 'Marketplace əlavə etmə xətası' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
} 