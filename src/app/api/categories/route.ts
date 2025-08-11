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
    
    // First, try to get categories without parentId to see if the field exists
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, description, isActive, createdAt, updatedAt')
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
      
      // For now, return flat structure without hierarchy
      return NextResponse.json({
        success: true,
        data: categories || [],
        message: `${categories?.length || 0} kateqoriya tapıldı`
      });
      
    } catch (hierarchyError: any) {
      console.error('Error with hierarchy, trying simple query:', hierarchyError);
      
      // Fallback: try simple query without any complex fields
      const { data: simpleCategories, error: simpleError } = await supabase
        .from('categories')
        .select('*')
        .eq('isActive', true);
      
      if (simpleError) {
        console.error('Simple query also failed:', simpleError);
        return NextResponse.json(
          { success: false, error: `Database xətası: ${simpleError.message}` },
          { status: 500 }
        );
      }
      
      console.log(`Found ${simpleCategories?.length || 0} categories with simple query`);
      return NextResponse.json({
        success: true,
        data: simpleCategories || [],
        message: `${simpleCategories?.length || 0} kateqoriya tapıldı`
      });
    }
    
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

    // Create new category without parentId for now
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        name,
        description: description || '',
        isActive: isActive !== false
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