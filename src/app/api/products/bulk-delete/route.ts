import { NextRequest } from 'next/server'
import { Pool } from 'pg'
import { successResponse, errorResponse, logError, ErrorMessages } from '@/lib/api-utils'

// Create a connection pool optimized for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
})

/**
 * DELETE - Bulk delete products
 * Deletes multiple products by their IDs
 */
export async function DELETE(request: NextRequest) {
  let client;
  
  try {
    const body = await request.json();
    const { productIds } = body;

    // Validation
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return errorResponse('Məhsul ID-ləri tələb olunur', 400);
    }

    client = await pool.connect();

    // Check if all products exist
    const placeholders = productIds.map((_, index) => `$${index + 1}`).join(', ');
    const checkResult = await client.query(
      `SELECT id FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    if (checkResult.rows.length !== productIds.length) {
      return errorResponse('Bəzi məhsullar tapılmadı', 404);
    }

    // Delete products
    const deleteResult = await client.query(
      `DELETE FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    return successResponse(
      { deletedCount: deleteResult.rowCount }, 
      `${deleteResult.rowCount} məhsul uğurla silindi`
    );
  } catch (error: any) {
    logError('DELETE /api/products/bulk-delete', error);
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
  } finally {
    if (client) {
      client.release();
    }
  }
}
