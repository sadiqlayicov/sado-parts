import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test upload simple POST called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File received:', file.name, file.type, file.size);

    // Fayl tipini yoxlayın
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Only JPEG, PNG and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Fayl ölçüsünü yoxlayın (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    console.log('File validation successful');

    return NextResponse.json({ 
      url: '/placeholder.png',
      success: true,
      message: 'File validation successful (test mode)',
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

  } catch (error: any) {
    console.error('Test upload simple error:', error);
    return NextResponse.json(
      { error: `Test upload simple error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('Test upload simple GET called');
    
    return NextResponse.json({
      success: true,
      message: 'Test upload simple GET successful'
    });

  } catch (error: any) {
    console.error('Test upload simple GET error:', error);
    return NextResponse.json(
      { error: `Test upload simple GET error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
