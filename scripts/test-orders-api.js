const fetch = require('node-fetch');

async function testOrdersAPI() {
  try {
    console.log('🧪 Testing Orders API...');
    
    // Test GET orders
    console.log('📋 Testing GET /api/orders...');
    const getResponse = await fetch('http://localhost:3000/api/orders?userId=test');
    const getData = await getResponse.json();
    console.log('GET Response:', getData);
    
    // Test POST order
    console.log('📝 Testing POST /api/orders...');
    const testOrder = {
      userId: 'test-user-123',
      orderNumber: `ORDER-${Date.now()}`,
      totalAmount: 100.50,
      notes: 'Test order',
      items: [
        {
          productId: 'test-product-1',
          name: 'Test Product 1',
          sku: 'TEST-001',
          categoryName: 'Test Category',
          quantity: 2,
          price: 50.25,
          totalPrice: 100.50
        }
      ]
    };
    
    const postResponse = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });
    
    const postData = await postResponse.json();
    console.log('POST Response:', postData);
    
    if (postResponse.ok) {
      console.log('✅ Orders API is working correctly!');
    } else {
      console.log('❌ Orders API has issues:', postData);
    }
    
  } catch (error) {
    console.error('❌ Error testing Orders API:', error);
  }
}

testOrdersAPI();
