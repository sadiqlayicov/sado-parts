const fetch = require('node-fetch');

async function testUsersAPI() {
  try {
    console.log('Testing /api/users endpoint...');
    
    // Test the API endpoint
    const response = await fetch('https://sado-parts.vercel.app/api/users');
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('\nAPI Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.users && Array.isArray(data.users)) {
      console.log('\n=== USERS WITH DISCOUNTS ===');
      data.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}): ${user.discountPercentage || 0}%`);
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testUsersAPI();
