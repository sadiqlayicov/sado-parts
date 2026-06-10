import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { withConnection } from '@/lib/db'

/**
 * GET - Get all categories
 * Returns a list of all categories
 */
export async function GET(request: NextRequest) {
  return withConnection(async (client) => {
    // Ensure columns exist
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "parentId" TEXT'); } catch {}
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0'); } catch {}

    const result = await client.query(`
      SELECT id, name, description, "isActive", "parentId", COALESCE("sortOrder",0) as "sortOrder", "createdAt", "updatedAt"
      FROM categories 
      WHERE "isActive" = true
      ORDER BY "sortOrder" ASC, name ASC
    `);

    return successResponse(result.rows, 'Kateqoriyalar uğurla yükləndi');
  }, 'GET /api/categories');
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, isActive, parentId, sortOrder } = body;

  if (!name) {
    return errorResponse('Kateqoriya adı tələb olunur', 400);
  }

  return withConnection(async (client) => {
    // Ensure columns
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "parentId" TEXT'); } catch {}
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0'); } catch {}

    // Check if category with same name already exists
    const existingResult = await client.query(`
      SELECT id FROM categories 
      WHERE name = $1 AND "isActive" = true
    `, [name]);

    if (existingResult.rows.length > 0) {
      return errorResponse('Bu adda kateqoriya artıq mövcuddur', 400);
    }

    const newId = `cat_${Date.now()}`;
    const newCategoryResult = await client.query(`
      INSERT INTO categories (id, name, description, "isActive", "parentId", "sortOrder", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, COALESCE($6,0), NOW(), NOW())
      RETURNING *
    `, [
      newId,
      name,
      description || '',
      isActive !== false,
      parentId || null,
      sortOrder ?? 0
    ]);

    const newCategory = newCategoryResult.rows[0];
    return successResponse(newCategory, 'Kateqoriya uğurla yaradıldı');
  }, 'POST /api/categories');
}
