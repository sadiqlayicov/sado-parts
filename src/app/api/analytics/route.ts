import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
	max: 2,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
});

export async function GET() {
	let client: any;

	try {
		client = await pool.connect();

		// Helpers that safely return defaults if a table/column is missing
		const safeCount = async (sql: string, defaultValue = 0) => {
			try {
				const res = await client.query(sql);
				return res.rows[0]?.count ?? defaultValue;
			} catch (e) {
				return defaultValue;
			}
		};

		const safeSum = async (sql: string, field: string, defaultValue = 0) => {
			try {
				const res = await client.query(sql);
				const val = res.rows[0]?.[field];
				return parseFloat(val ?? '0') || defaultValue;
			} catch (e) {
				return defaultValue;
			}
		};

		const safeRows = async (sql: string) => {
			try {
				const res = await client.query(sql);
				return res.rows || [];
			} catch (e) {
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
	} catch (error: any) {
		console.error('Analytics error:', error);
		return NextResponse.json(
			{ error: 'Не удалось получить аналитику' },
			{ status: 500 }
		);
	} finally {
		if (client) client.release();
	}
}
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
	max: 2,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
});

export async function GET() {
	let client: any;

	try {
		client = await pool.connect();

		// Run queries in parallel
		const [
			usersRes,
			productsRes,
			ordersRes,
			revenueRes,
			pendingRes,
			lowStockRes,
			recentOrdersRes,
		] = await Promise.all([
			client.query('SELECT COUNT(*)::int AS count FROM users'),
			client.query('SELECT COUNT(*)::int AS count FROM products'),
			client.query('SELECT COUNT(*)::int AS count FROM orders'),
			client.query("SELECT COALESCE(SUM(total_amount), 0)::numeric AS sum FROM payments WHERE status = 'completed'"),
			client.query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'"),
			client.query('SELECT COUNT(*)::int AS count FROM products WHERE stock IS NOT NULL AND stock < 5'),
			client.query(`
				SELECT o.id, o."orderNumber", o."totalAmount", o.status, o."createdAt",
				       u."firstName", u."lastName", u.email
				FROM orders o
				LEFT JOIN users u ON u.id = o."userId"
				ORDER BY o."createdAt" DESC
				LIMIT 5
			`),
		]);

		const userCount = usersRes.rows[0]?.count || 0;
		const productCount = productsRes.rows[0]?.count || 0;
		const orderCount = ordersRes.rows[0]?.count || 0;
		// revenueRes may be numeric string; convert to number
		const totalSales = parseFloat(revenueRes.rows[0]?.sum ?? '0') || 0;
		const pendingOrders = pendingRes.rows[0]?.count || 0;
		const lowStockProducts = lowStockRes.rows[0]?.count || 0;

		const recentOrders = (recentOrdersRes.rows || []).map((row: any) => ({
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
	} catch (error: any) {
		console.error('Analytics error:', error);
		return NextResponse.json(
			{ error: 'Не удалось получить аналитику' },
			{ status: 500 }
		);
	} finally {
		if (client) client.release();
	}
}