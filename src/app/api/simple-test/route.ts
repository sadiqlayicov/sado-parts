import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Simple test endpoint called');
    
    const supabaseUrl = "https://chiptvdjdcvuowfiggwe.supabase.co";
    const supabaseKey = "sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI";
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key length:', supabaseKey.length);
    
    // Test if we can import supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      console.log('✅ Supabase import successful');
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase client created');
      
      return NextResponse.json({
        success: true,
        message: 'Supabase client created successfully',
        url: supabaseUrl,
        keyLength: supabaseKey.length
      });
      
    } catch (importError: any) {
      console.error('❌ Supabase import error:', importError);
      return NextResponse.json({
        success: false,
        error: 'Supabase import failed',
        details: importError.message
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
