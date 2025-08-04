import { NextRequest, NextResponse } from 'next/server';

// In-memory order storage (shared with main orders API)
const orderStorage = new Map<string, any[]>();

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId } = await request.json();

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: 'Sifariş ID və İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get user orders from in-memory storage
    const userOrders = orderStorage.get(userId) || [];
    
    // Find the order
    const orderIndex = userOrders.findIndex((order: any) => order.id === orderId);
    
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      );
    }

    // Update order status to 'completed' (waiting for admin approval)
    userOrders[orderIndex].status = 'completed';
    userOrders[orderIndex].updatedAt = new Date().toISOString();
    
    // Save updated orders
    orderStorage.set(userId, userOrders);

    return NextResponse.json({
      success: true,
      message: 'Sifariş uğurla tamamlandı',
      order: {
        id: userOrders[orderIndex].id,
        orderNumber: userOrders[orderIndex].orderNumber,
        status: userOrders[orderIndex].status
      }
    });

  } catch (error) {
    console.error('Complete order error:', error);
    return NextResponse.json(
      { error: 'Sifariş tamamlama zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 