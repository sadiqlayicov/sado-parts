import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, ...args: any[]) {
  const context = args[0];
  const { params } = context;
  try {
    const body = await request.json();
    const user = await prisma.user.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'İstifadəçini təsdiqləmək mümkün olmadı.' }, { status: 500 });
  }
} 