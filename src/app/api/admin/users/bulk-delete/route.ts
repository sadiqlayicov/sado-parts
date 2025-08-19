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
      return NextResponse.json({ success: true, deleted: 0 })
    }

    // Delete related rows (best-effort)
    await client.query('DELETE FROM order_items WHERE "orderId" IN (SELECT id FROM orders WHERE "userId" = ANY($1))', [ids])
    await client.query('DELETE FROM orders WHERE "userId" = ANY($1)', [ids])
    try { await client.query('DELETE FROM reviews WHERE "userId" = ANY($1)', [ids]) } catch {}
    try { await client.query('DELETE FROM addresses WHERE "userId" = ANY($1)', [ids]) } catch {}

    await client.query('DELETE FROM users WHERE id = ANY($1) AND "isAdmin" = false', [ids])
    await client.query('COMMIT')
    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error: any) {
    console.error('Bulk delete users error:', error?.message || error)
    if (client) try { await client.query('ROLLBACK') } catch {}
    return NextResponse.json({ success: false, error: 'Silinmə zamanı xəta' }, { status: 500 })
  } finally {
    if (client) client.release()
  }
}


