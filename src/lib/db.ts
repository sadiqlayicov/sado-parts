import { Pool, PoolClient } from 'pg';
import { NextResponse } from 'next/server';
import { errorResponse, logError } from './api-utils';

/**
 * Shared database connection pool.
 * Replaces the 39+ duplicated `new Pool({...})` instances across API routes.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export { pool };

/**
 * Execute a database operation with automatic connection management.
 * Handles connect/release and standard error responses.
 *
 * Usage:
 * ```ts
 * export async function GET() {
 *   return withConnection(async (client) => {
 *     const result = await client.query('SELECT ...');
 *     return successResponse(result.rows);
 *   }, 'GET /api/example');
 * }
 * ```
 */
export async function withConnection<T extends NextResponse>(
  handler: (client: PoolClient) => Promise<T>,
  context: string
): Promise<T | NextResponse> {
  let client: PoolClient | undefined;

  try {
    client = await pool.connect();
    return await handler(client);
  } catch (error: unknown) {
    return handleDatabaseError(error, context);
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Handles common database errors and returns an appropriate response.
 * Consolidated from 4+ duplicated `handleDatabaseError` functions.
 */
export function handleDatabaseError(error: unknown, context: string): NextResponse {
  logError(context, error);

  if (
    error instanceof Error &&
    error.message?.includes('Max client connections reached')
  ) {
    return errorResponse(
      'Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.',
      503
    );
  }

  if (
    error instanceof Error &&
    error.message?.includes('timeout')
  ) {
    return errorResponse(
      'Verilənlər bazası cavab vermədi. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
      504
    );
  }

  return errorResponse('Daxili server xətası', 500);
}
