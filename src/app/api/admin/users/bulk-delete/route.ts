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

    // Start transaction
    await client.query('BEGIN')
    console.log('Transaction started')

    // Get users to delete
    let ids: string[] = []
    if (deleteAll) {
      console.log('Getting all non-admin users...')
      const rs = await client.query('SELECT id FROM users WHERE "isAdmin" = false')
      ids = rs.rows.map((r: any) => r.id)
      console.log('Found users to delete (deleteAll):', ids)
    } else {
      console.log('Getting specific users to delete:', userIds)
      const rs = await client.query('SELECT id FROM users WHERE id = ANY($1) AND "isAdmin" = false', [userIds])
      ids = rs.rows.map((r: any) => r.id)
      console.log('Found users to delete (specific):', ids)
    }
    
    if (ids.length === 0) {
      console.log('No users found to delete')
      await client.query('ROLLBACK')
      return NextResponse.json({ success: true, deleted: 0, message: 'Silinəcək istifadəçi tapılmadı' })
    }

    console.log(`Starting to delete ${ids.length} users:`, ids)

    // Simple approach: just delete users directly
    console.log('Deleting users directly...')
    const userResult = await client.query('DELETE FROM users WHERE id = ANY($1) AND "isAdmin" = false', [ids])
    console.log('Users deleted successfully:', userResult.rowCount)

    // Commit transaction
    await client.query('COMMIT')
    console.log('Transaction committed')
    
    console.log('=== BULK DELETE USERS API SUCCESS ===')
    return NextResponse.json({ 
      success: true, 
      deleted: userResult.rowCount,
      message: `${userResult.rowCount} istifadəçi uğurla silindi`
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


