import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPrismaClient } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  let prisma;
  
  try {
    prisma = await getPrismaClient();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email və şifrə tələb olunur' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Yanlış şifrə' },
        { status: 401 }
      );
    }

    // Check if user is approved
    if (!user.isApproved) {
      return NextResponse.json(
        { error: 'Hesabınız hələ təsdiqlənməyib' },
        { status: 401 }
      );
    }

    // Return user data (without password)
    const { password: passwordField, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        name: user.name || 'User'
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Daxil olma zamanı xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    if (prisma && process.env.NODE_ENV === 'production') {
      await prisma.$disconnect();
    }
  }
} 