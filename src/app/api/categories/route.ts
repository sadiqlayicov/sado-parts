import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Real Supabase credentials
const supabaseUrl = 'https://aws-0-eu-north-1.pooler.supabase.co';
const supabaseKey = 'sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI';

console.log('Connecting to real Supabase database...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length || 0);

let supabase: any = null;
try {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('Supabase client created successfully');
} catch (error) {
  console.error('Error creating Supabase client:', error);
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/categories called');
    
    if (!supabase) {
      console.error('Supabase client is null');
      return NextResponse.json(
        { success: false, error: 'Supabase client is not configured' },
        { status: 500 }
      );
    }

    console.log('Testing Supabase connection...');

    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Connection test failed:', testError);
      return NextResponse.json(
        { success: false, error: `Database bağlantı xətası: ${testError.message}` },
        { status: 500 }
      );
    }
    
    console.log('Database connection successful, fetching categories...');

    // Get all active categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { success: false, error: `Database xətası: ${error.message}` },
        { status: 500 }
      );
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
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase client is not configured' },
        { status: 500 }
      );
    }

    console.log('Creating new category...');
    const body = await request.json()
    const { name, description, isActive, parentId, sortOrder } = body
    
    console.log('Category data:', { name, description, isActive, parentId, sortOrder });

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

    // If parentId is provided, verify it exists
    if (parentId) {
      const { data: parentCategory, error: parentError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', parentId)
        .eq('isActive', true)
        .single();

      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: 'Ana kateqoriya tapılmadı' },
          { status: 400 }
        );
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
      return NextResponse.json(
        { success: false, error: `Database xətası: ${insertError.message}` },
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