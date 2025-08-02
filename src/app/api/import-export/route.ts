import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

// GET - Get import/export status
export async function GET(request: NextRequest) {
  try {
    // Return basic import/export status
    return NextResponse.json({
      status: 'ready',
      message: 'Import/export system is ready',
      supportedFormats: ['CSV', 'JSON'],
      note: 'Excel import is CLI-only'
    })
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
    return NextResponse.json({ 
      error: 'Excel import yalnız terminal skripti ilə mümkündür. CSV və JSON importunu istifadə edin.' 
    }, { status: 400 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: typeof error === 'object' && error && 'message' in error ? (error as any).message : 'İdxal xətası' 
    }, { status: 500 });
  }
} 