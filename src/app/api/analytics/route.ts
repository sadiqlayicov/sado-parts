import { NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return withConnection(async (client) => {
    const safeCount = async (sql: string, defaultValue = 0) => {
      try {
        const res = await client.query(sql);
        return res.rows[0]?.count ?? defaultValue;
      } catch {
        return defaultValue;
      }
    };

    const safeSum = async (sql: string, field: string, defaultValue = 0) => {
      try {
        const res = await client.query(sql);
        const val = res.rows[0]?.[field];
        return parseFloat(val ?? '0') || defaultValue;
      } catch {
        return defaultValue;
      }
    };

    const safeRows = async (sql: string) => {
      try {
        const res = await client.query(sql);
        return res.rows || [];
      } catch {
        return [];
      }
    };

    const [
      userCount,
      productCount,
      orderCount,
      totalSales,
      pendingOrders,
      lowStockProducts,
      recentOrdersRows,
    ] = await Promise.all([
      safeCount('SELECT COUNT(*)::int AS count FROM users'),
      safeCount('SELECT COUNT(*)::int AS count FROM products'),
      safeCount('SELECT COUNT(*)::int AS count FROM orders'),
      safeSum("SELECT COALESCE(SUM(total_amount), 0)::numeric AS sum FROM payments WHERE status = 'completed'", 'sum'),
      safeCount("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'"),
      safeCount('SELECT COUNT(*)::int AS count FROM products WHERE stock IS NOT NULL AND stock < 5'),
      safeRows(`
        SELECT o.id, o."orderNumber", o."totalAmount", o.status, o."createdAt",
               u."firstName", u."lastName", u.email
        FROM orders o
        LEFT JOIN users u ON u.id = o."userId"
        ORDER BY o."createdAt" DESC
        LIMIT 5
      `),
    ]);

    const recentOrders = recentOrdersRows.map((row: any) => ({
      id: row.id,
      orderNumber: row.orderNumber || row.order_number || row.id,
      customer: `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.email || 'Неизвестный',
      amount: parseFloat(row.totalAmount ?? 0),
      status: row.status || 'pending',
      createdAt: row.createdAt,
    }));

    return NextResponse.json({
      success: true,
      userCount,
      productCount,
      orderCount,
      totalSales,
      pendingOrders,
      lowStockProducts,
      recentOrders,
    });
  }, 'GET /api/analytics');
}
