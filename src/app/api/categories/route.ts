import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { successResponse, errorResponse, logError, ErrorMessages } from '@/lib/api-utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * GET - Get all categories with hierarchy
 * Fetches all active categories organized by parent-child relationships
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return errorResponse('Supabase client is not configured', 500);
    }

    console.log('Fetching categories with hierarchy...');

    // Get all active categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return errorResponse(`Database xətası: ${error.message}`, 500);
    }

    // Organize categories into hierarchy
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // First pass: create map of all categories
    categories?.forEach((category: any) => {
      categoryMap.set(category.id, {
        ...category,
        children: []
      });
    });

    // Second pass: organize into hierarchy
    categories?.forEach((category: any) => {
      if (category.parentId && categoryMap.has(category.parentId)) {
        // This is a child category
        categoryMap.get(category.parentId).children.push(categoryMap.get(category.id));
      } else {
        // This is a root category
        rootCategories.push(categoryMap.get(category.id));
      }
    });

    console.log(`Found ${categories?.length || 0} categories organized into ${rootCategories.length} root categories`);
    return successResponse(rootCategories, `${categories?.length || 0} kateqoriya tapıldı`);
  } catch (error: any) {
    console.error('Database error in GET /api/categories:', error);
    logError('GET /api/categories', error);
    return errorResponse(`Database xətası: ${error.message}`, 500);
  }
}

/**
 * POST - Create new category
 * Creates a new category with validation and parent-child support
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return errorResponse('Supabase client is not configured', 500);
    }

    console.log('Creating new category...');
    const body = await request.json()
    const { name, description, isActive, parentId, sortOrder } = body
    
    console.log('Category data:', { name, description, isActive, parentId, sortOrder });

    // Validation
    if (!name) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya adı'), 400)
    }

    // Check if category with same name already exists
    const { data: existingCategory, error: existingError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .eq('isActive', true)
      .single();
    
    if (existingCategory) {
      return errorResponse('Bu adda kateqoriya artıq mövcuddur', 400);
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const { data: parentCategory, error: parentError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', parentId)
        .eq('isActive', true)
        .single();

      if (!parentCategory) {
        return errorResponse('Ana kateqoriya tapılmadı', 400);
      }
    }

    const { data: newCategory, error: insertError } = await supabase
      .from('categories')
      .insert({
        name,
        description: description || '',
        isActive: isActive !== false,
        parentId: parentId || null,
        sortOrder: sortOrder || 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating category:', insertError);
      return errorResponse(`Database xətası: ${insertError.message}`, 500);
    }

    console.log('Category created successfully:', newCategory);
    return successResponse(newCategory, 'Kateqoriya uğurla yaradıldı')
  } catch (error: any) {
    console.error('Database error in POST /api/categories:', error);
    logError('POST /api/categories', error)
    return errorResponse(`Database xətası: ${error.message}`, 500)
  }
} 