import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 10000)
}

// GET - Get all orders
export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      include: { user: true, orderItems: true }
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Sifarişləri əldə etmə xətası' },
      { status: 500 }
    )
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, items, status, totalAmount, shippingAddress, billingAddress, paymentMethod, paymentStatus, notes } = body

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: status || 'PENDING',
        totalAmount: parseFloat(totalAmount),
        shippingAddress,
        billingAddress,
        paymentMethod,
        paymentStatus: paymentStatus || 'PENDING',
        notes,
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.price)
          }))
        }
      },
      include: { user: true, orderItems: true }
    })

    return NextResponse.json({
      message: 'Sifariş uğurla əlavə olundu',
      order
    }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Sifariş əlavə etmə xətası' },
      { status: 500 }
    )
  }
} 