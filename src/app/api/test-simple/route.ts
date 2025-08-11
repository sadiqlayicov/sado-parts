import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test simple POST called');
    
    const body = await request.json();
    console.log('Received body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Simple test successful',
      receivedBody: body
    });

  } catch (error: any) {
    console.error('Test simple error:', error);
    return NextResponse.json(
      { error: `Test simple error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('Test simple GET called');
    
    return NextResponse.json({
      success: true,
      message: 'Simple test GET successful'
    });

  } catch (error: any) {
    console.error('Test simple GET error:', error);
    return NextResponse.json(
      { error: `Test simple GET error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
