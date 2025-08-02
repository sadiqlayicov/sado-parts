import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get single order
export async function GET(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { user: true }
    })
    if (!order) {
      return NextResponse.json(
        { error: 'Sifariş tapılmadı' },
        { status: 404 }
      )
    }
    return NextResponse.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { error: 'Sifarişi əldə etmə xətası' },
      { status: 500 }
    )
  }
}

// PUT - Update order (status və digər sahələr)
export async function PUT(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  try {
    const body = await request.json()
    const { status, totalAmount } = body
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        totalAmount: totalAmount ? parseFloat(totalAmount) : undefined
      },
      include: { user: true }
    })
    return NextResponse.json({
      message: 'Sifariş uğurla yeniləndi',
      order
    })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { error: 'Sifarişi yeniləmə xətası' },
      { status: 500 }
    )
  }
}

// DELETE - Delete order
export async function DELETE(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  try {
    await prisma.order.delete({
      where: { id: params.id }
    })
    return NextResponse.json({
      message: 'Sifariş uğurla silindi'
    })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json(
      { error: 'Sifarişi silmə xətası' },
      { status: 500 }
    )
  }
} 