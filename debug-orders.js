const https = require('https');

// Test order creation with real product
function testOrderCreationWithRealProduct() {
  console.log('Testing Order Creation with Real Product...');
  
  const postData = JSON.stringify({
    userId: 'test-user-123',
    notes: 'Test order with real product',
    cartItems: [
      {
        id: 'cart-item-real-1',
        productId: '0a0caa1a-deaa-4379-b510-8c5a5a9f84f6', // Real product ID from products API
        name: 'Electrical Wiring Harness',
        quantity: 2,
        price: 180,
        salePrice: 144,
        sku: 'WIRE-HARN-006',
        categoryName: 'Electrical'
      }
    ]
  });

  const options = {
    hostname: 'sado-parts.vercel.app',
    port: 443,
    path: '/api/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Order POST Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Order POST Response:', data);
      
      // Try to parse the response to get order ID
      try {
        const response = JSON.parse(data);
        if (response.success && response.order && response.order.id) {
          console.log('Order created with ID:', response.order.id);
          console.log('Order details:', response.order);
          
          // Wait a bit then try to retrieve
          setTimeout(() => {
            testOrderRetrieval(response.order.id);
          }, 2000);
        } else {
          console.log('No order ID found in response');
        }
      } catch (e) {
        console.log('Could not parse order response:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Order POST Error:', error);
  });

  req.write(postData);
  req.end();
}

// Test order retrieval
function testOrderRetrieval(orderId) {
  console.log('\nTesting Order Retrieval...');
  console.log('Trying to retrieve order:', orderId);
  
  const options = {
    hostname: 'sado-parts.vercel.app',
    port: 443,
    path: `/api/orders/${orderId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Order GET Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Order GET Response:', data);
      
      if (res.statusCode === 404) {
        console.log('Order not found - checking if orders table exists...');
        checkOrdersTable();
      }
    });
  });

  req.on('error', (error) => {
    console.error('Order GET Error:', error);
  });

  req.end();
}

// Check orders table
function checkOrdersTable() {
  console.log('\nChecking orders table...');
  
  const options = {
    hostname: 'sado-parts.vercel.app',
    port: 443,
    path: '/api/orders?userId=test-user-123',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Orders List Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Orders List Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('Orders List Error:', error);
  });

  req.end();
}

// Start testing
console.log('Starting Order Debug tests...\n');
testOrderCreationWithRealProduct(); 