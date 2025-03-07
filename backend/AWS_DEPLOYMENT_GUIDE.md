# AWS Elastic Beanstalk Deployment Guide

This guide provides step-by-step instructions for deploying the MindCloud backend to AWS Elastic Beanstalk.

## Prerequisites

1. An AWS account
2. AWS CLI and EB CLI installed (use the `npm run setup:aws` script)
3. MongoDB Atlas account (for database)

## Deployment Steps

### 1. Set Up AWS Tools

Run the setup script to install and configure the necessary AWS tools:

```bash
# Navigate to your backend directory
cd backend

# Install AWS CLI and EB CLI
npm run setup:aws

# Configure AWS CLI with your credentials
aws configure
```

When running `aws configure`, you'll need to provide:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-west-2)
- Default output format (json)

### 2. Deploy to Elastic Beanstalk

Run the deployment script:

```bash
npm run deploy:aws
```

This script will:
1. Initialize a new Elastic Beanstalk application if one doesn't exist
2. Create a new environment or use an existing one
3. Set up environment variables (MongoDB URI, encryption keys, etc.)
4. Deploy your application

### 3. Configure Your Frontend

After deployment, update your frontend to use the new API URL:

1. The deployment script will offer to update your `.env.production` file automatically
2. Deploy your frontend to Netlify with the updated API URL

### 4. Set Up HTTPS (Recommended)

For production applications, you should set up HTTPS:

1. Register a domain in AWS Route 53 or use an existing domain
2. Create an SSL certificate using AWS Certificate Manager
3. Configure your Elastic Beanstalk environment to use the certificate

```bash
# Add a custom domain to your environment
eb setenv --environment your-env-name DOMAIN=yourdomain.com

# Update your environment to use HTTPS
aws elasticbeanstalk update-environment \
  --environment-name your-env-name \
  --option-settings Namespace=aws:elb:listener:443,OptionName=SSLCertificateId,Value=your-certificate-arn
```

## Monitoring and Management

### View Application Health

```bash
eb health your-env-name
```

### View Logs

```bash
eb logs your-env-name
```

### SSH Into Your Instance

```bash
eb ssh your-env-name
```

### Scale Your Application

```bash
# Scale to 2 instances
eb scale 2 your-env-name
```

## Cost Management

Monitor your AWS costs:

1. Set up AWS Budgets to get alerts when costs exceed thresholds
2. Use the AWS Cost Explorer to analyze your spending
3. Consider using Reserved Instances for long-term cost savings

## Troubleshooting

### Common Issues

1. **Deployment Failures**:
   - Check logs: `eb logs your-env-name`
   - Verify your application starts locally: `npm start`

2. **MongoDB Connection Issues**:
   - Ensure your MongoDB Atlas IP whitelist includes Elastic Beanstalk IPs
   - Check environment variables: `eb printenv your-env-name`

3. **CORS Issues**:
   - Update your CORS configuration in `server.js` to include your frontend domain

### Getting Help

- AWS Elastic Beanstalk Documentation: [docs.aws.amazon.com/elasticbeanstalk](https://docs.aws.amazon.com/elasticbeanstalk/)
- AWS Forums: [forums.aws.amazon.com](https://forums.aws.amazon.com/)
- AWS Support: [aws.amazon.com/support](https://aws.amazon.com/support/)

## Additional Resources

- [AWS Elastic Beanstalk Developer Guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/Welcome.html)
- [AWS CLI Command Reference](https://docs.aws.amazon.com/cli/latest/reference/)
- [EB CLI Command Reference](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-getting-started.html)
