import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  let client: any = null
  
  try {
    client = await getPrismaClient()
    
    // Təsdiqlənməmiş istifadəçiləri tap
    const unapprovedUsers = await client.user.findMany({
      where: {
        isApproved: false,
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 saat əvvəl
        }
      }
    })

    console.log(`Found ${unapprovedUsers.length} unapproved users to delete`)

    // Təsdiqlənməmiş istifadəçiləri sil
    const deletePromises = unapprovedUsers.map(async (user: any) => {
      try {
        // Əvvəlcə əlaqəli məlumatları sil
        await client.order.deleteMany({
          where: { userId: user.id }
        })

        await client.review.deleteMany({
          where: { userId: user.id }
        })

        await client.address.deleteMany({
          where: { userId: user.id }
        })

        // İstifadəçini sil
        await client.user.delete({
          where: { id: user.id }
        })

        return { success: true, userId: user.id }
      } catch (deleteError) {
        console.error(`Failed to delete user ${user.id}:`, deleteError)
        return { success: false, userId: user.id, error: deleteError }
      }
    })

    const results = await Promise.all(deletePromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    await client.$disconnect()

    return NextResponse.json({
      message: 'Cleanup completed',
      totalFound: unapprovedUsers.length,
      successful,
      failed,
      results
    })
  } catch (error) {
    if (client) {
      try {
        await client.$disconnect()
      } catch (disconnectError) {
        console.error('Disconnect error:', disconnectError)
      }
    }
    
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to perform cleanup' },
      { status: 500 }
    )
  }
} 