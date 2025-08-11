import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('Test Supabase simple GET called');
    
    // Test different Supabase URLs and keys
    const testConfigs = [
      {
        name: 'Config 1',
        url: "https://aws-0-eu-north-1.supabase.co",
        key: "sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI"
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
