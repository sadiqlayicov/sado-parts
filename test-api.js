const https = require('https');

// Test cart API
function testCartAPI() {
  console.log('Testing Cart API...');
  
  const options = {
    hostname: 'sado-parts.vercel.app',
    port: 443,
    path: '/api/cart?userId=test-user',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Cart API Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Cart API Response:', data);
      testOrdersAPI();
    });
  });

  req.on('error', (error) => {
    console.error('Cart API Error:', error);
    testOrdersAPI();
  });

  req.end();
}

// Test orders API
function testOrdersAPI() {
  console.log('\nTesting Orders API...');
  
  const options = {
    hostname: 'sado-parts.vercel.app',
    port: 443,
    path: '/api/orders?userId=test-user',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Orders API Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Orders API Response:', data);
      testProductsAPI();
    });
  });

  req.on('error', (error) => {
    console.error('Orders API Error:', error);
    testProductsAPI();
  });

  req.end();
}

// Test products API
function testProductsAPI() {
  console.log('\nTesting Products API...');
  
  const options = {
    hostname: 'sado-parts.vercel.app',
    port: 443,
    path: '/api/products',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Products API Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const products = JSON.parse(data);
        console.log(`Products API Response: ${products.length} products found`);
        console.log('First product:', products[0] ? products[0].name : 'No products');
      } catch (e) {
        console.log('Products API Response (raw):', data.substring(0, 200) + '...');
      }
    });
  });

  req.on('error', (error) => {
    console.error('Products API Error:', error);
  });

  req.end();
}

// Start testing
console.log('Starting API tests...\n');
testCartAPI(); 