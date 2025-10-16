# Impact Rankings Frontend - Local Development Server
# PowerShell script for starting local development server

Write-Host "🚀 Starting Impact Rankings Frontend..." -ForegroundColor Green

# Check if Python is available
try {
    python --version | Out-Null
    Write-Host "✓ Python found" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python first." -ForegroundColor Red
    Write-Host "Alternatively, you can use Node.js with 'npm start'" -ForegroundColor Yellow
    exit 1
}

# Change to public directory
Set-Location public

Write-Host "📁 Changed to public directory" -ForegroundColor Yellow
Write-Host "🌐 Starting HTTP server on port 8000..." -ForegroundColor Yellow
Write-Host "`nYour application will be available at:" -ForegroundColor Cyan
Write-Host "http://localhost:8000" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

# Start Python HTTP server
python -m http.server 8000
