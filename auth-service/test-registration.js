// test-registration.js
// Run this script to test if registration is working

const axios = require('axios');

const API_URL = 'http://localhost:3001'; // Adjust port if needed

async function testRegistration() {
  console.log('🧪 Testing Registration...\n');

  // Test user data
  const testUser = {
    email: `test${Date.now()}@example.com`, // Unique email each time
    password: 'SecurePassword123!',
    full_name: 'Test User'
  };

  try {
    // 1. Test registration
    console.log('1️⃣ Registering new user...');
    const registerResponse = await axios.post(`${API_URL}/api/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data);
    console.log('\n');

    // 2. Test login with the new user
    console.log('2️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_URL}/api/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data);
    console.log('\n');

    // 3. Test token verification
    console.log('3️⃣ Verifying token...');
    const token = loginResponse.data.token;
    const verifyResponse = await axios.get(`${API_URL}/api/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Token verified:', verifyResponse.data);
    console.log('\n');

    // 4. Test duplicate registration (should fail)
    console.log('4️⃣ Testing duplicate registration (should fail)...');
    try {
      await axios.post(`${API_URL}/api/register`, testUser);
    } catch (error) {
      console.log('✅ Duplicate registration correctly rejected:', error.response.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testRegistration();
