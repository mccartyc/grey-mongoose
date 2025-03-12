// Test script for login endpoint
const axios = require('axios');

const backendUrl = 'http://grey-mongoose-prod.eba-asi6kjji.us-west-2.elasticbeanstalk.com:8081';

async function testLoginEndpoint() {
  try {
    console.log(`Testing login endpoint at ${backendUrl}/api/auth/login...`);
    
    // We're not actually trying to log in, just checking if the endpoint responds
    const response = await axios.post(`${backendUrl}/api/auth/login`, 
      { email: 'test@example.com', password: 'password' },
      { 
        timeout: 10000,
        validateStatus: function (status) {
          return true; // Accept any status code
        }
      }
    );
    
    console.log('✅ Login endpoint responded!');
    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Login endpoint test failed!');
    if (error.code === 'ECONNABORTED') {
      console.error('Connection timed out. This suggests a network or security group issue.');
    } else if (error.response) {
      console.error(`Received response with status: ${error.response.status}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    return false;
  }
}

// Run the test
testLoginEndpoint();
