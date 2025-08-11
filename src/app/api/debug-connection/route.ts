import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Debug connection endpoint called');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    };
    
    // Test 1: Basic fetch to Supabase
    try {
      console.log('Test 1: Basic fetch to Supabase...');
      const response = await fetch('https://chiptvdjdcvuowfiggwe.supabase.co/rest/v1/categories?select=count&limit=1', {
        headers: {
          'apikey': 'sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI',
          'Authorization': 'Bearer sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI',
          'Content-Type': 'application/json'
        }
      });
      
      results.tests.push({
        name: 'Direct fetch to Supabase',
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      console.log('Direct fetch result:', response.status, response.ok);
    } catch (error: any) {
      results.tests.push({
        name: 'Direct fetch to Supabase',
        error: error.message,
        type: error.constructor.name
      });
      console.error('Direct fetch error:', error.message);
    }
    
    // Test 2: Test with aws-0-eu-north-1 URL
    try {
      console.log('Test 2: Fetch with aws-0-eu-north-1 URL...');
      const response = await fetch('https://aws-0-eu-north-1.supabase.co/rest/v1/categories?select=count&limit=1', {
        headers: {
          'apikey': 'sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI',
          'Authorization': 'Bearer sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI',
          'Content-Type': 'application/json'
        }
      });
      
      results.tests.push({
        name: 'Fetch with aws-0-eu-north-1 URL',
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      console.log('AWS URL fetch result:', response.status, response.ok);
    } catch (error: any) {
      results.tests.push({
        name: 'Fetch with aws-0-eu-north-1 URL',
        error: error.message,
        type: error.constructor.name
      });
      console.error('AWS URL fetch error:', error.message);
    }
    
    // Test 3: Test Supabase client creation
    try {
      console.log('Test 3: Supabase client creation...');
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        'https://chiptvdjdcvuowfiggwe.supabase.co',
        'sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI'
      );
      
      results.tests.push({
        name: 'Supabase client creation',
        success: true,
        clientType: typeof supabase
      });
      
      console.log('Supabase client created successfully');
    } catch (error: any) {
      results.tests.push({
        name: 'Supabase client creation',
        error: error.message,
        type: error.constructor.name
      });
      console.error('Supabase client error:', error.message);
    }
    
    // Test 4: Test basic internet connectivity
    try {
      console.log('Test 4: Basic internet connectivity...');
      const response = await fetch('https://httpbin.org/get');
      
      results.tests.push({
        name: 'Basic internet connectivity',
        status: response.status,
        ok: response.ok
      });
      
      console.log('Internet connectivity test result:', response.status, response.ok);
    } catch (error: any) {
      results.tests.push({
        name: 'Basic internet connectivity',
        error: error.message,
        type: error.constructor.name
      });
      console.error('Internet connectivity error:', error.message);
    }
    
    return NextResponse.json({
      success: true,
      results: results
    });
    
  } catch (error: any) {
    console.error('Debug connection error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
