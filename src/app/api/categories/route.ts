import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/categories called');
    
    if (!supabase) {
      console.error('Supabase client is not configured');
      return NextResponse.json(
        { success: false, error: 'Database configuration xətası' },
        { status: 500 }
      );
    }
    
    console.log('Fetching categories from Supabase...');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: `Database xətası: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Found ${categories?.length || 0} categories`);
    
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

    console.log(`Organized into ${rootCategories.length} root categories`);
    return NextResponse.json({
      success: true,
      data: rootCategories,
      message: `${categories?.length || 0} kateqoriya tapıldı`
    });
  } catch (error: any) {
    console.error('Database error in GET /api/categories:', error);
    return NextResponse.json(
      { success: false, error: `Database xətası: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/categories called');
    
    if (!supabase) {
      console.error('Supabase client is not configured');
      return NextResponse.json(
        { success: false, error: 'Database configuration xətası' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { name, description, isActive, parentId, sortOrder } = body;
    
    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Kateqoriya adı tələb olunur' },
        { status: 400 }
      );
    }

    // Check if category with same name already exists
    const { data: existingCategory, error: existingError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .eq('isActive', true)
      .single();
    
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Bu adda kateqoriya artıq mövcuddur' },
        { status: 400 }
      );
    }

    // Create new category
    const { data: newCategory, error } = await supabase
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

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json(
        { success: false, error: `Database xətası: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Category created successfully:', newCategory);
    
    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Kateqoriya uğurla yaradıldı'
    });
  } catch (error: any) {
    console.error('Database error in POST /api/categories:', error);
    return NextResponse.json(
      { success: false, error: `Database xətası: ${error.message}` },
      { status: 500 }
    );
  }
} 