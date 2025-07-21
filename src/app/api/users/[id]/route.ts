import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    if (!user) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      )
    }
    return NextResponse.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'İstifadəçi əldə etmə xətası' },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { firstName, lastName, phone, role, isApproved, isActive } = body
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        phone,
        role,
        isApproved,
        isActive
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    return NextResponse.json({
      message: 'İstifadəçi uğurla yeniləndi',
      user
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'İstifadəçi yeniləmə xətası' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({
      where: { id: params.id }
    })
    return NextResponse.json({
      message: 'İstifadəçi uğurla silindi'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'İstifadəçi silmə xətası' },
      { status: 500 }
    )
  }
} 