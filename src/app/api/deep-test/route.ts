import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Deep test endpoint called');
    
    const supabaseUrl = "https://chiptvdjdcvuowfiggwe.supabase.co";
    const serviceRoleKey = "sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI";
    
    console.log('Testing different connection methods...');
    
    // Test 1: Direct fetch to Supabase REST API
    try {
      console.log('Test 1: Direct fetch to REST API...');
      const response = await fetch(`${supabaseUrl}/rest/v1/categories?select=count&limit=1`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Direct fetch status:', response.status);
      const directData = await response.text();
      console.log('Direct fetch response:', directData);
      
      if (response.ok) {
        return NextResponse.json({
          success: true,
          method: 'Direct fetch',
          status: response.status,
          data: directData
        });
      }
    } catch (fetchError: any) {
      console.error('Direct fetch error:', fetchError.message);
    }
    
    // Test 2: Try with anon key (if we can find it)
    try {
      console.log('Test 2: Trying with anon key...');
      const anonKey = serviceRoleKey.replace('sb_secret_', 'sb_anon_');
      console.log('Anon key:', anonKey ? '***' + anonKey.slice(-4) : 'NOT SET');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/categories?select=count&limit=1`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Anon key fetch status:', response.status);
      const anonData = await response.text();
      console.log('Anon key response:', anonData);
      
      if (response.ok) {
        return NextResponse.json({
          success: true,
          method: 'Anon key fetch',
          status: response.status,
          data: anonData
        });
      }
    } catch (anonError: any) {
      console.error('Anon key error:', anonError.message);
    }
    
    // Test 3: Try Supabase client with different options
    try {
      console.log('Test 3: Supabase client with options...');
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      });
      
      const { data, error } = await supabase
        .from('categories')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Supabase client error:', error);
        return NextResponse.json({
          success: false,
          method: 'Supabase client',
          error: error.message,
          code: error.code,
          details: error.details
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        method: 'Supabase client',
        data: data
      });
      
    } catch (clientError: any) {
      console.error('Supabase client error:', clientError.message);
    }
    
    return NextResponse.json({
      success: false,
      error: 'All connection methods failed',
      url: supabaseUrl,
      keyLength: serviceRoleKey.length
    }, { status: 500 });
    
  } catch (error: any) {
    console.error('Deep test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
