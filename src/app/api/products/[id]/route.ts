import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: any) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (product) {
    // artikul və catalogNumber undefined olarsa boş string et
    const p: any = product;
    if (p.artikul === undefined || p.artikul === null) p.artikul = '';
    if (p.catalogNumber === undefined || p.catalogNumber === null) p.catalogNumber = '';
    return NextResponse.json(p);
  }
  return NextResponse.json({ error: 'Product not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: any) {
  const { id } = await params;
  const data = await request.json();
  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      artikul: data.artikul ?? '',
      catalogNumber: data.catalogNumber ?? '',
      description: data.description,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      images: data.images ? (Array.isArray(data.images) ? data.images : [data.images]) : undefined,
    },
    include: { category: true },
  });
  // artikul və catalogNumber undefined olarsa boş string et
  const p: any = updated;
  if (p.artikul === undefined || p.artikul === null) p.artikul = '';
  if (p.catalogNumber === undefined || p.catalogNumber === null) p.catalogNumber = '';
  return NextResponse.json(p);
}

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Məhsul uğurla silindi.' });
  } catch (error) {
    return NextResponse.json({ error: 'Məhsulu silmək mümkün olmadı.' }, { status: 500 });
  }
} 