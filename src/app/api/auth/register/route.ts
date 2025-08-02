import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      password, 
      name,
      firstName, 
      lastName, 
      phone, 
      inn, 
      address, 
      country, 
      city 
    } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email və şifrə tələb olunur' },
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

    // Create user with name from firstName+lastName or name field
    const userName = name || (firstName && lastName ? `${firstName} ${lastName}` : 'User');

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: userName,
        phone: phone || null,
        isAdmin: false,
        isApproved: true, // Auto-approve for now
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
        message: 'Qeydiyyat uğurla tamamlandı.',
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