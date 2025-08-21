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
  let client: any
  try {
    const body = await request.json().catch(() => ({}))
    const { userIds, deleteAll } = body || {}

    if (!deleteAll && (!Array.isArray(userIds) || userIds.length === 0)) {
      return NextResponse.json({ success: false, error: 'userIds boşdur' }, { status: 400 })
    }

    client = await pool.connect()
    await client.query('BEGIN')

    // Resolve target user IDs (protect admins)
    let ids: string[] = []
    if (deleteAll) {
      const rs = await client.query('SELECT id FROM users WHERE "isAdmin" = false')
      ids = rs.rows.map((r: any) => r.id)
    } else {
      const rs = await client.query('SELECT id FROM users WHERE id = ANY($1) AND "isAdmin" = false', [userIds])
      ids = rs.rows.map((r: any) => r.id)
    }
    
    if (ids.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ success: true, deleted: 0, message: 'Silinəcək istifadəçi tapılmadı' })
    }

    console.log(`Deleting ${ids.length} users:`, ids)

    // Check if tables exist before deleting
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('order_items', 'orders', 'reviews', 'addresses')
    `)
    
    const existingTables = tableCheck.rows.map((r: any) => r.table_name)
    console.log('Existing tables:', existingTables)

    // Delete related rows (only if tables exist)
    if (existingTables.includes('order_items')) {
      try {
        const result = await client.query('DELETE FROM order_items WHERE "orderId" IN (SELECT id FROM orders WHERE "userId" = ANY($1))', [ids])
        console.log('Deleted order_items:', result.rowCount)
      } catch (error) {
        console.error('Error deleting order_items:', error)
      }
    }

    if (existingTables.includes('orders')) {
      try {
        const result = await client.query('DELETE FROM orders WHERE "userId" = ANY($1)', [ids])
        console.log('Deleted orders:', result.rowCount)
      } catch (error) {
        console.error('Error deleting orders:', error)
      }
    }

    if (existingTables.includes('reviews')) {
      try {
        const result = await client.query('DELETE FROM reviews WHERE "userId" = ANY($1)', [ids])
        console.log('Deleted reviews:', result.rowCount)
      } catch (error) {
        console.error('Error deleting reviews:', error)
      }
    }

    if (existingTables.includes('addresses')) {
      try {
        const result = await client.query('DELETE FROM addresses WHERE "userId" = ANY($1)', [ids])
        console.log('Deleted addresses:', result.rowCount)
      } catch (error) {
        console.error('Error deleting addresses:', error)
      }
    }

    // Finally delete users
    const userResult = await client.query('DELETE FROM users WHERE id = ANY($1) AND "isAdmin" = false', [ids])
    console.log('Deleted users:', userResult.rowCount)

    await client.query('COMMIT')
    
    return NextResponse.json({ 
      success: true, 
      deleted: userResult.rowCount,
      message: `${userResult.rowCount} istifadəçi uğurla silindi`
    })
    
  } catch (error: any) {
    console.error('Bulk delete users error:', error?.message || error)
    if (client) {
      try { 
        await client.query('ROLLBACK') 
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError)
      }
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Silinmə zamanı xəta: ' + (error?.message || 'Naməlum xəta')
    }, { status: 500 })
  } finally {
    if (client) client.release()
  }
}


