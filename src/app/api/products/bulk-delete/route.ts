import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { withConnection } from '@/lib/db'

/**
 * DELETE - Bulk delete products
 */
export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { productIds } = body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return errorResponse('Məhsul ID-ləri tələb olunur', 400);
  }

  return withConnection(async (client) => {
    const placeholders = productIds.map((_, index) => `$${index + 1}`).join(', ');
    const checkResult = await client.query(
      `SELECT id FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    if (checkResult.rows.length !== productIds.length) {
      return errorResponse('Bəzi məhsullar tapılmadı', 404);
    }

    const deleteResult = await client.query(
      `DELETE FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    return successResponse(
      { deletedCount: deleteResult.rowCount },
      `${deleteResult.rowCount} məhsul uğurla silindi`
    );
  }, 'DELETE /api/products/bulk-delete');
}
