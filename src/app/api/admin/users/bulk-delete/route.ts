import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient, cleanupClient } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  let client: any = null
  try {
    client = await getPrismaClient()
    const body = await request.json().catch(() => ({}))
    const { userIds, deleteAll } = body || {}

    if (!deleteAll && (!Array.isArray(userIds) || userIds.length === 0)) {
      return NextResponse.json({ success: false, error: 'userIds boşdur' }, { status: 400 })
    }

    // Protect admin accounts by default
    const adminGuard = { role: { not: 'ADMIN' as any } }

    // If deleteAll: collect all (non-admin) users
    const whereUsers = deleteAll ? adminGuard : { id: { in: userIds }, ...adminGuard }

    // Cascade delete: orders, order_items done via relation; explicitly clear carts/reviews/addresses
    const users = await client.user.findMany({ where: whereUsers, select: { id: true } })
    const ids = users.map((u: any) => u.id)
    if (ids.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    await client.order.deleteMany({ where: { userId: { in: ids } } })
    await client.review.deleteMany({ where: { userId: { in: ids } } })
    await client.address.deleteMany({ where: { userId: { in: ids } } })
    await client.user.deleteMany({ where: { id: { in: ids } } })

    await cleanupClient(client)
    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (error: any) {
    console.error('Bulk delete users error:', error)
    if (client) await cleanupClient(client)
    return NextResponse.json({ success: false, error: 'Silinmə zamanı xəta' }, { status: 500 })
  }
}


