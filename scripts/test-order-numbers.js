const https = require('https');

async function testOrderNumbers() {
  console.log('🔍 Testing Sequential Order Numbers...\n');
  
  const baseUrl = 'https://sado-parts.vercel.app';
  
  // Test 1: Get next order number
  console.log('1. Testing GET /api/orders/next-number...');
  try {
    const nextNumberResponse = await makeGetRequest(`${baseUrl}/api/orders/next-number`);
    console.log(`Status: ${nextNumberResponse.statusCode}`);
    
    if (nextNumberResponse.statusCode === 200) {
      const data = JSON.parse(nextNumberResponse.data);
      console.log(`✅ Next order number: ${data.nextOrderNumber}`);
      console.log(`Next number: ${data.nextNumber}`);
      
      // Test 2: Create a test order
      console.log('\n2. Testing order creation with new number...');
      const testOrderData = {
        userId: 'test-user-id',
        orderNumber: data.nextOrderNumber,
        items: [
          {
            productId: 'test-product-1',
            name: 'Test Product 1',
            sku: 'TEST-001',
            categoryName: 'Test Category',
            quantity: 1,
            price: 100,
            totalPrice: 100
          }
        ],
        totalAmount: 100,
        notes: 'Test order for sequential numbering'
      };
      
      const orderResponse = await makePostRequest(`${baseUrl}/api/orders`, testOrderData);
      console.log(`Order creation status: ${orderResponse.statusCode}`);
      
      if (orderResponse.statusCode === 200) {
        const orderData = JSON.parse(orderResponse.data);
        console.log(`✅ Order created successfully: ${orderData.order?.orderNumber}`);
        
        // Test 3: Get next number again to verify increment
        console.log('\n3. Testing next number after order creation...');
        const nextNumberResponse2 = await makeGetRequest(`${baseUrl}/api/orders/next-number`);
        
        if (nextNumberResponse2.statusCode === 200) {
          const data2 = JSON.parse(nextNumberResponse2.data);
          console.log(`✅ Next order number: ${data2.nextOrderNumber}`);
          console.log(`Next number: ${data2.nextNumber}`);
          
          // Verify increment
          if (data2.nextNumber === data.nextNumber + 1) {
            console.log('✅ Sequential numbering working correctly!');
          } else {
            console.log('❌ Sequential numbering not working correctly');
          }
        }
      } else {
        console.log('❌ Failed to create test order');
        console.log('Response:', orderResponse.data);
      }
    } else {
      console.log('❌ Failed to get next order number');
      console.log('Response:', nextNumberResponse.data);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

function makeGetRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
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
  });
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
testOrderNumbers().catch(console.error);
