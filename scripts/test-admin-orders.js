const https = require('https');

async function testAdminOrders() {
  console.log('🔍 Testing Admin Orders API...\n');
  
  const baseUrl = 'https://sado-parts.vercel.app';
  
  // Test 1: Get all orders
  console.log('1. Testing GET /api/admin/orders...');
  try {
    const allOrdersResponse = await makeGetRequest(`${baseUrl}/api/admin/orders`);
    console.log(`Status: ${allOrdersResponse.statusCode}`);
    
    if (allOrdersResponse.statusCode === 200) {
      const data = JSON.parse(allOrdersResponse.data);
      console.log(`✅ Found ${data.orders?.length || 0} orders`);
      
      if (data.orders && data.orders.length > 0) {
        const firstOrder = data.orders[0];
        console.log(`First order ID: ${firstOrder.id}`);
        
        // Test 2: Get specific order details
        console.log('\n2. Testing GET /api/admin/orders/[id]...');
        const orderDetailsResponse = await makeGetRequest(`${baseUrl}/api/admin/orders/${firstOrder.id}`);
        console.log(`Status: ${orderDetailsResponse.statusCode}`);
        
        if (orderDetailsResponse.statusCode === 200) {
          const orderData = JSON.parse(orderDetailsResponse.data);
          console.log('✅ Order details loaded successfully');
          console.log(`Order: ${orderData.order?.orderNumber}`);
          console.log(`Items: ${orderData.order?.items?.length || 0}`);
        } else {
          console.log('❌ Failed to get order details');
          console.log('Response:', orderDetailsResponse.data);
        }
      } else {
        console.log('⚠️ No orders found to test individual order details');
      }
    } else {
      console.log('❌ Failed to get orders list');
      console.log('Response:', allOrdersResponse.data);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 3: Test profile API
  console.log('\n3. Testing GET /api/profile...');
  try {
    const profileResponse = await makeGetRequest(`${baseUrl}/api/profile?userId=test-user`);
    console.log(`Status: ${profileResponse.statusCode}`);
    
    if (profileResponse.statusCode === 200) {
      console.log('✅ Profile API works');
    } else {
      console.log('❌ Profile API failed');
      console.log('Response:', profileResponse.data);
    }
  } catch (error) {
    console.log(`❌ Profile API error: ${error.message}`);
  }
  
  // Test 4: Test with a specific order ID from the error
  console.log('\n4. Testing specific order ID from error...');
  const specificOrderId = 'SADO-1756201857474-LYNJL9';
  try {
    const specificOrderResponse = await makeGetRequest(`${baseUrl}/api/admin/orders/${specificOrderId}`);
    console.log(`Status: ${specificOrderResponse.statusCode}`);
    
    if (specificOrderResponse.statusCode === 200) {
      console.log('✅ Specific order found');
    } else if (specificOrderResponse.statusCode === 404) {
      console.log('❌ Specific order not found (404)');
      console.log('Response:', specificOrderResponse.data);
    } else {
      console.log(`❌ Unexpected status: ${specificOrderResponse.statusCode}`);
      console.log('Response:', specificOrderResponse.data);
    }
  } catch (error) {
    console.log(`❌ Specific order error: ${error.message}`);
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

// Run the test
testAdminOrders().catch(console.error);
