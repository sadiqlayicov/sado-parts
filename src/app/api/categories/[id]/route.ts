import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: any) {
  try {
    const category = await prisma.category.findUnique({ where: { id: params.id } });
    if (!category) return NextResponse.json({ error: 'Tapılmadı' }, { status: 404 });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Xəta baş verdi' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const body = await request.json();
    const { name, description, image } = body;
    const category = await prisma.category.update({
      where: { id: params.id },
      data: { name, description, image }
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Yenilənmə xətası' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Silindi' });
  } catch (error) {
    return NextResponse.json({ error: 'Silinmə xətası' }, { status: 500 });
  }
} 