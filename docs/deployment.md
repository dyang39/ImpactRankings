# Deployment Guide

## Overview

This frontend application is designed to be deployed as a static website on AWS S3 with CloudFront distribution.

## Prerequisites

- AWS CLI configured with appropriate permissions
- S3 bucket created for hosting
- CloudFront distribution set up
- Domain name configured (optional)

## Deployment Steps

### 1. Prepare Data Files

Ensure all CSV data files are in the `public/data/` directory:

```bash
public/data/
├── rankings.csv
├── faculty.csv
└── countries.csv
```

### 2. Deploy to S3

```bash
# Sync all files to S3 bucket
aws s3 sync public/ s3://your-bucket-name/ --delete

# Set proper content types
aws s3 cp public/ s3://your-bucket-name/ --recursive --content-type "text/html" --exclude "*" --include "*.html"
aws s3 cp public/ s3://your-bucket-name/ --recursive --content-type "text/css" --exclude "*" --include "*.css"
aws s3 cp public/ s3://your-bucket-name/ --recursive --content-type "application/javascript" --exclude "*" --include "*.js"
aws s3 cp public/ s3://your-bucket-name/ --recursive --content-type "text/csv" --exclude "*" --include "*.csv"
```

### 3. Configure S3 Bucket

Enable static website hosting:

```bash
# Enable static website hosting
aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html

# Set bucket policy for public read access
aws s3api put-bucket-policy --bucket your-bucket-name --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}'
```

### 4. CloudFront Configuration

Create CloudFront distribution:

```bash
# Create distribution (use AWS Console or CloudFormation)
# Origin: S3 bucket
# Default root object: index.html
# Error pages: 404 -> /index.html (for SPA routing)
```

### 5. Custom Domain (Optional)

Configure custom domain:

1. **Create SSL Certificate** in AWS Certificate Manager
2. **Add CNAME record** in DNS provider:
   ```
   impactrank.org -> d1234567890.cloudfront.net
   ```
3. **Update CloudFront distribution** with custom domain

## Automated Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS S3

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Deploy to S3
      run: |
        aws s3 sync public/ s3://${{ secrets.S3_BUCKET_NAME }}/ --delete
        aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

### Environment Variables

Set these secrets in GitHub repository:

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `S3_BUCKET_NAME`: S3 bucket name
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID

## Data Update Workflow

### Manual Update

1. **Update CSV files** in `public/data/`
2. **Deploy to S3**:
   ```bash
   aws s3 sync public/ s3://your-bucket-name/ --delete
   ```
3. **Invalidate CloudFront cache**:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

### Automated Update

1. **Backend system** generates new CSV files
2. **GitHub Action** automatically deploys updates
3. **CloudFront** serves updated content

## Monitoring

### CloudWatch Metrics

Monitor:
- CloudFront request metrics
- S3 storage metrics
- Error rates
- Cache hit ratios

### Health Checks

Set up health checks for:
- Main page availability
- Data file accessibility
- API response times

## Security

### S3 Bucket Security

- Enable versioning
- Enable server-side encryption
- Restrict public access to specific files
- Use IAM roles for deployment

### CloudFront Security

- Enable HTTPS only
- Use security headers
- Configure WAF rules if needed
- Set up origin access control

## Troubleshooting

### Common Issues

1. **404 Errors**: Check S3 bucket policy and CloudFront error pages
2. **CORS Issues**: Configure S3 CORS policy
3. **Cache Issues**: Invalidate CloudFront cache
4. **Data Not Loading**: Check file paths and permissions

### Debug Commands

```bash
# Check S3 bucket contents
aws s3 ls s3://your-bucket-name/ --recursive

# Test CloudFront distribution
curl -I https://your-domain.com

# Check CloudFront cache
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID
```

## Cost Optimization

- Use S3 Intelligent Tiering
- Configure CloudFront caching
- Compress static assets
- Monitor usage with AWS Cost Explorer
