const testQuantityUpdate = async () => {
  try {
    // Test data - real order ID və item ID istifadə etmək lazımdır
    const testData = {
      orderId: "test-order-id",
      itemId: "test-item-id", 
      quantity: 2
    };

    console.log('Testing quantity update with:', testData);

    const response = await fetch('http://localhost:3000/api/admin/orders/update-item-quantity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    console.log('Response:', data);
    console.log('Status:', response.status);

  } catch (error) {
    console.error('Test error:', error);
  }
};

testQuantityUpdate();
