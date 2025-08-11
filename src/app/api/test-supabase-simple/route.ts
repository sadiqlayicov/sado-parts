import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('Test Supabase simple GET called');
    
    // Test different Supabase URLs and keys
    const testConfigs = [
      {
        name: 'Config 1',
        url: "https://chiptvdjdcvuowfiggwe.supabase.co",
        key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaXB0dmRqZGN2dW93ZmlnZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY4NzI5MCwiZXhwIjoyMDUxMjYzMjkwfQ.OPPE7kyd8WKwuMhn"
      },
      {
        name: 'Config 2',
        url: "https://aws-0-eu-north-1.supabase.co",
        key: "OPPE7kyd8WKwuMhn"
      }
    ];

    const results = [];

    for (const config of testConfigs) {
      try {
        console.log(`Testing ${config.name}: ${config.url}`);
        
        const supabase = createClient(config.url, config.key);
        
        // Test simple query
        const { data, error } = await supabase
          .from('categories')
          .select('count')
          .limit(1);
        
        if (error) {
          console.error(`Error with ${config.name}:`, error);
          results.push({
            config: config.name,
            success: false,
            error: error.message
          });
        } else {
          console.log(`Success with ${config.name}:`, data);
          results.push({
            config: config.name,
            success: true,
            data: data
          });
        }
      } catch (testError: any) {
        console.error(`Exception with ${config.name}:`, testError);
        results.push({
          config: config.name,
          success: false,
          error: testError?.message || 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection tests completed',
      results: results
    });

  } catch (error: any) {
    console.error('Test Supabase simple error:', error);
    return NextResponse.json(
      { error: `Test Supabase simple error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
