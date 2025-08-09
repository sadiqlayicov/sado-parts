import { NextRequest } from 'next/server'
import { Pool } from 'pg'
import { successResponse, errorResponse, logError, ErrorMessages } from '@/lib/api-utils'

// Create a connection pool optimized for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3, // Increase connection limit for Supabase
  idleTimeoutMillis: 60000, // Increase idle timeout
  connectionTimeoutMillis: 5000, // Increase connection timeout
})

/**
 * GET - Get single category by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let client;
  
  try {
    const { id } = await params;
    
    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya ID'), 400)
    }

    client = await pool.connect();

    const result = await client.query(`
      SELECT id, name, description, "isActive", "createdAt", "updatedAt"
      FROM categories
      WHERE id = $1
    `, [id])

    if (result.rows.length === 0) {
      return errorResponse(ErrorMessages.NOT_FOUND('Kateqoriya'), 404)
    }

    return successResponse(result.rows[0], 'Kateqoriya tapıldı')
  } catch (error: any) {
    logError('GET /api/categories/[id]', error)
    
    if (error.message?.includes('Max client connections reached')) {
      return errorResponse('Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.', 503)
    }
    
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
  } finally {
    if (client) {
      client.release()
    }
  }
}

/**
 * PUT - Update category by ID
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let client;
  
  try {
    const { id } = await params;
    const body = await request.json()
    const { name, description, isActive } = body
    
    console.log('Updating category:', { id, name, description, isActive });

    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya ID'), 400)
    }

    if (!name) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya adı'), 400)
    }

    client = await pool.connect();
    console.log('Database connection successful for PUT');

    // Check if another category with same name already exists (excluding current one)
    const existingResult = await client.query(`
      SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND "isActive" = true AND id != $2
    `, [name, id]);
    
    if (existingResult.rows.length > 0) {
      return errorResponse('Bu adda başqa kateqoriya artıq mövcuddur', 400);
    }

    const result = await client.query(`
      UPDATE categories 
      SET 
        name = $1, 
        description = $2, 
        "isActive" = $3,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [name, description || '', isActive !== false, id])

    if (result.rows.length === 0) {
      return errorResponse(ErrorMessages.NOT_FOUND('Kateqoriya'), 404)
    }

    console.log('Category updated successfully:', result.rows[0]);
    return successResponse(result.rows[0], 'Kateqoriya uğurla yeniləndi')
  } catch (error: any) {
    console.error('Database error in PUT /api/categories/[id]:', error);
    logError('PUT /api/categories/[id]', error)
    
    if (error.code === '23505') { // Unique violation
      return errorResponse('Bu adda kateqoriya artıq mövcuddur', 400)
    }
    
    if (error.message?.includes('Max client connections reached')) {
      return errorResponse('Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.', 503)
    }
    
    return errorResponse(`Database xətası: ${error.message}`, 500)
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
}

/**
 * DELETE - Delete category by ID (soft delete by setting isActive to false)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let client;
  
  try {
    const { id } = await params;
    
    console.log('Deleting category:', { id });
    
    // Get request body if available
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // No body or invalid JSON - continue with empty body
    }
    
    const { forceDelete } = body as { forceDelete?: boolean };
    console.log('Delete options:', { forceDelete });

    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya ID'), 400)
    }

    client = await pool.connect();
    console.log('Database connection successful for DELETE');

    // Check if category has products
    const productsResult = await client.query(`
      SELECT COUNT(*) as count FROM products WHERE "categoryId" = $1 AND "isActive" = true
    `, [id])

    const productCount = parseInt(productsResult.rows[0].count)
    console.log(`Category has ${productCount} products`);
    
    if (productCount > 0) {
      if (!forceDelete) {
        return errorResponse(`Bu kateqoriyada ${productCount} məhsul var. Əvvəlcə məhsulları başqa kateqoriyaya köçürün və ya silin.`, 400)
      }
      
      // Find or create "Ümumi" category
      let defaultCategoryResult = await client.query(`
        SELECT id FROM categories WHERE name = 'Ümumi' AND "isActive" = true LIMIT 1
      `);
      
      let defaultCategoryId;
      if (defaultCategoryResult.rows.length === 0) {
        // Create "Ümumi" category
        const createResult = await client.query(`
          INSERT INTO categories (name, description, "isActive")
          VALUES ('Ümumi', 'Ümumi kateqoriya', true)
          RETURNING id
        `);
        defaultCategoryId = createResult.rows[0].id;
      } else {
        defaultCategoryId = defaultCategoryResult.rows[0].id;
      }
      
      // Move all products to default category
      await client.query(`
        UPDATE products 
        SET "categoryId" = $1, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "categoryId" = $2 AND "isActive" = true
      `, [defaultCategoryId, id]);
    }

    // Soft delete - set isActive to false
    const result = await client.query(`
      UPDATE categories 
      SET 
        "isActive" = false,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return errorResponse(ErrorMessages.NOT_FOUND('Kateqoriya'), 404)
    }

    console.log('Category deleted successfully:', result.rows[0]);
    return successResponse(result.rows[0], 'Kateqoriya uğurla silindi')
  } catch (error: any) {
    console.error('Database error in DELETE /api/categories/[id]:', error);
    logError('DELETE /api/categories/[id]', error)
    
    if (error.message?.includes('Max client connections reached')) {
      return errorResponse('Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.', 503)
    }
    
    return errorResponse(`Database xətası: ${error.message}`, 500)
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
}