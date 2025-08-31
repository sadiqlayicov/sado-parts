import { NextRequest, NextResponse } from 'next/server'
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

// Helper function to handle database errors
function handleDatabaseError(error: any, operation: string) {
  logError(operation, error)
  
  if (error.message?.includes('Max client connections reached')) {
    return errorResponse('Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.', 503)
  }
  
  return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
}

/**
 * GET - Get all categories
 * Returns a list of all categories
 */
export async function GET(request: NextRequest) {
  let client;
  
  try {
    client = await pool.connect();
    
    const result = await client.query(`
      SELECT id, name, description, "isActive", "createdAt", "updatedAt"
      FROM categories 
      WHERE "isActive" = true
      ORDER BY name ASC
    `);

    return successResponse(result.rows, 'Kateqoriyalar uğurla yükləndi');
  } catch (error: any) {
    logError('GET /api/categories', error);
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500);
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let client;
  
  try {
    console.log('POST /api/categories called');
    
    const body = await request.json();
    const { name, description, isActive, parentId, sortOrder } = body;
    
    // Validation
    if (!name) {
      return errorResponse('Kateqoriya adı tələb olunur', 400);
    }

    client = await pool.connect();

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

    // Create new category (with optional parent)
    // Ensure we provide an explicit id because this table may not have a default
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
    console.log('Category created successfully:', newCategory);
    
    return successResponse(newCategory, 'Kateqoriya uğurla yaradıldı');
  } catch (error: any) {
    console.error('Database error in POST /api/categories:', error);
    return handleDatabaseError(error, 'POST /api/categories');
  } finally {
    if (client) {
      client.release();
    }
  }
} 