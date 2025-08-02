import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

// GET - Get all settings
export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    await client.connect()
    
    // Check if settings table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'settings'
      )
    `)
    
    if (!tableExists.rows[0].exists) {
      return NextResponse.json([])
    }
    
    const settingsResult = await client.query(`
      SELECT * FROM settings 
      ORDER BY "key"
    `)
    
    return NextResponse.json(settingsResult.rows)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Ayarları əldə etmə xətası' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// POST - Create new setting
export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    const body = await request.json()
    const { key, value, description } = body

    await client.connect()
    
    const result = await client.query(`
      INSERT INTO settings ("key", value, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [key, value, description])

    const setting = result.rows[0]

    return NextResponse.json({
      message: 'Ayar uğurla əlavə olundu',
      setting
    }, { status: 201 })
  } catch (error) {
    console.error('Create setting error:', error)
    return NextResponse.json(
      { error: 'Ayar əlavə etmə xətası' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// PUT - Update setting
export async function PUT(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    const body = await request.json()
    const { key, value, description } = body

    await client.connect()
    
    const result = await client.query(`
      UPDATE settings 
      SET value = $2, description = $3
      WHERE "key" = $1
      RETURNING *
    `, [key, value, description])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ayar tapılmadı' },
        { status: 404 }
      )
    }

    const setting = result.rows[0]

    return NextResponse.json({
      message: 'Ayar uğurla yeniləndi',
      setting
    })
  } catch (error) {
    console.error('Update setting error:', error)
    return NextResponse.json(
      { error: 'Ayar yeniləmə xətası' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// DELETE - Delete setting
export async function DELETE(request: NextRequest) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    const body = await request.json()
    const { key } = body

    await client.connect()
    
    const result = await client.query(`
      DELETE FROM settings 
      WHERE "key" = $1
      RETURNING *
    `, [key])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ayar tapılmadı' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Ayar uğurla silindi'
    })
  } catch (error) {
    console.error('Delete setting error:', error)
    return NextResponse.json(
      { error: 'Ayar silmə xətası' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
} 