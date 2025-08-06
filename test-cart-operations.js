const https = require('https');

// Test cart quantity update
function testCartQuantityUpdate() {
  console.log('Testing Cart Quantity Update...');
  
  const postData = JSON.stringify({
    cartItemId: 'cart-test-123',
    quantity: 2
  });

  const options = {
    hostname: 'sado-parts.vercel.app',
    port: 443,
    path: '/api/cart',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Cart PUT Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Cart PUT Response:', data);
      testOrderCreation();
    });
  });

  req.on('error', (error) => {
    console.error('Cart PUT Error:', error);
    testOrderCreation();
  });

  req.write(postData);
  req.end();
}

// Test order creation
function testOrderCreation() {
  console.log('\nTesting Order Creation...');
  
  const postData = JSON.stringify({
    userId: 'test-user-123',
    notes: 'Test order',
    cartItems: [
      {
        id: 'cart-item-1',
        productId: 'product-1',
        name: 'Test Product',
        quantity: 2,
        price: 100,
        salePrice: 80
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
          testOrderRetrieval(response.order.id);
        } else {
          console.log('No order ID found in response');
        }
      } catch (e) {
        console.log('Could not parse order response');
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
    });
  });

  req.on('error', (error) => {
    console.error('Order GET Error:', error);
  });

  req.end();
}

// Start testing
console.log('Starting Cart and Order tests...\n');
testCartQuantityUpdate(); 