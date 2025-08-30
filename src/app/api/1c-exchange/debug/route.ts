import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  const userAgent = request.headers.get('user-agent');
  
  console.log('DEBUG - All headers:', Object.fromEntries(request.headers.entries()));
  
  return NextResponse.json({
    success: true,
    message: 'Debug endpoint - checking headers',
    headers: {
      authorization: authHeader,
      contentType,
      userAgent,
      allHeaders: Object.fromEntries(request.headers.entries())
    },
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  const userAgent = request.headers.get('user-agent');
  
  console.log('DEBUG POST - All headers:', Object.fromEntries(request.headers.entries()));
  
  return NextResponse.json({
    success: true,
    message: 'Debug endpoint - checking headers',
    headers: {
      authorization: authHeader,
      contentType,
      userAgent,
      allHeaders: Object.fromEntries(request.headers.entries())
    },
    timestamp: new Date().toISOString()
  });
}
