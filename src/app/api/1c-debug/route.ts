import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: '1C Debug Endpoint',
    timestamp: new Date().toISOString(),
    environment: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'development'
    },
    globalState: {
      uploadedFileContent: global.uploadedFileContent || 'No content stored',
      lastActivityTime: global.lastActivityTime || 'No activity',
      uploadProgress: global.uploadProgress || 'Waiting for 1C...',
      recentLogs: global.recentLogs || []
    },
    endpoints: {
      '1c_exchange.php': 'https://sado-parts.vercel.app/api/1c_exchange.php',
      '1c-debug': 'https://sado-parts.vercel.app/api/1c-debug',
      '1c-status': 'https://sado-parts.vercel.app/api/1c-status'
    },
    instructions: {
      '1C Connection Test': 'GET /api/1c_exchange.php?type=catalog&mode=checkauth',
      '1C File Upload': 'POST /api/1c_exchange.php?type=catalog&mode=file',
      '1C Data Import': 'POST /api/1c_exchange.php?type=catalog&mode=import'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    return NextResponse.json({
      success: true,
      message: '1C Debug POST received',
      timestamp: new Date().toISOString(),
      receivedData: {
        contentLength: body.length,
        preview: body.substring(0, 200),
        hasXmlContent: body.includes('<?xml') || body.includes('<Товар') || body.includes('<Каталог')
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
