import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://aws-0-eu-north-1.supabase.co";
const supabaseKey = "sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    console.log('Testing Supabase Storage...');
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return NextResponse.json({
        success: false,
        error: `Failed to list buckets: ${bucketsError.message}`,
        buckets: null
      });
    }
    
    console.log('Available buckets:', buckets);
    
    // Check if product-images bucket exists
    const productImagesBucket = buckets?.find(bucket => bucket.name === 'product-images');
    
    if (!productImagesBucket) {
      console.log('product-images bucket does not exist, creating it...');
      
      // Create the bucket
      const { data: createData, error: createError } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return NextResponse.json({
          success: false,
          error: `Failed to create bucket: ${createError.message}`,
          buckets: buckets
        });
      }
      
      console.log('Successfully created product-images bucket');
    }
    
    // List files in product-images bucket (if it exists)
    let files: any[] = [];
    if (productImagesBucket || buckets?.find(b => b.name === 'product-images')) {
      const { data: filesData, error: filesError } = await supabase.storage
        .from('product-images')
        .list();
      
      if (filesError) {
        console.error('Error listing files:', filesError);
      } else {
        files = filesData || [];
        console.log('Files in product-images bucket:', files);
      }
    }
    
    return NextResponse.json({
      success: true,
      buckets: buckets,
      productImagesBucket: productImagesBucket || buckets?.find(b => b.name === 'product-images'),
      files: files,
      message: 'Storage test completed'
    });
    
  } catch (error: any) {
    console.error('Storage test error:', error);
    return NextResponse.json(
      { success: false, error: `Test error: ${error.message}` },
      { status: 500 }
    );
  }
}
