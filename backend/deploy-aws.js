const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const deploy = async () => {
  try {
    // Ensure we're in the backend directory
    const backendDir = __dirname;
    
    // Create production build
    console.log('Installing dependencies...');
    execSync('npm install --production', { stdio: 'inherit', cwd: backendDir });

    // Create necessary Elastic Beanstalk files if they don't exist
    const procfile = `web: npm start`;
    fs.writeFileSync(path.join(backendDir, 'Procfile'), procfile);

    // Create production environment variables
    const envVars = `
      NODE_ENV=production
      PORT=8081
      CORS_ORIGIN=https://your-netlify-app.netlify.app
    `.trim();

    fs.writeFileSync(path.join(backendDir, '.env.production'), envVars);

    // Initialize Elastic Beanstalk if not already initialized
    if (!fs.existsSync(path.join(backendDir, '.elasticbeanstalk'))) {
      console.log('Initializing Elastic Beanstalk...');
      execSync('eb init grey-mongoose --platform node.js --region us-west-2', { 
        stdio: 'inherit',
        cwd: backendDir 
      });
    }

    // Create Elastic Beanstalk environment if it doesn't exist
    console.log('Creating/Updating Elastic Beanstalk environment...');
    try {
      execSync('eb status grey-mongoose-prod', { stdio: 'inherit', cwd: backendDir });
    } catch (error) {
      console.log('Creating new environment...');
      execSync(
        'eb create grey-mongoose-prod --instance-type t2.micro --single', 
        { stdio: 'inherit', cwd: backendDir }
      );
    }

    // Deploy
    console.log('Deploying application...');
    execSync('eb deploy grey-mongoose-prod', { stdio: 'inherit', cwd: backendDir });

    console.log('Deployment completed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
};

deploy();
