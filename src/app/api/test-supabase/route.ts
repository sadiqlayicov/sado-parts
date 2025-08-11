import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://chiptvdjdcvuowfiggwe.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI";
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey ? '***' + supabaseKey.slice(-4) : 'NOT SET');
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials not configured',
        url: supabaseUrl,
        keyExists: !!supabaseKey
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: data,
      url: supabaseUrl
    });
    
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
