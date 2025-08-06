async function testCartEndpoint() {
  console.log('Testing Cart API endpoint...');
  
  const baseUrl = 'https://sado-parts.vercel.app';
  
  try {
    // Test GET cart endpoint
    console.log('\n📋 Testing GET /api/cart...');
    const getResponse = await fetch(`${baseUrl}/api/cart?userId=test-user-id`);
    const getData = await getResponse.json();
    console.log('GET Response status:', getResponse.status);
    console.log('GET Response data:', getData);
    
    // Test POST cart endpoint
    console.log('\n🛒 Testing POST /api/cart...');
    const postResponse = await fetch(`${baseUrl}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test-user-id',
        productId: 'test-product-id',
        quantity: 1
      })
    });
    
    const postData = await postResponse.json();
    console.log('POST Response status:', postResponse.status);
    console.log('POST Response data:', postData);
    
    if (postResponse.status === 500) {
      console.log('\n❌ Cart API is returning 500 error');
      console.log('This indicates a server-side error in the cart API');
    } else if (postResponse.status === 404) {
      console.log('\n⚠️ Product not found (expected for test product)');
    } else if (postResponse.ok) {
      console.log('\n✅ Cart API is working correctly');
    }
    
  } catch (error) {
    console.error('❌ Error testing cart endpoint:', error.message);
  }
}

testCartEndpoint(); 