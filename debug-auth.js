// Debug script to check authentication state
console.log('=== AUTH DEBUG ===');

// Check if there's a cached user
const cachedUser = localStorage.getItem('sado-parts-user');
console.log('Cached user:', cachedUser ? JSON.parse(cachedUser) : 'None');

// Clear localStorage if needed
if (cachedUser) {
  console.log('Clearing cached user...');
  localStorage.removeItem('sado-parts-user');
  console.log('Cached user cleared. Please refresh the page.');
} else {
  console.log('No cached user found.');
}

// Check current authentication state
console.log('=== END AUTH DEBUG ===');
