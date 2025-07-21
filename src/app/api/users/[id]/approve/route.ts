import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Approve user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      )
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        isApproved: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isApproved: true,
        isActive: true
      }
    })

    return NextResponse.json({
      message: 'İstifadəçi uğurla təsdiqləndi',
      user
    })
  } catch (error) {
    console.error('Approve user error:', error)
    return NextResponse.json(
      { error: 'İstifadəçi təsdiqləmə xətası' },
      { status: 500 }
    )
  }
} 