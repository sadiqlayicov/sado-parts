import { NextRequest } from 'next/server'
import { successResponse, errorResponse, ErrorMessages } from '@/lib/api-utils'
import { withConnection } from '@/lib/db'

/**
 * PUT - Update product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const body = await request.json();
  const { name, description, price, category, artikul, catalogNumber, stock, isActive, isFeatured } = body;

  if (!name) {
    return errorResponse(ErrorMessages.REQUIRED_FIELD('Məhsul adı'), 400);
  }

  if (!price || isNaN(parseFloat(price))) {
    return errorResponse(ErrorMessages.REQUIRED_FIELD('Qiymət'), 400);
  }

  return withConnection(async (client) => {
    const checkResult = await client.query(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (checkResult.rows.length === 0) {
      return errorResponse('Məhsul tapılmadı', 404);
    }

    const result = await client.query(`
      UPDATE products SET 
        name = $1, 
        description = $2, 
        price = $3, 
        artikul = $4, 
        "catalogNumber" = $5, 
        stock = $6, 
        "isActive" = $7, 
        "isFeatured" = $8,
        "updatedAt" = NOW()
      WHERE id = $9
      RETURNING *
    `, [
      name, description || null, parseFloat(price),
      artikul || null, catalogNumber || null, stock || 0,
      isActive !== false, isFeatured || false, productId
    ]);

    return successResponse(result.rows[0], 'Məhsul uğurla yeniləndi');
  }, 'PUT /api/products/[id]');
}

/**
 * DELETE - Delete product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;

  return withConnection(async (client) => {
    const checkResult = await client.query(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (checkResult.rows.length === 0) {
      return errorResponse('Məhsul tapılmadı', 404);
    }

    await client.query('DELETE FROM products WHERE id = $1', [productId]);
    return successResponse(null, 'Məhsul uğurla silindi');
  }, 'DELETE /api/products/[id]');
}
