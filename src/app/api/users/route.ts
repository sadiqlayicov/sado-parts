import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const isApproved = searchParams.get('isApproved')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.role = role
    }

    if (isApproved !== null) {
      where.isApproved = isApproved === 'true'
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'İstifadəçiləri əldə etmə xətası' },
      { status: 500 }
    )
  }
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email və şifrə tələb olunur' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email artıq istifadə olunub' },
        { status: 400 }
      )
    }

    const { hashPassword } = await import('@/lib/auth')
    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || 'CUSTOMER',
        isApproved: true
      }
    })

    return NextResponse.json({
      message: 'İstifadəçi uğurla yaradıldı',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'İstifadəçi yaratma xətası' },
      { status: 500 }
    )
  }
} 