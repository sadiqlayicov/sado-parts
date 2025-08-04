import { NextRequest, NextResponse } from 'next/server';

// In-memory order storage (shared with main orders API)
const orderStorage = new Map<string, any[]>();

export async function POST(request: NextRequest) {
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Sifariş ID və status tələb olunur' },
        { status: 400 }
      );
    }

    // Find the order in all users' orders
    let foundOrder = null;
    let foundUserId = null;
    
    for (const [userId, userOrders] of orderStorage.entries()) {
      const orderIndex = userOrders.findIndex((order: any) => order.id === orderId);
      if (orderIndex !== -1) {
        foundOrder = userOrders[orderIndex];
        foundUserId = userId;
        break;
      }
    }
    
    if (!foundOrder) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      );
    }

    // Update order status
    const userOrders = orderStorage.get(foundUserId!) || [];
    const orderIndex = userOrders.findIndex((order: any) => order.id === orderId);
    
    userOrders[orderIndex].status = status;
    userOrders[orderIndex].updatedAt = new Date().toISOString();
    
    // Save updated orders
    orderStorage.set(foundUserId!, userOrders);

    return NextResponse.json({
      success: true,
      message: 'Sifariş statusu uğurla yeniləndi',
      order: {
        id: userOrders[orderIndex].id,
        orderNumber: userOrders[orderIndex].orderNumber,
        status: userOrders[orderIndex].status
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: 'Sifariş statusu yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 