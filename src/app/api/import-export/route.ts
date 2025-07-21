import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

// POST - Create new import/export operation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, fileName, filePath, status, progress, totalItems, processedItems, error } = body

    const operation = await prisma.importExport.create({
      data: {
        type,
        fileName,
        filePath,
        status: status || 'PENDING',
        progress: progress || 0,
        totalItems,
        processedItems: processedItems || 0,
        error
      }
    })

    return NextResponse.json({
      message: 'İdxal/ixrac əməliyyatı uğurla əlavə olundu',
      operation
    }, { status: 201 })
  } catch (error) {
    console.error('Create import/export error:', error)
    return NextResponse.json(
      { error: 'İdxal/ixrac əməliyyatı əlavə etmə xətası' },
      { status: 500 }
    )
  }
} 