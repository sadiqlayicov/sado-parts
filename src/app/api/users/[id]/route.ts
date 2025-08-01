import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, email, phone, country, city, inn, address, role, isApproved, isActive, discountPercentage } = body;

    // Validate user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName !== undefined ? firstName : existingUser.firstName,
        lastName: lastName !== undefined ? lastName : existingUser.lastName,
        email: email !== undefined ? email : existingUser.email,
        phone: phone !== undefined ? phone : existingUser.phone,
        country: country !== undefined ? country : existingUser.country,
        city: city !== undefined ? city : existingUser.city,
        inn: inn !== undefined ? inn : existingUser.inn,
        address: address !== undefined ? address : existingUser.address,
        role: role !== undefined ? role : existingUser.role,
        isApproved: isApproved !== undefined ? isApproved : existingUser.isApproved,
        isActive: isActive !== undefined ? isActive : existingUser.isActive,
        discountPercentage: discountPercentage !== undefined ? discountPercentage : existingUser.discountPercentage
      }
    });

    return NextResponse.json({
      success: true,
      message: 'İstifadəçi məlumatları yeniləndi',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        country: updatedUser.country,
        city: updatedUser.city,
        inn: updatedUser.inn,
        address: updatedUser.address,
        role: updatedUser.role,
        isApproved: updatedUser.isApproved,
        isActive: updatedUser.isActive,
        discountPercentage: updatedUser.discountPercentage
      }
    });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'İstifadəçi məlumatlarını yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        city: true,
        inn: true,
        address: true,
        role: true,
        isApproved: true,
        isActive: true,
        discountPercentage: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      user: {
        ...user
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'İstifadəçi məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 