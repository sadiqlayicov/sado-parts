const https = require('https');

async function testHydraulicCategory() {
  console.log('🔍 Testing Hydraulic category filtering...\n');
  
  const baseUrl = 'https://sado-parts.vercel.app';
  const categoryId = 'cat-hydraulic';
  
  try {
    console.log(`Testing: ${baseUrl}/api/products?categoryId=${categoryId}`);
    
    const response = await makeRequest(`${baseUrl}/api/products?categoryId=${categoryId}`);
    
    if (response.statusCode === 200) {
      console.log(`✅ API Response - OK (${response.statusCode})`);
      
      try {
        const data = JSON.parse(response.data);
        if (data.success && Array.isArray(data.data)) {
          console.log(`📊 Found ${data.data.length} products`);
          
          // Count products by category
          const categoryCounts = {};
          data.data.forEach(product => {
            const categoryName = product.category?.name || 'Unknown';
            categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
          });
          
          console.log('\n📋 Products by category:');
          Object.entries(categoryCounts).forEach(([category, count]) => {
            console.log(`  ${category}: ${count} products`);
          });
          
          // Show sample products
          console.log('\n📦 Sample products:');
          data.data.slice(0, 5).forEach(product => {
            console.log(`  - ${product.name} (${product.category?.name || 'Unknown'})`);
          });
          
        } else {
          console.log('❌ Invalid response format');
          console.log('Response:', data);
        }
      } catch (e) {
        console.log('❌ Failed to parse JSON response');
        console.log('Response:', response.data);
      }
    } else {
      console.log(`❌ API Error (${response.statusCode})`);
      console.log(`Response: ${response.data}`);
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
  
  console.log('\n🎯 Expected: 13 products total (12 from Hidravlika + 1 from test alt kateqoriya)');
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
testHydraulicCategory().catch(console.error);
