import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client is not configured' },
        { status: 500 }
      );
    }

    const { orderId, itemId, quantity } = await request.json();
    
    console.log('POST /api/admin/orders/update-item-quantity called with:', { orderId, itemId, quantity });

    if (!orderId || !itemId || !quantity) {
      return NextResponse.json(
        { error: 'Sifariş ID, məhsul ID və sayı tələb olunur' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Məhsul sayı 1-dən az ola bilməz' },
        { status: 400 }
      );
    }
    
    // Update item quantity
    const { data: updatedItem, error: itemError } = await supabase
      .from('order_items')
      .update({ 
        quantity: quantity, 
        updatedAt: new Date().toISOString() 
      })
      .eq('id', itemId)
      .eq('orderId', orderId)
      .select('id, quantity, price')
      .single();

    if (itemError) {
      console.error('Error updating item quantity:', itemError);
      return NextResponse.json(
        { error: 'Məhsul sayı yeniləmə zamanı xəta baş verdi' },
        { status: 500 }
      );
    }

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Məhsul tapılmadı' },
        { status: 404 }
      );
    }

    const newTotalPrice = parseFloat(updatedItem.price) * quantity;

    // Get total amount for the order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('quantity, price')
      .eq('orderId', orderId);

    if (itemsError) {
      console.error('Error getting order items:', itemsError);
      return NextResponse.json(
        { error: 'Sifariş məlumatları əldə etmə zamanı xəta baş verdi' },
        { status: 500 }
      );
    }

    const totalAmount = orderItems?.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0) || 0;

    // Update order total amount
    const { data: updatedOrder, error: orderError } = await supabase
      .from('orders')
      .update({ 
        totalAmount: totalAmount, 
        updatedAt: new Date().toISOString() 
      })
      .eq('id', orderId)
      .select('id, totalAmount')
      .single();

    if (orderError) {
      console.error('Error updating order total:', orderError);
      return NextResponse.json(
        { error: 'Sifariş yeniləmə zamanı xəta baş verdi' },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      );
    }

    console.log('Item quantity updated:', { itemId, quantity, newTotalPrice, orderTotal: updatedOrder.totalAmount });

    return NextResponse.json({
      success: true,
      message: 'Məhsul sayı uğurla yeniləndi',
      data: {
        itemId,
        quantity,
        totalPrice: newTotalPrice,
        orderTotal: updatedOrder.totalAmount,
        itemCount: orderItems?.length || 0
      }
    });

  } catch (error) {
    console.error('Update item quantity error:', error);
    return NextResponse.json(
      { error: 'Məhsul sayı yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 