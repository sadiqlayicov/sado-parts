import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Environment variables yoxlanılır
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase client yalnız environment variables varsa yaradılır
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.error('Supabase environment variables are missing:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
}

// Get all cart items for admin
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/cart/all called');
    
    // Supabase client yoxlanılır
    if (!supabase) {
      console.log('Supabase client not available, returning empty result');
      return NextResponse.json({
        success: true,
        cartItems: [],
        totalUsers: 0,
        totalItems: 0,
        message: 'Supabase configuration missing'
      });
    }
    
    // Check if cart_items table exists
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        id, quantity, created_at,
        users!inner(id, email, first_name, last_name),
        products!inner(id, name, description, price, sale_price, images, stock, sku),
        categories(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (cartError) {
      console.log('Cart items table does not exist or error:', cartError);
      return NextResponse.json({
        success: true,
        cartItems: [],
        totalUsers: 0,
        totalItems: 0
      });
    }

    console.log('Found cart items:', cartItems?.length || 0);

    const processedCartItems = (cartItems || []).map((item: any) => {
      try {
        const quantity = parseInt(item.quantity?.toString() || '1');
        const price = parseFloat(item.products?.price?.toString() || '0');
        const salePrice = item.products?.sale_price ? parseFloat(item.products.sale_price.toString()) : price;
        
        return {
          id: item.id,
          userId: item.users?.id,
          userEmail: item.users?.email,
          userName: `${item.users?.first_name || ''} ${item.users?.last_name || ''}`.trim() || 'Unknown User',
          productId: item.products?.id,
          productName: item.products?.name || 'Unknown Product',
          productDescription: item.products?.description || '',
          price: price,
          salePrice: salePrice,
          images: item.products?.images || [],
          stock: parseInt(item.products?.stock?.toString() || '0'),
          sku: item.products?.sku || 'N/A',
          categoryName: item.categories?.name || 'General',
          quantity: quantity,
          totalPrice: price * quantity,
          totalSalePrice: salePrice * quantity,
          createdAt: item.created_at
        };
      } catch (itemError) {
        console.error('Error processing cart item:', itemError);
        return {
          id: item.id,
          userId: item.users?.id,
          userEmail: item.users?.email || 'unknown@email.com',
          userName: 'Unknown User',
          productId: item.products?.id,
          productName: 'Unknown Product',
          productDescription: '',
          price: 0,
          salePrice: 0,
          images: [],
          stock: 0,
          sku: 'N/A',
          categoryName: 'General',
          quantity: 1,
          totalPrice: 0,
          totalSalePrice: 0,
          createdAt: item.created_at
        };
      }
    });

    // Group by user
    const userCarts: Record<string, any> = {};
    processedCartItems.forEach((item: any) => {
      if (!userCarts[item.userId]) {
        userCarts[item.userId] = {
          userId: item.userId,
          userEmail: item.userEmail,
          userName: item.userName,
          items: [],
          totalItems: 0,
          totalPrice: 0,
          totalSalePrice: 0
        };
      }
      userCarts[item.userId].items.push(item);
      userCarts[item.userId].totalItems += item.quantity;
      userCarts[item.userId].totalPrice += item.totalPrice;
      userCarts[item.userId].totalSalePrice += item.totalSalePrice;
    });

    console.log('Processed user carts:', Object.keys(userCarts).length);

    return NextResponse.json({
      success: true,
      cartItems: Object.values(userCarts),
      totalUsers: Object.keys(userCarts).length,
      totalItems: processedCartItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
    });

  } catch (error) {
    console.error('Get all cart items error:', error);
    return NextResponse.json(
      { error: 'Səbət məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 