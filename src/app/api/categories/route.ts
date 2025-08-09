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
 * GET - Get all categories
 * Fetches all active categories
 */
export async function GET(request: NextRequest) {
  let client;
  
  try {
    console.log('Attempting to connect to database...');
    
    // Test database connection
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return errorResponse('Database configuration xətası', 500);
    }
    
    client = await pool.connect();
    console.log('Database connection successful');

    const result = await client.query(`
      SELECT id, name, description, "isActive", "createdAt", "updatedAt"
      FROM categories
      WHERE "isActive" = true
      ORDER BY name ASC
    `);
    
    console.log(`Found ${result.rows.length} categories`);
    return successResponse(result.rows, `${result.rows.length} kateqoriya tapıldı`)
  } catch (error: any) {
    console.error('Database error in GET /api/categories:', error);
    logError('GET /api/categories', error)
    
    if (error.code === 'ENOTFOUND') {
      return errorResponse('Database serverinə bağlantı qurula bilmədi', 503)
    }
    
    if (error.code === 'ECONNREFUSED') {
      return errorResponse('Database bağlantısı rədd edildi', 503)
    }
    
    if (error.message?.includes('Max client connections reached')) {
      return errorResponse('Verilənlər bazası bağlantı limiti dolub. Zəhmət olmasa bir az gözləyin.', 503)
    }
    
    if (error.message?.includes('password authentication failed')) {
      return errorResponse('Database authentication xətası', 500)
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
 * POST - Create new category
 * Creates a new category with validation
 */
export async function POST(request: NextRequest) {
  let client;
  
  try {
    console.log('Creating new category...');
    const body = await request.json()
    const { name, description, isActive } = body
    
    console.log('Category data:', { name, description, isActive });

    // Validation
    if (!name) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya adı'), 400)
    }

    client = await pool.connect();
    console.log('Database connection successful for POST');

    // Check if category with same name already exists
    const existingResult = await client.query(`
      SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND "isActive" = true
    `, [name]);
    
    if (existingResult.rows.length > 0) {
      return errorResponse('Bu adda kateqoriya artıq mövcuddur', 400);
    }

    const result = await client.query(`
      INSERT INTO categories (name, description, "isActive")
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, description || '', isActive !== false])

    console.log('Category created successfully:', result.rows[0]);
    return successResponse(result.rows[0], 'Kateqoriya uğurla yaradıldı')
  } catch (error: any) {
    console.error('Database error in POST /api/categories:', error);
    logError('POST /api/categories', error)
    
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