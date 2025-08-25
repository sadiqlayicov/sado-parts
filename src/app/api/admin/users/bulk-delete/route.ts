import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000
})

export async function POST(request: NextRequest) {
  console.log('=== BULK DELETE USERS API STARTED ===')
  
  let client: any
  try {
    // Parse request body
    const body = await request.json().catch((error) => {
      console.error('JSON parse error:', error)
      return {}
    })
    
    console.log('Request body:', body)
    
    const { userIds, deleteAll } = body || {}

    if (!deleteAll && (!Array.isArray(userIds) || userIds.length === 0)) {
      console.log('Validation failed: userIds is empty')
      return NextResponse.json({ success: false, error: 'userIds boşdur' }, { status: 400 })
    }

    // Connect to database
    console.log('Connecting to database...')
    client = await pool.connect()
    console.log('Database connected successfully')

    // Check database structure first
    console.log('Checking database structure...')
    const tableStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `)
    console.log('Users table structure:', tableStructure.rows)

    // Check if role column exists
    const hasRole = tableStructure.rows.some((col: any) => col.column_name === 'role')
    console.log('Has role column:', hasRole)

    // Start transaction
    await client.query('BEGIN')
    console.log('Transaction started')

    // Get users to delete (protect ADMIN users)
    let ids: string[] = []
    if (deleteAll) {
      console.log('Getting all non-admin users...')
      if (hasRole) {
        const rs = await client.query('SELECT id FROM users WHERE role != \'ADMIN\'')
        ids = rs.rows.map((r: any) => r.id)
      } else {
        const rs = await client.query('SELECT id FROM users')
        ids = rs.rows.map((r: any) => r.id)
      }
      console.log('Found users to delete (deleteAll):', ids)
    } else {
      console.log('Getting specific users to delete:', userIds)
      if (hasRole) {
        const rs = await client.query('SELECT id FROM users WHERE id = ANY($1) AND role != \'ADMIN\'', [userIds])
        ids = rs.rows.map((r: any) => r.id)
      } else {
        const rs = await client.query('SELECT id FROM users WHERE id = ANY($1)', [userIds])
        ids = rs.rows.map((r: any) => r.id)
      }
      console.log('Found users to delete (specific):', ids)
    }
    
    if (ids.length === 0) {
      console.log('No users found to delete')
      await client.query('ROLLBACK')
      return NextResponse.json({ success: true, deleted: 0, message: 'Silinəcək istifadəçi tapılmadı' })
    }

    console.log(`Starting to delete ${ids.length} users:`, ids)

    // Delete users directly
    console.log('Deleting users directly...')
    if (hasRole) {
      const userResult = await client.query('DELETE FROM users WHERE id = ANY($1) AND role != \'ADMIN\'', [ids])
      console.log('Users deleted successfully:', userResult.rowCount)
    } else {
      const userResult = await client.query('DELETE FROM users WHERE id = ANY($1)', [ids])
      console.log('Users deleted successfully:', userResult.rowCount)
    }

    // Commit transaction
    await client.query('COMMIT')
    console.log('Transaction committed')
    
    console.log('=== BULK DELETE USERS API SUCCESS ===')
    return NextResponse.json({ 
      success: true, 
      deleted: ids.length,
      message: `${ids.length} istifadəçi uğurla silindi`
    })
    
  } catch (error: any) {
    console.error('=== BULK DELETE USERS API ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    
    if (client) {
      try { 
        console.log('Attempting rollback...')
        await client.query('ROLLBACK') 
        console.log('Rollback successful')
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError)
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Silinmə zamanı xəta: ' + (error?.message || 'Naməlum xəta')
    }, { status: 500 })
  } finally {
    if (client) {
      console.log('Releasing database connection...')
      client.release()
    }
    console.log('=== BULK DELETE USERS API ENDED ===')
  }
}


