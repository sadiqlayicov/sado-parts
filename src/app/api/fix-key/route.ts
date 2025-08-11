import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Fix key endpoint called');
    
    const supabaseUrl = "https://chiptvdjdcvuowfiggwe.supabase.co";
    
    // The correct service role key should be a JWT token
    // Let's try to construct it based on the project reference
    const projectRef = "chiptvdjdcvuowfiggwe";
    
    // Try different key formats
    const keys = [
      // Current secret key (wrong format)
      "sb_secret_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI",
      
      // Anon key version
      "sb_anon_p_OyrmK9KvNFLEUUy_uPrg_sL6yZ9UI",
      
      // Try to find the correct service role key
      // This should be a JWT token from Supabase dashboard
      process.env.SUPABASE_SERVICE_ROLE_KEY || "NOT_SET"
    ];
    
    console.log('Testing keys...');
    console.log('Project ref:', projectRef);
    console.log('URL:', supabaseUrl);
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      console.log(`Testing key ${i + 1}: ${key ? '***' + key.slice(-4) : 'NOT SET'}`);
      
      if (key === "NOT_SET") {
        console.log('Key not set, skipping...');
        continue;
      }
      
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
            keyType: i === 0 ? 'Secret Key' : i === 1 ? 'Anon Key' : 'Service Role Key',
            status: response.status,
            data: data,
            message: 'Found working key!'
          });
        }
      } catch (error: any) {
        console.error(`Key ${i + 1} error:`, error.message);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'No working key found',
      message: 'Please check your Supabase dashboard for the correct service role key',
      url: supabaseUrl,
      projectRef: projectRef,
      testedKeys: keys.length,
      instructions: [
        '1. Go to your Supabase dashboard',
        '2. Select your project: chiptvdjdcvuowfiggwe',
        '3. Go to Settings > API',
        '4. Copy the "service_role" key (not the anon key)',
        '5. Update your Vercel environment variables'
      ]
    }, { status: 500 });
    
  } catch (error: any) {
    console.error('Fix key error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
