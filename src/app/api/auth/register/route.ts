import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    // Check if request has JSON content
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, inn, country, city, address, password } = body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Bütün sahələr tələb olunur' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email }
      });
    } catch (findError) {
      console.log('Find user error (likely missing columns):', findError);
      // If column doesn't exist, assume user doesn't exist
      existingUser = null;
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email ünvanı artıq istifadə olunub' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with only basic fields that definitely exist
    let user;
    let currentPrisma = prisma;

    try {
      // Try with basic fields only (that definitely exist in current DB)
      user = await currentPrisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          inn: inn || '',
          country: country || '',
          city: city || '',
          address: address || '',
          role: 'CUSTOMER',
          isApproved: false
        }
      });
      console.log('User created successfully with basic fields:', user.id);
    } catch (createError) {
      console.log('Basic fields creation failed:', createError);
      
      // If prepared statement error, reset client and retry
      if (createError && typeof createError === 'object' && 'message' in createError) {
        const errorMessage = (createError as any).message;
        if (errorMessage.includes('prepared statement') || errorMessage.includes('42P05')) {
          console.log('Prepared statement error detected, retrying with reset client...');
          
          // Reset Prisma client
          const { PrismaClient } = await import('@prisma/client');
          currentPrisma = new PrismaClient();
          
          user = await currentPrisma.user.create({
            data: {
              email,
              password: hashedPassword,
              firstName,
              lastName,
              phone,
              inn: inn || '',
              country: country || '',
              city: city || '',
              address: address || '',
              role: 'CUSTOMER',
              isApproved: false
            }
          });
          console.log('User created successfully on retry:', user.id);
        } else {
          throw createError;
        }
      } else {
        throw createError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Qeydiyyat uğurla tamamlandı',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        inn: user.inn,
        country: user.country,
        city: user.city,
        address: user.address,
        role: user.role,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Qeydiyyat zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 