const https = require('https');

async function testVercelAPI() {
  console.log('🔍 Testing Vercel deployment...\n');
  
  const baseUrl = 'https://sado-parts.vercel.app';
  
  // Test endpoints
  const endpoints = [
    '/api/categories',
    '/api/products',
    '/api/products?categoryId=cat-hydraulic'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${baseUrl}${endpoint}`);
      
      const response = await makeRequest(`${baseUrl}${endpoint}`);
      
      if (response.statusCode === 200) {
        console.log(`✅ ${endpoint} - OK (${response.statusCode})`);
        
        // Try to parse JSON response
        try {
          const data = JSON.parse(response.data);
          if (data.success && data.data) {
            console.log(`   Found ${Array.isArray(data.data) ? data.data.length : 'data'}`);
          }
        } catch (e) {
          console.log(`   Response is not JSON`);
        }
      } else {
        console.log(`❌ ${endpoint} - Error (${response.statusCode})`);
        console.log(`   ${response.data}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} - Failed: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 Summary:');
  console.log('If you see 500 errors, the DATABASE_URL environment variable is not set in Vercel.');
  console.log('Please follow the instructions in VERCEL_ENVIRONMENT_SETUP.md');
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run the test
testVercelAPI().catch(console.error);
