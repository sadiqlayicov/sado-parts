import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient, cleanupClient } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  let client: any = null
  try {
    client = await getPrismaClient()
    const body = await request.json().catch(() => ({}))
    const { orderIds, deleteAll } = body || {}

    if (!deleteAll && (!Array.isArray(orderIds) || orderIds.length === 0)) {
      return NextResponse.json({ success: false, error: 'orderIds boşdur' }, { status: 400 })
    }

    const whereOrders = deleteAll ? {} : { id: { in: orderIds } }

    // First delete related order items
    const orders = await client.order.findMany({ where: whereOrders, select: { id: true } })
    const ids = orders.map((o: any) => o.id)
    if (ids.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    await client.orderItem.deleteMany({ where: { orderId: { in: ids } } })
    await client.order.deleteMany({ where: { id: { in: ids } } })

    await cleanupClient(client)
    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error: any) {
    console.error('Bulk delete orders error:', error)
    if (client) await cleanupClient(client)
    return NextResponse.json({ success: false, error: 'Silinmə zamanı xəta' }, { status: 500 })
  }
}


