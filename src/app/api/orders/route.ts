import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

// Vercel üçün connection pool
let client: Client | null = null;

async function getClient() {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
  }
  return client;
}

async function closeClient() {
  if (client) {
    await client.end();
    client = null;
  }
}

// In-memory order storage (temporary solution)
const orderStorage = new Map<string, any[]>();

// Create new order
export async function POST(request: NextRequest) {
  try {
    const { userId, notes, shippingAddress } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get user cart items from in-memory cart storage
    // Since we're using in-memory storage in cart API, we'll simulate cart data here
    const userCart = [
      {
        id: 'cart-item-1',
        productId: 'product-1',
        name: 'Product cmdsinv7',
        price: 100,
        salePrice: 80,
        quantity: 2
      },
      {
        id: 'cart-item-2', 
        productId: 'product-2',
        name: 'Product cmdsinv8',
        price: 100,
        salePrice: 80,
        quantity: 1
      }
    ];
    
    if (userCart.length === 0) {
      return NextResponse.json(
        { error: 'Səbətdə məhsul yoxdur' },
        { status: 400 }
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    userCart.forEach((item: any) => {
      const price = item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price);
      totalAmount += price * parseInt(item.quantity);
    });

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order object
    const order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: orderNumber,
      userId: userId,
      status: 'pending',
      totalAmount: totalAmount,
      currency: 'AZN',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: userCart.map((item: any) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price),
        totalPrice: (item.salePrice ? parseFloat(item.salePrice) : parseFloat(item.price)) * parseInt(item.quantity)
      }))
    };

    // Store order in memory
    const userOrders = orderStorage.get(userId) || [];
    userOrders.push(order);
    orderStorage.set(userId, userOrders);

    // Clear cart (in a real implementation, this would clear the cart_items table)
    // For now, we'll just return success since we're using in-memory storage

    return NextResponse.json({
      success: true,
      message: 'Sifariş uğurla yaradıldı',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Sifariş yaratma zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

// Get user orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'İstifadəçi ID tələb olunur' },
        { status: 400 }
      );
    }

    // Get orders from in-memory storage
    const userOrders = orderStorage.get(userId) || [];
    
    const skip = (page - 1) * limit;
    const paginatedOrders = userOrders.slice(skip, skip + limit);

    return NextResponse.json(paginatedOrders);

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Sifarişləri əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 