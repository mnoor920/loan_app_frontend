// Quick API test
const jwt = require('jsonwebtoken');

// Create a test JWT token for the user we know exists
const testUserId = '0a99d67e-99e8-4aae-b482-b8a77026de0a'; // shahram123@gmail.com
const testEmail = 'shahram123@gmail.com';

const token = jwt.sign(
  { 
    userId: testUserId, 
    email: testEmail, 
    role: 'user' 
  },
  process.env.JWT_SECRET || 'brightlend-super-secret-jwt-key-2024-production-ready'
);

console.log('🧪 API Test');
console.log('===========');
console.log('Test User ID:', testUserId);
console.log('Test Email:', testEmail);
console.log('JWT Token (first 50 chars):', token.substring(0, 50) + '...');
console.log('');
console.log('To test manually:');
console.log('1. Open browser dev tools');
console.log('2. Go to Application > Cookies');
console.log('3. Set cookie: auth-token =', token);
console.log('4. Refresh the profile page');
console.log('5. Check console logs for debugging info');