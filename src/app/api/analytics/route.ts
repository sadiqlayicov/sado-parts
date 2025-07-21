import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get analytics summary
export async function GET(request: NextRequest) {
  try {
    const [productCount, userCount, orderCount, totalSales] = await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } })
    ])
    return NextResponse.json({
      productCount,
      userCount,
      orderCount,
      totalSales: totalSales._sum.totalAmount || 0
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: 'Analytics məlumatlarını əldə etmə xətası' },
      { status: 500 }
    )
  }
} 