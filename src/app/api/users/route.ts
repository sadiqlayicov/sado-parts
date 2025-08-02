import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Prisma Client-i yenidən başlatmaq üçün funksiya
async function resetPrismaClient() {
  try {
    await prisma.$disconnect();
    const { PrismaClient } = await import('@prisma/client');
    const newPrisma = new PrismaClient();
    return newPrisma;
  } catch (error) {
    console.error('Prisma Client reset error:', error);
    return prisma;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isAdmin = searchParams.get('isAdmin')
    const isApproved = searchParams.get('isApproved')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isAdmin !== null) {
      where.isAdmin = isAdmin === 'true'
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
          name: true,
          phone: true,
          isApproved: true,
          isAdmin: true,
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
    
    // PostgreSQL prepared statement xətası üçün xüsusi handling
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage.includes('prepared statement') || errorMessage.includes('42P05') || errorMessage.includes('26000')) {
        console.log('PostgreSQL prepared statement xətası aşkarlandı, Prisma Client yenidən başladılır...');
        try {
          // Prisma Client-i yenidən başlat
          const newPrisma = await resetPrismaClient();
          
          // Qısa müddət gözlə
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Yenidən cəhd et
          const { searchParams } = new URL(request.url)
          const page = parseInt(searchParams.get('page') || '1')
          const limit = parseInt(searchParams.get('limit') || '10')
          const search = searchParams.get('search') || ''
          const isAdmin = searchParams.get('isAdmin')
          const isApproved = searchParams.get('isApproved')

          const skip = (page - 1) * limit

          const where: any = {}

          if (search) {
            where.OR = [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } }
            ]
          }

          if (isAdmin !== null) {
            where.isAdmin = isAdmin === 'true'
          }

          if (isApproved !== null) {
            where.isApproved = isApproved === 'true'
          }

          const [users, total] = await Promise.all([
            newPrisma.user.findMany({
              where,
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                isApproved: true,
                isAdmin: true,
                createdAt: true,
                updatedAt: true
              },
              skip,
              take: limit,
              orderBy: { createdAt: 'desc' }
            }),
            newPrisma.user.count({ where })
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
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          return NextResponse.json(
            { error: 'Verilənlər bazası xətası' },
            { status: 500 }
          );
        }
      }
    }
    
    return NextResponse.json(
      { error: 'İstifadəçiləri yükləmək mümkün olmadı' },
      { status: 500 }
    );
  }
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, isAdmin } = body

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
        name,
        phone,
        isAdmin: isAdmin || false,
        isApproved: true
      }
    })

    return NextResponse.json({
      message: 'İstifadəçi uğurla yaradıldı',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
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