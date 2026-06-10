import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { userIds, deleteAll } = body || {};

  if (!deleteAll && (!Array.isArray(userIds) || userIds.length === 0)) {
    return NextResponse.json({ success: false, error: 'userIds boşdur' }, { status: 400 });
  }

  let client: any;
  try {
    client = await pool.connect();

    const tableStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    const hasRole = tableStructure.rows.some((col: any) => col.column_name === 'role');

    await client.query('BEGIN');

    let ids: string[] = [];
    if (deleteAll) {
      const rs = hasRole
        ? await client.query("SELECT id FROM users WHERE role != 'ADMIN'")
        : await client.query('SELECT id FROM users');
      ids = rs.rows.map((r: any) => r.id);
    } else {
      const rs = hasRole
        ? await client.query("SELECT id FROM users WHERE id = ANY($1) AND role != 'ADMIN'", [userIds])
        : await client.query('SELECT id FROM users WHERE id = ANY($1)', [userIds]);
      ids = rs.rows.map((r: any) => r.id);
    }

    if (ids.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: true, deleted: 0, message: 'Silinəcək istifadəçi tapılmadı' });
    }

    if (hasRole) {
      await client.query("DELETE FROM users WHERE id = ANY($1) AND role != 'ADMIN'", [ids]);
    } else {
      await client.query('DELETE FROM users WHERE id = ANY($1)', [ids]);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      deleted: ids.length,
      message: `${ids.length} istifadəçi uğurla silindi`
    });
  } catch (error: any) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch {}
    }

    return NextResponse.json({
      success: false,
      error: 'Silinmə zamanı xəta: ' + (error?.message || 'Naməlum xəta')
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
