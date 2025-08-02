import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      inn, 
      address, 
      country, 
      city 
    } = await request.json();

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, şifrə, ad və soyad tələb olunur' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email ünvanı artıq istifadə olunub' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        phone: phone || null,
        isAdmin: false,
        isApproved: false,
      },
    });

    // Create default address if provided
    if (address && country && city) {
      await prisma.address.create({
        data: {
          street: address,
          city,
          country,
          state: '',
          postalCode: '',
          isDefault: true,
          userId: user.id,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Qeydiyyat uğurla tamamlandı. Hesabınız admin tərəfindən təsdiqlənəndən sonra daxil ola biləcəksiniz.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isApproved: user.isApproved,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Qeydiyyat xətası' },
      { status: 500 }
    );
  }
} 