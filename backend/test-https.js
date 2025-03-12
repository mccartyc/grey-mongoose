// Test script for HTTPS connectivity
const axios = require('axios');

const httpsBackendUrl = 'https://grey-mongoose-prod.eba-asi6kjji.us-west-2.elasticbeanstalk.com';

async function testHttpsConnectivity() {
  try {
    console.log(`Testing HTTPS connectivity to ${httpsBackendUrl}...`);
    const response = await axios.get(httpsBackendUrl, { 
      timeout: 10000,
      validateStatus: function (status) {
        return true; // Accept any status code
      }
    });
    console.log('✅ HTTPS connectivity successful!');
    console.log(`Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('❌ HTTPS connectivity failed!');
    if (error.code === 'ECONNABORTED') {
      console.error('Connection timed out.');
    } else if (error.response) {
      console.error(`Received response with status: ${error.response.status}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    return false;
  }
}

// Test login endpoint over HTTPS
async function testHttpsLoginEndpoint() {
  try {
    console.log(`\nTesting login endpoint over HTTPS at ${httpsBackendUrl}/api/auth/login...`);
    
    const response = await axios.post(`${httpsBackendUrl}/api/auth/login`, 
      { email: 'test@example.com', password: 'password' },
      { 
        timeout: 10000,
        validateStatus: function (status) {
          return true; // Accept any status code
        }
      }
    );
    
    console.log('✅ HTTPS login endpoint responded!');
    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ HTTPS login endpoint test failed!');
    if (error.code === 'ECONNABORTED') {
      console.error('Connection timed out.');
    } else if (error.response) {
      console.error(`Received response with status: ${error.response.status}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    return false;
  }
}

// Run tests
async function runTests() {
  await testHttpsConnectivity();
  await testHttpsLoginEndpoint();
}

runTests();
