import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPrismaClient } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  let prisma;
  
  try {
    prisma = await getPrismaClient();
    
    const { 
      email, 
      password, 
      name, 
      phone 
    } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email və şifrə tələb olunur' },
        { status: 200 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Bu email ünvanı artıq istifadə olunub' },
        { status: 200 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'User',
        phone,
        isApproved: true, // Approved by default as requested
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Qeydiyyat uğurla tamamlandı. İndi daxil ola bilərsiniz.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          isApproved: true,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Bu email ünvanı artıq istifadə olunub' },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Qeydiyyat zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (prisma && process.env.NODE_ENV === 'production') {
      await prisma.$disconnect();
    }
  }
} 