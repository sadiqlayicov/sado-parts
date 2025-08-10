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

    const { orderId, status } = await request.json();
    
    console.log('POST /api/admin/orders/update-status called with:', { orderId, status });

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Sifariş ID və status tələb olunur' },
        { status: 400 }
      );
    }

    // Validate status - include new statuses from the order system
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Etibarsız status' },
        { status: 400 }
      );
    }
    
    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: status, 
        updatedAt: new Date().toISOString() 
      })
      .eq('id', orderId)
      .select('id, orderNumber, status')
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Status yeniləmə zamanı xəta baş verdi' },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      );
    }

    console.log('Order status updated:', updatedOrder);

    return NextResponse.json({
      success: true,
      message: 'Sifariş statusu uğurla yeniləndi',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status
      }
    });

  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: 'Status yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 