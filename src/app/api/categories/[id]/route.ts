import { NextRequest } from 'next/server'
import { withConnection } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-utils'

/**
 * GET - Get single category by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return errorResponse('Kateqoriya ID tələb olunur', 400);
  }

  return withConnection(async (client) => {
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "parentId" TEXT'); } catch {}
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0'); } catch {}

    const categoryResult = await client.query(`
      SELECT id, name, description, "isActive", "parentId", COALESCE("sortOrder",0) as "sortOrder", "createdAt", "updatedAt"
      FROM categories 
      WHERE id = $1 AND "isActive" = true
    `, [id]);

    if (categoryResult.rows.length === 0) {
      return errorResponse('Kateqoriya tapılmadı', 404);
    }

    return successResponse(categoryResult.rows[0], 'Kateqoriya tapıldı');
  }, 'GET /api/categories/[id]');
}

/**
 * PUT - Update category by ID
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name, description, isActive, parentId, sortOrder } = body;

  if (!id) {
    return errorResponse('Kateqoriya ID tələb olunur', 400);
  }

  if (!name) {
    return errorResponse('Kateqoriya adı tələb olunur', 400);
  }

  return withConnection(async (client) => {
    const existingResult = await client.query(`
      SELECT id FROM categories 
      WHERE name = $1 AND "isActive" = true AND id != $2
    `, [name, id]);

    if (existingResult.rows.length > 0) {
      return errorResponse('Bu adda başqa kateqoriya artıq mövcuddur', 400);
    }

    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "parentId" TEXT'); } catch {}
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0'); } catch {}

    const updateResult = await client.query(`
      UPDATE categories 
      SET name = $1, description = $2, "isActive" = $3, "parentId" = $4, "sortOrder" = COALESCE($5,0), "updatedAt" = NOW()
      WHERE id = $6
      RETURNING *
    `, [name, description || '', isActive !== false, parentId || null, sortOrder ?? 0, id]);

    if (updateResult.rows.length === 0) {
      return errorResponse('Kateqoriya tapılmadı', 404);
    }

    return successResponse(updateResult.rows[0], 'Kateqoriya uğurla yeniləndi');
  }, 'PUT /api/categories/[id]');
}

/**
 * DELETE - Delete category by ID (soft delete by setting isActive to false)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { forceDelete?: boolean } = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch {
    // No body or invalid JSON
  }

  const { forceDelete } = body;

  if (!id) {
    return errorResponse('Kateqoriya ID tələb olunur', 400);
  }

  return withConnection(async (client) => {
    // Check if category has products
    const productsResult = await client.query(`
      SELECT id FROM products 
      WHERE "categoryId" = $1 AND "isActive" = true
    `, [id]);

    const productCount = productsResult.rows.length;

    if (productCount > 0) {
      if (!forceDelete) {
        return errorResponse(
          `Bu kateqoriyada ${productCount} məhsul var. Əvvəlcə məhsulları başqa kateqoriyaya köçürün və ya silin.`,
          400
        );
      }

      // Find or create "Ümumi" category
      let defaultCategoryResult = await client.query(`
        SELECT id FROM categories 
        WHERE name = 'Ümumi' AND "isActive" = true
      `);

      let defaultCategoryId;
      if (defaultCategoryResult.rows.length === 0) {
        const newDefaultResult = await client.query(`
          INSERT INTO categories (name, description, "isActive", "createdAt", "updatedAt")
          VALUES ('Ümumi', 'Ümumi kateqoriya', true, NOW(), NOW())
          RETURNING id
        `);
        defaultCategoryId = newDefaultResult.rows[0].id;
      } else {
        defaultCategoryId = defaultCategoryResult.rows[0].id;
      }

      await client.query(`
        UPDATE products 
        SET "categoryId" = $1, "categoryName" = 'Ümumi', "updatedAt" = NOW()
        WHERE "categoryId" = $2 AND "isActive" = true
      `, [defaultCategoryId, id]);
    }

    const deleteResult = await client.query(`
      UPDATE categories 
      SET "isActive" = false, "updatedAt" = NOW()
      WHERE id = $1 AND "isActive" = true
      RETURNING *
    `, [id]);

    if (deleteResult.rows.length === 0) {
      return errorResponse('Kateqoriya tapılmadı', 404);
    }

    return successResponse(deleteResult.rows[0], 'Kateqoriya uğurla silindi');
  }, 'DELETE /api/categories/[id]');
}
