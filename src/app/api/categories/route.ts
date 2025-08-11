import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

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

export async function GET(request: NextRequest) {
  let client;
  
  try {
    console.log('GET /api/categories called');
    
    client = await pool.connect();
    console.log('Database connected successfully');

    // Get all active categories
    const categoriesResult = await client.query(`
      SELECT 
        id,
        name,
        description,
        "isActive",
        "parentId",
        "sortOrder",
        "createdAt",
        "updatedAt"
      FROM categories 
      WHERE "isActive" = true 
      ORDER BY "sortOrder" ASC, "createdAt" DESC
    `);

    const categories = categoriesResult.rows;
    console.log(`Found ${categories.length} categories`);

    return NextResponse.json({
      success: true,
      data: categories,
      message: `${categories.length} kateqoriya tapıldı`
    });
    
  } catch (error: any) {
    console.error('Database error in GET /api/categories:', error);
    
    if (error.message?.includes('relation "categories" does not exist')) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Kateqoriyalar cədvəli mövcud deyil'
      });
    }
    
    return handleDatabaseError(error, 'GET /api/categories');
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
      return NextResponse.json(
        { success: false, error: 'Kateqoriya adı tələb olunur' },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Check if category with same name already exists
    const existingResult = await client.query(`
      SELECT id FROM categories 
      WHERE name = $1 AND "isActive" = true
    `, [name]);
    
    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu adda kateqoriya artıq mövcuddur' },
        { status: 400 }
      );
    }

    // Create new category
    const newCategoryResult = await client.query(`
      INSERT INTO categories (name, description, "isActive", "parentId", "sortOrder", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [
      name,
      description || '',
      isActive !== false,
      parentId || null,
      sortOrder || 0
    ]);

    const newCategory = newCategoryResult.rows[0];
    console.log('Category created successfully:', newCategory);
    
    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Kateqoriya uğurla yaradıldı'
    });
  } catch (error: any) {
    console.error('Database error in POST /api/categories:', error);
    return handleDatabaseError(error, 'POST /api/categories');
  } finally {
    if (client) {
      client.release();
    }
  }
} 