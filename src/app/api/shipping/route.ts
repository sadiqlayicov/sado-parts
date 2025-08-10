import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Shipping API endpoint - functionality coming soon'
    });
  } catch (error) {
    console.error('Shipping API error:', error);
    return NextResponse.json(
      { error: 'Shipping məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Shipping API endpoint - functionality coming soon'
    });
  } catch (error) {
    console.error('Shipping API error:', error);
    return NextResponse.json(
      { error: 'Shipping məlumatı əlavə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}
