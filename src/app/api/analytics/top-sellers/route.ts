import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Placeholder response for top sellers analytics
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Top sellers analytics - functionality coming soon'
    });
  } catch (error) {
    console.error('Top sellers analytics error:', error);
    return NextResponse.json(
      { error: 'Top sellers məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Top sellers analytics endpoint - functionality coming soon'
    });
  } catch (error) {
    console.error('Top sellers analytics error:', error);
    return NextResponse.json(
      { error: 'Top sellers analytics əlavə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}
