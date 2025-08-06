async function testCartWithRealProduct() {
  console.log('Testing Cart API with real product...');
  
  const baseUrl = 'https://sado-parts.vercel.app';
  
  try {
    // First, get products to get a real product ID
    console.log('\n📦 Getting products...');
    const productsResponse = await fetch(`${baseUrl}/api/products`);
    const productsData = await productsResponse.json();
    
    if (productsData.success && productsData.products.length > 0) {
      const realProduct = productsData.products[0];
      console.log('Found product:', realProduct.name, 'ID:', realProduct.id);
      
      // Test POST cart endpoint with real product
      console.log('\n🛒 Testing POST /api/cart with real product...');
      const postResponse = await fetch(`${baseUrl}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'test-user-id',
          productId: realProduct.id,
          quantity: 1
        })
      });
      
      const postData = await postResponse.json();
      console.log('POST Response status:', postResponse.status);
      console.log('POST Response data:', postData);
      
      if (postResponse.status === 500) {
        console.log('\n❌ Cart API is returning 500 error');
        console.log('This indicates a server-side error in the cart API');
      } else if (postResponse.ok) {
        console.log('\n✅ Cart API is working correctly with real product!');
        
        // Test GET cart to see if item was added
        console.log('\n📋 Testing GET /api/cart after adding item...');
        const getResponse = await fetch(`${baseUrl}/api/cart?userId=test-user-id`);
        const getData = await getResponse.json();
        console.log('GET Response status:', getResponse.status);
        console.log('GET Response data:', getData);
      }
    } else {
      console.log('❌ No products found');
    }
    
  } catch (error) {
    console.error('❌ Error testing cart endpoint:', error.message);
  }
}

testCartWithRealProduct(); 