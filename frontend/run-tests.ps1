Write-Host "🧪 Running Financial Management System Tests" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
try {
    node --version | Out-Null
    Write-Host "✅ Node.js is available." -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js (LTS) and ensure it's in your system PATH." -ForegroundColor Yellow
    Write-Host "See: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

# Check if npm is available
try {
    npm --version | Out-Null
    Write-Host "✅ npm is available." -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js (LTS) which includes npm." -ForegroundColor Yellow
    Write-Host "See: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Blue
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit 1
    }
    Write-Host "✅ Dependencies installed." -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed." -ForegroundColor Green
}

Write-Host "`n🧪 Running tests..." -ForegroundColor Blue
Write-Host ""

# Run tests with coverage
npm run test:coverage

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ All tests passed!" -ForegroundColor Green
    Write-Host "📊 Coverage report generated in coverage/ directory." -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Some tests failed." -ForegroundColor Red
    Write-Host "Check the output above for details." -ForegroundColor Yellow
}

Write-Host "`nPress Enter to exit..." -ForegroundColor Yellow
Read-Host | Out-Null
exit 0
