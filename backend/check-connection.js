// Simple script to check connectivity to the AWS backend
const axios = require('axios');

const backendDomain = 'grey-mongoose-prod.eba-asi6kjji.us-west-2.elasticbeanstalk.com';
const backendUrl = 'https://' + backendDomain;
const httpBackendUrl = 'http://' + backendDomain;

// Test basic connectivity
async function checkBasicConnectivity() {
  try {
    console.log(`Testing basic connectivity to ${backendUrl}...`);
    const response = await axios.get(backendUrl, { timeout: 10000 });
    console.log('✅ Basic connectivity successful!');
    console.log(`Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('❌ Basic connectivity failed!');
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

// Test API endpoint
async function checkApiEndpoint() {
  try {
    console.log(`\nTesting API endpoint ${backendUrl}/api/health...`);
    const response = await axios.get(`${backendUrl}/api/health`, { timeout: 10000 });
    console.log('✅ API endpoint check successful!');
    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API endpoint check failed!');
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

// Run tests
async function runTests() {
  console.log('=== AWS Backend Connectivity Test ===');
  const basicConnectivity = await checkBasicConnectivity();
  
  if (basicConnectivity) {
    await checkApiEndpoint();
  }
  
  console.log('\n=== Diagnosis ===');
  if (!basicConnectivity) {
    console.log(`
    1. AWS Security Group Issue: Most likely cause
       - Log into AWS Console
       - Go to EC2 > Security Groups
       - Find the security group for your Elastic Beanstalk environment
       - Add inbound rules for HTTP (80) and HTTPS (443) from anywhere (0.0.0.0/0)
    
    2. Application Not Running: Less likely since EB status shows "Green"
       - Check EB logs in AWS Console
       - Ensure application is listening on the correct port (8081)
    `);
  }
}

// Check HTTP connectivity
async function checkHttpConnectivity() {
  try {
    console.log(`\nTesting HTTP connectivity to ${httpBackendUrl}...`);
    const response = await axios.get(httpBackendUrl, { timeout: 10000 });
    console.log('✅ HTTP connectivity successful!');
    console.log(`Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('❌ HTTP connectivity failed!');
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

// Check specific port
async function checkPort(port) {
  try {
    console.log(`\nTesting direct port connectivity to ${backendDomain}:${port}...`);
    const response = await axios.get(`http://${backendDomain}:${port}`, { 
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    });
    console.log(`✅ Port ${port} connectivity successful!`);
    console.log(`Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`❌ Port ${port} connectivity failed!`);
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

// Run all tests
async function runAllTests() {
  await runTests();
  await checkHttpConnectivity();
  
  // Also test direct port connectivity to 8081
  console.log('\n=== Testing Direct Port Connectivity ===');
  await checkPort(8081);
}

runAllTests();
