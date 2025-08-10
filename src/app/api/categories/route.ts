import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/categories called');
    
    // Test response first
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'test-1',
          name: 'Test Category 1',
          description: 'Test description',
          isActive: true,
          parentId: null,
          sortOrder: 1,
          children: []
        }
      ],
      message: 'Test categories loaded'
    });
  } catch (error: any) {
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json(
      { success: false, error: `Test xətası: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/categories called');
    
    const body = await request.json();
    const { name, description, isActive, parentId, sortOrder } = body;
    
    // Test response
    return NextResponse.json({
      success: true,
      data: {
        id: 'new-test-id',
        name: name || 'Test Category',
        description: description || '',
        isActive: isActive !== false,
        parentId: parentId || null,
        sortOrder: sortOrder || 0
      },
      message: 'Test category created'
    });
  } catch (error: any) {
    console.error('Error in POST /api/categories:', error);
    return NextResponse.json(
      { success: false, error: `Test xətası: ${error.message}` },
      { status: 500 }
    );
  }
} 