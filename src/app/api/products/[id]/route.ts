import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, context: any) {
  const { params } = context;
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!product) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Məhsulu əldə etmək mümkün olmadı.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, ...args: any[]) {
  const context = args[0];
  const { params } = context;
  try {
    const body = await request.json();
    const product = await prisma.product.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Məhsulu yeniləmək mümkün olmadı.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ...args: any[]) {
  const context = args[0];
  const { params } = context;
  try {
    await prisma.product.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Məhsul uğurla silindi.' });
  } catch (error) {
    return NextResponse.json({ error: 'Məhsulu silmək mümkün olmadı.' }, { status: 500 });
  }
} 