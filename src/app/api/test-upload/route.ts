import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the correct Supabase URL and service role key
const supabaseUrl = "https://aws-0-eu-north-1.supabase.co";
const supabaseKey = "sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    console.log('Test upload GET called');
    
    if (!supabase) {
      console.error('Supabase client is not configured');
      return NextResponse.json(
        { error: 'Supabase client is not configured' },
        { status: 500 }
      );
    }

    console.log('Supabase client configured successfully');

    // Test Supabase connection
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

      return NextResponse.json({
        success: true,
        message: 'Supabase connection successful',
        buckets: buckets?.map((b: any) => b.name),
        productImagesBucketExists: !!productImagesBucket
      });

    } catch (bucketCheckError: any) {
      console.error('Error checking buckets:', bucketCheckError);
      return NextResponse.json(
        { error: `Error checking buckets: ${bucketCheckError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Test upload error:', error);
    return NextResponse.json(
      { error: `Test upload error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
