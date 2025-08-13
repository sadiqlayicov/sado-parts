import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

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
  console.error(`${operation} error:`, error)
  
  if (error.message?.includes('Max client connections reached')) {
    return NextResponse.json(
      { success: false, error: 'Достигнут лимит подключений к базе данных. Пожалуйста, подождите немного.' },
      { status: 503 }
    )
  }
  
  return NextResponse.json(
    { success: false, error: `Database xətası: ${error.message}` },
    { status: 500 }
  )
}

/**
 * GET - Get single category by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let client;
  
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kateqoriya ID tələb olunur' },
        { status: 400 }
      )
    }

    client = await pool.connect();

    const categoryResult = await client.query(`
      SELECT id, name, description, "isActive", "createdAt", "updatedAt"
      FROM categories 
      WHERE id = $1 AND "isActive" = true
    `, [id]);

    if (categoryResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kateqoriya tapılmadı' },
        { status: 404 }
      )
    }

    const category = categoryResult.rows[0];
    return NextResponse.json({
      success: true,
      data: category,
      message: 'Kateqoriya tapıldı'
    })
  } catch (error: any) {
    console.error('Database error in GET /api/categories/[id]:', error);
    return handleDatabaseError(error, 'GET /api/categories/[id]');
  } finally {
    if (client) {
      client.release();
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
      return NextResponse.json(
        { success: false, error: 'Kateqoriya ID tələb olunur' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Kateqoriya adı tələb olunur' },
        { status: 400 }
      )
    }

    client = await pool.connect();

    // Check if another category with same name already exists (excluding current one)
    const existingResult = await client.query(`
      SELECT id FROM categories 
      WHERE name = $1 AND "isActive" = true AND id != $2
    `, [name, id]);
    
    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu adda başqa kateqoriya artıq mövcuddur' },
        { status: 400 }
      );
    }

    // Update category
    const updateResult = await client.query(`
      UPDATE categories 
      SET name = $1, description = $2, "isActive" = $3, "updatedAt" = NOW()
      WHERE id = $4 AND "isActive" = true
      RETURNING *
    `, [name, description || '', isActive !== false, id]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kateqoriya tapılmadı' },
        { status: 404 }
      )
    }

    const updatedCategory = updateResult.rows[0];
    console.log('Category updated successfully:', updatedCategory);
    
    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Kateqoriya uğurla yeniləndi'
    })
  } catch (error: any) {
    console.error('Database error in PUT /api/categories/[id]:', error);
    return handleDatabaseError(error, 'PUT /api/categories/[id]');
  } finally {
    if (client) {
      client.release();
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
      return NextResponse.json(
        { success: false, error: 'Kateqoriya ID tələb olunur' },
        { status: 400 }
      )
    }

    client = await pool.connect();

    // Check if category has products
    const productsResult = await client.query(`
      SELECT id FROM products 
      WHERE "categoryId" = $1 AND "isActive" = true
    `, [id]);

    const productCount = productsResult.rows.length;
    console.log(`Category has ${productCount} products`);
    
    if (productCount > 0) {
      if (!forceDelete) {
        return NextResponse.json(
          { success: false, error: `Bu kateqoriyada ${productCount} məhsul var. Əvvəlcə məhsulları başqa kateqoriyaya köçürün və ya silin.` },
          { status: 400 }
        )
      }
      
      // Find or create "Ümumi" category
      let defaultCategoryResult = await client.query(`
        SELECT id FROM categories 
        WHERE name = 'Ümumi' AND "isActive" = true
      `);
      
      let defaultCategoryId;
      if (defaultCategoryResult.rows.length === 0) {
        // Create "Ümumi" category
        const newDefaultResult = await client.query(`
          INSERT INTO categories (name, description, "isActive", "createdAt", "updatedAt")
          VALUES ('Ümumi', 'Ümumi kateqoriya', true, NOW(), NOW())
          RETURNING id
        `);
        defaultCategoryId = newDefaultResult.rows[0].id;
      } else {
        defaultCategoryId = defaultCategoryResult.rows[0].id;
      }
      
      // Move all products to default category
      await client.query(`
        UPDATE products 
        SET "categoryId" = $1, "categoryName" = 'Ümumi', "updatedAt" = NOW()
        WHERE "categoryId" = $2 AND "isActive" = true
      `, [defaultCategoryId, id]);
    }

    // Soft delete - set isActive to false
    const deleteResult = await client.query(`
      UPDATE categories 
      SET "isActive" = false, "updatedAt" = NOW()
      WHERE id = $1 AND "isActive" = true
      RETURNING *
    `, [id]);

    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kateqoriya tapılmadı' },
        { status: 404 }
      )
    }

    const deletedCategory = deleteResult.rows[0];
    console.log('Category deleted successfully:', deletedCategory);
    
    return NextResponse.json({
      success: true,
      data: deletedCategory,
      message: 'Kateqoriya uğurla silindi'
    })
  } catch (error: any) {
    console.error('Database error in DELETE /api/categories/[id]:', error);
    return handleDatabaseError(error, 'DELETE /api/categories/[id]');
  } finally {
    if (client) {
      client.release();
    }
  }
}