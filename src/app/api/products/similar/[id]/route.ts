import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client is not configured' },
        { status: 500 }
      );
    }

    const { id } = await params;
    const productId = id;
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // First, get the current product to find its category
    const { data: currentProduct, error: productError } = await supabase
      .from('products')
      .select('categoryId, name, artikul, catalogNumber')
      .eq('id', productId)
      .single();

    if (productError || !currentProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('Current product categoryId:', currentProduct.categoryId);
    
    // Get similar products from the same category, excluding the current product
    const { data: similarProducts, error: similarError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        salePrice,
        artikul,
        catalogNumber,
        stock,
        isActive,
        images,
        categoryId,
        categories(name)
      `)
      .eq('categoryId', currentProduct.categoryId)
      .eq('isActive', true)
      .neq('id', productId)
      .order('createdAt', { ascending: false })
      .limit(8);

    console.log('Similar products found:', similarProducts?.length || 0);
    console.log('Similar products error:', similarError);

    if (similarError) {
      console.error('Error fetching similar products:', similarError);
      return NextResponse.json(
        { error: 'Failed to fetch similar products' },
        { status: 500 }
      );
    }

    // If we don't have enough products from the same category, get products with similar names or artikul
    if (!similarProducts || similarProducts.length < 4) {
      const searchTerms = [
        currentProduct.name.split(' ')[0], // First word of product name
        currentProduct.artikul?.substring(0, 4), // First 4 characters of artikul
        currentProduct.catalogNumber?.substring(0, 4) // First 4 characters of catalog number
      ].filter(Boolean);

      if (searchTerms.length > 0) {
        const { data: additionalProducts, error: additionalError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            salePrice,
            artikul,
            catalogNumber,
            stock,
            isActive,
            images,
            categoryId,
            categories(name)
          `)
          .or(`name.ilike.%${searchTerms[0]}%,artikul.ilike.%${searchTerms[0]}%,catalogNumber.ilike.%${searchTerms[0]}%`)
          .eq('isActive', true)
          .neq('id', productId)
          .neq('categoryId', currentProduct.categoryId)
          .order('createdAt', { ascending: false })
          .limit(8 - (similarProducts?.length || 0));

        if (!additionalError && additionalProducts) {
          const combinedProducts = [...(similarProducts || []), ...additionalProducts];
          // Remove duplicates based on ID
          const uniqueProducts = combinedProducts.filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
          );

          return NextResponse.json({
            success: true,
            products: uniqueProducts.slice(0, 8)
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      products: similarProducts || []
    });

  } catch (error: any) {
    console.error('Get similar products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch similar products' },
      { status: 500 }
    );
  }
}
