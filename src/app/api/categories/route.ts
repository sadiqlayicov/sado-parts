import { NextRequest, NextResponse } from 'next/server'
import { prisma, resetPrismaClient } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Get categories error:', error)
    
    // PostgreSQL prepared statement xətası üçün xüsusi handling
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage.includes('prepared statement') || errorMessage.includes('42P05') || errorMessage.includes('26000')) {
        console.log('PostgreSQL prepared statement xətası aşkarlandı, yenidən cəhd edilir...');
        // Qısa müddət gözlə və yenidən cəhd et
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
          // Prisma Client-i yenidən başlat
          await resetPrismaClient();
          
          // Qısa müddət gözlə
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
          });
          return NextResponse.json(categories);
        } catch (retryError) {
          console.error('Retry error:', retryError);
        }
      }
    }
    
    // Xəta zamanı boş array qaytar
    return NextResponse.json([])
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, image } = body;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: { name, description, image }
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
} 