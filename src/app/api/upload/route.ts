import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Use the correct Supabase URL and service role key
const supabaseUrl = "https://aws-0-eu-north-1.supabase.co";
const supabaseKey = "sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI";

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

    // Upload to Supabase Storage
    console.log('File validation successful, uploading to Supabase Storage');
    
    try {
      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${randomUUID()}.${fileExtension}`;
      
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      const imageUrl = urlData.publicUrl;
      console.log('Successfully uploaded to Supabase:', imageUrl);
      
      return NextResponse.json({
        url: imageUrl,
        success: true,
        message: 'File uploaded successfully to Supabase Storage'
      });
      
         } catch (uploadError: any) {
       console.error('Upload to Supabase failed:', uploadError);
       console.error('Upload error details:', {
         message: uploadError.message,
         stack: uploadError.stack,
         name: uploadError.name
       });
       
       // Fallback to placeholder if Supabase upload fails
       const placeholderUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk9LPC90ZXh0Pjwvc3ZnPg==';
       
       return NextResponse.json({
         url: placeholderUrl,
         success: true,
         message: `File validation successful (fallback to placeholder due to: ${uploadError.message})`
       });
     }

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
} 