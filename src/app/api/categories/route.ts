import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/categories called');
    
    // Test with direct fetch first
    console.log('Testing direct fetch to Supabase...');
    
    const response = await fetch('https://aws-0-eu-north-1.pooler.supabase.co/rest/v1/categories?select=*&isActive=eq.true', {
      headers: {
        'apikey': 'sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI',
        'Authorization': 'Bearer sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Direct fetch failed:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, error: `Direct fetch failed: ${response.status}` },
        { status: 500 }
      );
    }
    
    const categories = await response.json();
    console.log('Direct fetch successful, found categories:', categories.length);
    
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

    // Create new category using direct fetch
    const response = await fetch('https://aws-0-eu-north-1.pooler.supabase.co/rest/v1/categories', {
      method: 'POST',
      headers: {
        'apikey': 'sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI',
        'Authorization': 'Bearer sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name,
        description: description || '',
        isActive: isActive !== false,
        parentId: parentId || null,
        sortOrder: sortOrder || 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating category:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Database xətası: ${response.status}` },
        { status: 500 }
      );
    }

    const newCategory = await response.json();
    console.log('Category created successfully:', newCategory);
    
    return NextResponse.json({
      success: true,
      data: newCategory[0], // Supabase returns array
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