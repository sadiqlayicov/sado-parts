import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isApproved, action } = body;

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

    // Determine the action and update accordingly
    let updateData: any = {};
    let message = '';

    if (action === 'approve') {
      updateData = { isApproved: true };
      message = 'İstifadəçi uğurla təsdiqləndi!';
    } else if (action === 'block') {
      updateData = { isApproved: false };
      message = 'İstifadəçi uğurla bloklandı!';
    } else if (action === 'unblock') {
      updateData = { isApproved: true };
      message = 'İstifadəçi blokdan uğurla çıxarıldı!';
    } else {
      // Fallback for backward compatibility
      updateData = { isApproved: isApproved };
      message = isApproved ? 'İstifadəçi təsdiqləndi' : 'İstifadəçi təsdiqlənmədi';
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: message,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isApproved: updatedUser.isApproved,
        isAdmin: updatedUser.isAdmin
      }
    });

  } catch (error) {
    console.error('User status update error:', error);
    return NextResponse.json(
      { error: 'İstifadəçi statusu yeniləmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
} 