const https = require('https');

async function testOrdersAPI() {
  console.log('🔍 Testing Orders API...\n');
  
  const baseUrl = 'https://sado-parts.vercel.app';
  
  // Test data for creating an order
  const testOrderData = {
    userId: 'test-user-id',
    orderNumber: `TEST-${Date.now()}`,
    items: [
      {
        productId: 'test-product-1',
        name: 'Test Product 1',
        sku: 'TEST-001',
        categoryName: 'Test Category',
        quantity: 2,
        price: 100,
        totalPrice: 200
      }
    ],
    totalAmount: 200,
    notes: 'Test order from API test'
  };
  
  try {
    console.log('Testing POST /api/orders');
    console.log('Request data:', JSON.stringify(testOrderData, null, 2));
    
    const response = await makePostRequest(`${baseUrl}/api/orders`, testOrderData);
    
    console.log(`Response status: ${response.statusCode}`);
    console.log('Response data:', response.data);
    
    if (response.statusCode === 200) {
      console.log('✅ Orders API is working correctly');
    } else if (response.statusCode === 400) {
      console.log('❌ Bad Request - Check the request data');
      console.log('This might be due to missing or invalid data');
    } else {
      console.log(`❌ Unexpected status code: ${response.statusCode}`);
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
  
  console.log('\n🎯 Expected: 200 OK for valid order data');
}

function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData
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
    
    req.write(postData);
    req.end();
  });
}

// Run the test
testOrdersAPI().catch(console.error);
