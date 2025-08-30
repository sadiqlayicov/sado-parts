import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Environment variables test',
    environment: {
      ONEC_USERNAME: process.env.ONEC_USERNAME ? 'SET' : 'NOT SET',
      ONEC_PASSWORD: process.env.ONEC_PASSWORD ? 'SET' : 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET'
    },
    timestamp: new Date().toISOString()
  });
}
