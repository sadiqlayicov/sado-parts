import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: '1C Debug Endpoint',
    timestamp: new Date().toISOString(),
    environment: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET'
    },
    globalState: {
      uploadedFileContent: global.uploadedFileContent ? 
        `Content length: ${global.uploadedFileContent.length} characters` : 
        'No content stored'
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
