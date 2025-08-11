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

    // For now, just return success without uploading to Supabase
    console.log('File validation successful');

    return NextResponse.json({ 
      url: '/placeholder.png',
      success: true,
      message: 'File validation successful (test mode)'
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
} 