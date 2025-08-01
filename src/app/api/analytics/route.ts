import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0
  });
} 