import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: '1C Exchange API is ready',
    version: 'CommerceML 2.05',
    server: 'Sado-Parts Online Store',
    timestamp: new Date().toISOString(),
    endpoints: {
      catalog: '/api/1c-exchange?action=get_catalog',
      offers: '/api/1c-exchange?action=get_offers',
      orders: '/api/1c-exchange?action=get_orders',
      classifier: '/api/1c-exchange?action=get_classifier'
    }
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: '1C Exchange API is ready for data exchange',
    version: 'CommerceML 2.05',
    server: 'Sado-Parts Online Store',
    timestamp: new Date().toISOString()
  });
}
