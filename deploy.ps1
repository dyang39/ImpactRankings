# Impact Rankings Frontend Deployment Script
# PowerShell script for deploying to AWS S3

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$CloudFrontDistributionId,
    
    [Parameter(Mandatory=$false)]
    [string]$Profile = "default"
)

Write-Host "🚀 Starting deployment to AWS S3..." -ForegroundColor Green

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✓ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Check if bucket exists
Write-Host "🔍 Checking S3 bucket: $BucketName" -ForegroundColor Yellow
try {
    aws s3 ls s3://$BucketName --profile $Profile | Out-Null
    Write-Host "✓ Bucket exists" -ForegroundColor Green
} catch {
    Write-Host "✗ Bucket does not exist or access denied" -ForegroundColor Red
    Write-Host "Please create the bucket first or check your AWS credentials" -ForegroundColor Yellow
    exit 1
}

# Sync files to S3
Write-Host "📤 Uploading files to S3..." -ForegroundColor Yellow
try {
    aws s3 sync public/ s3://$BucketName/ --delete --profile $Profile
    Write-Host "✓ Files uploaded successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to upload files" -ForegroundColor Red
    exit 1
}

# Set proper content types
Write-Host "🔧 Setting content types..." -ForegroundColor Yellow
try {
    # HTML files
    aws s3 cp s3://$BucketName/ s3://$BucketName/ --recursive --content-type "text/html" --exclude "*" --include "*.html" --metadata-directive REPLACE --profile $Profile
    
    # CSS files
    aws s3 cp s3://$BucketName/ s3://$BucketName/ --recursive --content-type "text/css" --exclude "*" --include "*.css" --metadata-directive REPLACE --profile $Profile
    
    # JavaScript files
    aws s3 cp s3://$BucketName/ s3://$BucketName/ --recursive --content-type "application/javascript" --exclude "*" --include "*.js" --metadata-directive REPLACE --profile $Profile
    
    # CSV files
    aws s3 cp s3://$BucketName/ s3://$BucketName/ --recursive --content-type "text/csv" --exclude "*" --include "*.csv" --metadata-directive REPLACE --profile $Profile
    
    Write-Host "✓ Content types set successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠ Warning: Failed to set some content types" -ForegroundColor Yellow
}

# Invalidate CloudFront cache if distribution ID provided
if ($CloudFrontDistributionId) {
    Write-Host "🔄 Invalidating CloudFront cache..." -ForegroundColor Yellow
    try {
        aws cloudfront create-invalidation --distribution-id $CloudFrontDistributionId --paths "/*" --profile $Profile
        Write-Host "✓ CloudFront cache invalidated" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Warning: Failed to invalidate CloudFront cache" -ForegroundColor Yellow
    }
}

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "Your application should be available at: https://$BucketName.s3-website-us-east-1.amazonaws.com" -ForegroundColor Cyan

if ($CloudFrontDistributionId) {
    Write-Host "CloudFront distribution: $CloudFrontDistributionId" -ForegroundColor Cyan
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Test your application at the S3 website URL" -ForegroundColor White
Write-Host "2. Configure CloudFront distribution for custom domain" -ForegroundColor White
Write-Host "3. Set up automated deployment with GitHub Actions" -ForegroundColor White
