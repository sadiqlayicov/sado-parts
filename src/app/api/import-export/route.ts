import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { promises as fs } from 'fs';
import path from 'path';

// GET - Get all import/export operations
export async function GET(request: NextRequest) {
  try {
    const operations = await prisma.importExport.findMany()
    return NextResponse.json(operations)
  } catch (error) {
    console.error('Get import/export error:', error)
    return NextResponse.json(
      { error: 'İdxal/ixrac əməliyyatlarını əldə etmə xətası' },
      { status: 500 }
    )
  }
}

// POST - Only support CSV/JSON import here. Excel import is CLI-only.
export async function POST(request: NextRequest) {
  try {
    // Placeholder: Only allow CSV/JSON import here
    return NextResponse.json({ error: 'Excel import yalnız terminal skripti ilə mümkündür. CSV və JSON importunu istifadə edin.' }, { status: 400 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: typeof error === 'object' && error && 'message' in error ? (error as any).message : 'İdxal xətası' }, { status: 500 });
  }
} 