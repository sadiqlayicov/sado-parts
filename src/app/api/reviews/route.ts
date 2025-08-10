import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Reviews API endpoint - functionality coming soon'
    });
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json(
      { error: 'Reviews məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Reviews API endpoint - functionality coming soon'
    });
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json(
      { error: 'Review əlavə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}
