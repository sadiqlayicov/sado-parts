import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Key test endpoint called');
    
    const supabaseUrl = "https://chiptvdjdcvuowfiggwe.supabase.co";
    
    // Test different key formats
    const keys = [
      "sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI", // Current key
      "sb_anon_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI",   // Anon version
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaXB0dmRqZGN2dW93ZmlnZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY4NzI5MCwiZXhwIjoyMDUxMjYzMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8" // JWT format
    ];
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      console.log(`Testing key ${i + 1}: ${key ? '***' + key.slice(-4) : 'NOT SET'}`);
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/categories?select=count&limit=1`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Key ${i + 1} status:`, response.status);
        const data = await response.text();
        console.log(`Key ${i + 1} response:`, data);
        
        if (response.ok) {
          return NextResponse.json({
            success: true,
            workingKey: i + 1,
            keyType: i === 0 ? 'Service Role' : i === 1 ? 'Anon' : 'JWT',
            status: response.status,
            data: data
          });
        }
      } catch (error: any) {
        console.error(`Key ${i + 1} error:`, error.message);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'No working key found',
      url: supabaseUrl,
      testedKeys: keys.length
    }, { status: 500 });
    
  } catch (error: any) {
    console.error('Key test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
