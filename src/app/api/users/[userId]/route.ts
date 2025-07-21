import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, ...args: any[]) {
  const context = args[0];
  const { params } = context;
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });
    if (!user) {
      return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'İstifadəçini əldə etmək mümkün olmadı.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ...args: any[]) {
  const context = args[0];
  const { params } = context;
  try {
    const body = await request.json();
    const user = await prisma.user.update({
      where: { id: params.userId },
      data: body,
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'İstifadəçini yeniləmək mümkün olmadı.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ...args: any[]) {
  const context = args[0];
  const { params } = context;
  try {
    await prisma.user.delete({
      where: { id: params.userId },
    });
    return NextResponse.json({ message: 'İstifadəçi uğurla silindi.' });
  } catch (error) {
    return NextResponse.json({ error: 'İstifadəçini silmək mümkün olmadı.' }, { status: 500 });
  }
} 