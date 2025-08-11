import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { successResponse, errorResponse, logError, ErrorMessages } from '@/lib/api-utils'

// Temporary hardcoded Supabase credentials for Vercel deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://chiptvdjdcvuowfiggwe.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaXB0dmRqZGN2dW93ZmlnZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY4NzI5MCwiZXhwIjoyMDUxMjYzMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * GET - Get single category by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) {
      return errorResponse('Supabase client is not configured', 500);
    }

    const { id } = await params;
    
    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya ID'), 400)
    }

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      return errorResponse(ErrorMessages.NOT_FOUND('Kateqoriya'), 404)
    }

    return successResponse(category, 'Kateqoriya tapıldı')
  } catch (error: any) {
    logError('GET /api/categories/[id]', error)
    return errorResponse(ErrorMessages.INTERNAL_ERROR, 500)
  }
}

/**
 * PUT - Update category by ID with parent-child support
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) {
      return errorResponse('Supabase client is not configured', 500);
    }

    const { id } = await params;
    const body = await request.json()
    const { name, description, isActive, parentId, sortOrder } = body
    
    console.log('Updating category:', { id, name, description, isActive, parentId, sortOrder });

    if (!id) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya ID'), 400)
    }

    if (!name) {
      return errorResponse(ErrorMessages.REQUIRED_FIELD('Kateqoriya adı'), 400)
    }

    // Check if another category with same name already exists (excluding current one)
    const { data: existingCategory, error: existingError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .eq('isActive', true)
      .neq('id', id)
      .single();
    
    if (existingCategory) {
      return errorResponse('Bu adda başqa kateqoriya artıq mövcuddur', 400);
    }

    // If parentId is provided, verify it exists and is not the same as current category
    if (parentId) {
      if (parentId === id) {
        return errorResponse('Kateqoriya özünün alt kateqoriyası ola bilməz', 400);
      }

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

    const { data: updatedCategory, error: updateError } = await supabase
      .from('categories')
      .update({
        name,
        description: description || '',
        isActive: isActive !== false,
        parentId: parentId || null,
        sortOrder: sortOrder || 0,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedCategory) {
      console.error('Error updating category:', updateError);
      return errorResponse(ErrorMessages.NOT_FOUND('Kateqoriya'), 404)
    }

    console.log('Category updated successfully:', updatedCategory);
    return successResponse(updatedCategory, 'Kateqoriya uğurla yeniləndi')
  } catch (error: any) {
    console.error('Database error in PUT /api/categories/[id]:', error);
    logError('PUT /api/categories/[id]', error)
    return errorResponse(`Database xətası: ${error.message}`, 500)
  }
}

/**
 * DELETE - Delete category by ID (soft delete by setting isActive to false)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabase) {
      return errorResponse('Supabase client is not configured', 500);
    }

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

    // Check if category has products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('categoryId', id)
      .eq('isActive', true);

    const productCount = productsData?.length || 0;
    console.log(`Category has ${productCount} products`);
    
    if (productCount > 0) {
      if (!forceDelete) {
        return errorResponse(`Bu kateqoriyada ${productCount} məhsul var. Əvvəlcə məhsulları başqa kateqoriyaya köçürün və ya silin.`, 400)
      }
      
      // Find or create "Ümumi" category
      let { data: defaultCategory, error: defaultError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Ümumi')
        .eq('isActive', true)
        .single();
      
      let defaultCategoryId;
      if (!defaultCategory) {
        // Create "Ümumi" category
        const { data: newDefaultCategory, error: createError } = await supabase
          .from('categories')
          .insert({
            name: 'Ümumi',
            description: 'Ümumi kateqoriya',
            isActive: true
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating default category:', createError);
          return errorResponse('Ümumi kateqoriya yaradıla bilmədi', 500);
        }
        defaultCategoryId = newDefaultCategory.id;
      } else {
        defaultCategoryId = defaultCategory.id;
      }
      
      // Move all products to default category
      const { error: moveError } = await supabase
        .from('products')
        .update({
          categoryId: defaultCategoryId,
          updatedAt: new Date().toISOString()
        })
        .eq('categoryId', id)
        .eq('isActive', true);

      if (moveError) {
        console.error('Error moving products:', moveError);
        return errorResponse('Məhsullar köçürülə bilmədi', 500);
      }
    }

    // Soft delete - set isActive to false
    const { data: deletedCategory, error: deleteError } = await supabase
      .from('categories')
      .update({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (deleteError || !deletedCategory) {
      console.error('Error deleting category:', deleteError);
      return errorResponse(ErrorMessages.NOT_FOUND('Kateqoriya'), 404)
    }

    console.log('Category deleted successfully:', deletedCategory);
    return successResponse(deletedCategory, 'Kateqoriya uğurla silindi')
  } catch (error: any) {
    console.error('Database error in DELETE /api/categories/[id]:', error);
    logError('DELETE /api/categories/[id]', error)
    return errorResponse(`Database xətası: ${error.message}`, 500)
  }
}