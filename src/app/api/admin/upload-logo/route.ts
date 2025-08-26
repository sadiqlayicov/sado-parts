import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and SVG files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // For now, we'll return success but store the file data in a different way
    // In a production environment, you would typically:
    // 1. Upload to a cloud storage service (AWS S3, Cloudinary, etc.)
    // 2. Store the file URL in your database
    // 3. Use that URL in your application

    // Generate a placeholder URL for demonstration
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `logo-${timestamp}.${fileExtension}`;
    
    // For now, we'll create a data URL that can be stored in localStorage
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      fileName: fileName,
      message: 'Logo uploaded successfully. Note: In production, this should be uploaded to cloud storage.',
      dataUrl: dataUrl // This can be stored in localStorage for temporary use
    });

  } catch (error: any) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo', details: error.message },
      { status: 500 }
    );
  }
}
