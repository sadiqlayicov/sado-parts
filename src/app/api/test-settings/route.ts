import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool optimized for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
});

export async function POST(request: NextRequest) {
  let client;
  
  try {
    console.log('Test settings POST called');
    
    const body = await request.json();
    console.log('Received body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test successful',
      receivedBody: body
    });

  } catch (error: any) {
    console.error('Test settings error:', error);
    return NextResponse.json(
      { error: `Test error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('Test settings GET called');
    
    return NextResponse.json({
      success: true,
      message: 'Test GET successful'
    });

  } catch (error: any) {
    console.error('Test settings GET error:', error);
    return NextResponse.json(
      { error: `Test GET error: ${error.message}` },
      { status: 500 }
    );
  }
}
