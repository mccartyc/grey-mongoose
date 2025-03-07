// netlify/plugins/env-vars-check/index.js

module.exports = {
  onPreBuild: ({ utils }) => {
    // Check for required environment variables
    const requiredEnvVars = [
      'REACT_APP_API_URL',
      'REACT_APP_ENCRYPTION_KEY',
      'REACT_APP_ENCRYPTION_IV'
    ];
    
    let missingVars = [];
    
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      utils.build.failBuild(
        `Missing required environment variables: ${missingVars.join(', ')}. ` +
        'Please set these in the Netlify UI under Site settings > Build & deploy > Environment.'
      );
    } else {
      console.log('✅ All required environment variables are set');
      
      // Log the API URL for debugging (masking sensitive values)
      console.log(`🔗 API URL: ${process.env.REACT_APP_API_URL}`);
      console.log(`🔑 Encryption Key: ${'*'.repeat(8)}`);
      
      // Explicitly set CI to false to prevent warnings from being treated as errors
      process.env.CI = 'false';
      console.log('🚫 Set CI=false to prevent warnings from being treated as errors');
    }
  },
  
  onBuild: () => {
    console.log('🔧 Build process is running with the following environment:');
    console.log(`🌐 NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`🚫 CI: ${process.env.CI}`);
  }
};
