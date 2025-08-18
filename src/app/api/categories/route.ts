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

    // Ensure hierarchy columns exist
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "parentId" TEXT'); } catch {}
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0'); } catch {}

    // Get all active categories flat
    const categoriesResult = await client.query(`
      SELECT 
        id,
        name,
        description,
        "isActive",
        "parentId",
        COALESCE("sortOrder", 0) as "sortOrder",
        "createdAt",
        "updatedAt"
      FROM categories 
      WHERE "isActive" = true 
      ORDER BY COALESCE("sortOrder",0) ASC, name ASC
    `);

    const rows = categoriesResult.rows as any[];

    // Build nested tree
    const map = new Map<string, any>();
    rows.forEach(r => map.set(r.id, { ...r, children: [] }));
    const roots: any[] = [];
    rows.forEach(r => {
      const node = map.get(r.id);
      if (r.parentId && map.has(r.parentId)) {
        map.get(r.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortChildren = (list: any[]) => {
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
      list.forEach(n => { if (n.children && n.children.length) sortChildren(n.children); });
    };
    sortChildren(roots);

    console.log(`Found ${rows.length} categories, roots: ${roots.length}`);

    return NextResponse.json({
      success: true,
      data: roots,
      message: `${rows.length} kateqoriya tapıldı`
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

    // Ensure columns
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "parentId" TEXT'); } catch {}
    try { await client.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0'); } catch {}

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

    // Create new category (with optional parent)
    const newCategoryResult = await client.query(`
      INSERT INTO categories (name, description, "isActive", "parentId", "sortOrder", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, COALESCE($5,0), NOW(), NOW())
      RETURNING *
    `, [
      name,
      description || '',
      isActive !== false,
      parentId || null,
      sortOrder ?? 0
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