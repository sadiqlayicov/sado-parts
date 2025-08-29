const https = require('https');

async function testPaymentRedirect() {
  console.log('🔍 Testing Payment Redirect...\n');
  
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
    notes: 'Test order for payment redirect'
  };
  
  try {
    console.log('1. Creating test order...');
    const orderResponse = await makePostRequest(`${baseUrl}/api/orders`, testOrderData);
    
    if (orderResponse.statusCode === 200) {
      const orderData = JSON.parse(orderResponse.data);
      const orderId = orderData.order.id;
      
      console.log(`✅ Order created successfully: ${orderId}`);
      
      // Test payment page redirect
      console.log('\n2. Testing payment page redirect...');
      const paymentUrl = `${baseUrl}/payment?orderId=${orderId}`;
      console.log(`Payment URL: ${paymentUrl}`);
      
      const paymentResponse = await makeGetRequest(paymentUrl);
      
      if (paymentResponse.statusCode === 200) {
        console.log('✅ Payment page loads successfully');
      } else if (paymentResponse.statusCode === 404) {
        console.log('❌ Payment page not found (404)');
      } else {
        console.log(`❌ Unexpected status code: ${paymentResponse.statusCode}`);
      }
      
    } else {
      console.log(`❌ Failed to create order: ${orderResponse.statusCode}`);
      console.log('Response:', orderResponse.data);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
  
  console.log('\n🎯 Expected: Order creation → Payment page redirect');
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

// Run the test
testPaymentRedirect().catch(console.error);
