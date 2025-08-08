import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  let prisma;
  
  try {
    prisma = await getPrismaClient();
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isAdmin = searchParams.get('isAdmin')
    const isApproved = searchParams.get('isApproved')

    const skip = (page - 1) * limit

    // Build where conditions
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isAdmin !== null) {
      where.isAdmin = isAdmin === 'true';
    }

    if (isApproved !== null) {
      where.isApproved = isApproved === 'true';
    }

    // Get users with count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          orders: {
            select: {
              id: true,
              totalAmount: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Transform users for frontend compatibility
    const transformedUsers = users.map(user => {
      const ordersCount = user.orders.length;
      const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name || 'User',
        phone: user.phone || '—',
        isAdmin: user.isAdmin,
        isApproved: user.isApproved,
        discount: user.isApproved ? 0 : 0,
        discountPercentage: 0,
        ordersCount,
        totalSpent,
        lastLogin: user.updatedAt,
        registrationDate: user.createdAt,
        country: '—',
        city: '—',
        inn: '—',
        address: '—'
      };
    });

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'İstifadəçiləri yükləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (prisma && process.env.NODE_ENV === 'production') {
      await prisma.$disconnect();
    }
  }
}

export async function POST(request: NextRequest) {
  let prisma;
  
  try {
    prisma = await getPrismaClient();
    
    const body = await request.json();
    const { email, name, phone, isAdmin, isApproved } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email tələb olunur' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email ünvanı artıq istifadə olunub' },
        { status: 400 }
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || 'User',
        phone,
        isAdmin: isAdmin || false,
        isApproved: isApproved !== false,
        password: 'temp_password' // Will be changed by user
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isApproved: user.isApproved
      }
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Bu email ünvanı artıq istifadə olunub' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'İstifadəçi yaratma zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (prisma && process.env.NODE_ENV === 'production') {
      await prisma.$disconnect();
    }
  }
} 