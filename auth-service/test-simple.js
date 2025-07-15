// test-simple.js
// This is a very simple test to register a user

const http = require('http');

// Create test user data
const testUser = {
  email: `user${Date.now()}@test.com`,  // Unique email each time
  password: 'password123',
  full_name: 'Test User'
};

// Convert to JSON
const data = JSON.stringify(testUser);

// Set up the request options
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

// Make the request
console.log('📧 Trying to register user:', testUser.email);
console.log('');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('📊 Status Code:', res.statusCode);
    console.log('📨 Response:', responseData);
    
    try {
      const jsonResponse = JSON.parse(responseData);
      if (jsonResponse.userId) {
        console.log('');
        console.log('✅ SUCCESS! User was saved with ID:', jsonResponse.userId);
        console.log('');
        console.log('🎉 Your database is working! The user has been stored.');
      }
    } catch (e) {
      console.log('Response was:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('');
  console.log('Make sure your server is running on port 3001!');
  console.log('Run "npm start" in another terminal window.');
});

// Send the request
req.write(data);
req.end();