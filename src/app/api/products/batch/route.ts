import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) || [];
  if (!ids.length) return NextResponse.json([]);
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  return NextResponse.json(products);
} 