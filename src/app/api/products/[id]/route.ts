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
 * PUT - Update product
 * Updates an existing product with validation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  
  try {
    const productId = params.id;
    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      category, 
      artikul, 
      catalogNumber, 
      stock, 
      isActive, 
      isFeatured 
    } = body;

    // Validation
    if (!name) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Məhsul adı'), 400);
    }

    if (!price || isNaN(parseFloat(price))) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Qiymət'), 400);
    }

    client = await pool.connect();

    // Check if product exists
    const checkResult = await client.query(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (checkResult.rows.length === 0) {
      return errorResponse('Məhsul tapılmadı', 404);
    }

    // Update product
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
      name, 
      description || null, 
      parseFloat(price), 
      artikul || null, 
      catalogNumber || null, 
      stock || 0, 
      isActive !== false, 
      isFeatured || false,
      productId
    ]);

    return successResponse(result.rows[0], 'Məhsul uğurla yeniləndi');
  } catch (error: any) {
    logError('PUT /api/products/[id]', error);
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * DELETE - Delete product
 * Deletes a product by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  
  try {
    const productId = params.id;

    client = await pool.connect();

    // Check if product exists
    const checkResult = await client.query(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (checkResult.rows.length === 0) {
      return errorResponse('Məhsul tapılmadı', 404);
    }

    // Delete product
    await client.query(
      'DELETE FROM products WHERE id = $1',
      [productId]
    );

    return successResponse(null, 'Məhsul uğurla silindi');
  } catch (error: any) {
    logError('DELETE /api/products/[id]', error);
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
  } finally {
    if (client) {
      client.release();
    }
  }
} 