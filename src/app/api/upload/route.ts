import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Use the correct Supabase URL and service role key
const supabaseUrl = "https://chiptvdjdcvuowfiggwe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaXB0dmRqZGN2dW93ZmlnZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY4NzI5MCwiZXhwIjoyMDUxMjYzMjkwfQ.OPPE7kyd8WKwuMhn";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: Request) {
  try {
    console.log('Upload endpoint called');
    
    if (!supabase) {
      console.error('Supabase client is not configured');
      return NextResponse.json(
        { error: 'Supabase client is not configured' },
        { status: 500 }
      );
    }

    console.log('Supabase client configured successfully');

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Yüklənən fayl üçün unikal ad
    const fileExtension = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;

    console.log('Attempting to upload to Supabase Storage:', fileName);

    // Check if bucket exists first
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        return NextResponse.json(
          { error: `Storage error: ${bucketsError.message}` },
          { status: 500 }
        );
      }
      
      console.log('Available buckets:', buckets?.map((b: any) => b.name));
      
      const productImagesBucket = buckets?.find((b: any) => b.name === 'product-images');
      if (!productImagesBucket) {
        console.error('product-images bucket not found');
        return NextResponse.json(
          { error: 'Storage bucket "product-images" not found' },
          { status: 500 }
        );
      }
    } catch (bucketCheckError) {
      console.error('Error checking buckets:', bucketCheckError);
    }

    // Supabase Storage-ə yükləyin
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('File uploaded successfully:', data);

    // Public URL alın
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    console.log('Public URL generated:', urlData.publicUrl);

    return NextResponse.json({ 
      url: urlData.publicUrl,
      success: true 
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
} 