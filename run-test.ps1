Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Venue API Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check dependencies
if (-not (Test-Path "node_modules\axios")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install axios form-data
}

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Yellow
Write-Host ""

node test-venue-api.mjs

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


