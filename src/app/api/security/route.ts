import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Security API endpoint - functionality coming soon'
    });
  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json(
      { error: 'Security məlumatlarını əldə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Security API endpoint - functionality coming soon'
    });
  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json(
      { error: 'Security məlumatı əlavə etmə zamanı xəta baş verdi' },
      { status: 500 }
    );
  }
}
