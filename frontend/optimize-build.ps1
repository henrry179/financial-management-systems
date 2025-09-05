Write-Host "🚀 Optimizing Financial Management System Build" -ForegroundColor Cyan
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

Write-Host "`n🧹 Cleaning previous build..." -ForegroundColor Blue
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Previous build cleaned." -ForegroundColor Green
}

Write-Host "`n🔍 Running linting..." -ForegroundColor Blue
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Linting issues found, but continuing with build..." -ForegroundColor Yellow
} else {
    Write-Host "✅ Linting passed." -ForegroundColor Green
}

Write-Host "`n🧪 Running tests..." -ForegroundColor Blue
npm run test
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some tests failed, but continuing with build..." -ForegroundColor Yellow
} else {
    Write-Host "✅ All tests passed." -ForegroundColor Green
}

Write-Host "`n🏗️  Building optimized production bundle..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host "`n📊 Analyzing bundle size..." -ForegroundColor Blue
if (Test-Path "dist") {
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "`n📁 Build output:" -ForegroundColor Cyan
    Get-ChildItem -Recurse "dist" | Format-Table Name, Length, LastWriteTime -AutoSize
    
    Write-Host "`n📈 Bundle analysis:" -ForegroundColor Cyan
    $totalSize = (Get-ChildItem -Recurse "dist" -File | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    Write-Host "Total bundle size: $totalSizeMB MB" -ForegroundColor Yellow
    
    # Analyze individual chunks
    $jsFiles = Get-ChildItem -Recurse "dist" -Filter "*.js" | Sort-Object Length -Descending
    Write-Host "`nLargest JavaScript files:" -ForegroundColor Yellow
    $jsFiles | Select-Object -First 5 | ForEach-Object {
        $sizeKB = [math]::Round($_.Length / 1KB, 2)
        Write-Host "  $($_.Name): $sizeKB KB" -ForegroundColor White
    }
    
    $cssFiles = Get-ChildItem -Recurse "dist" -Filter "*.css" | Sort-Object Length -Descending
    if ($cssFiles) {
        Write-Host "`nCSS files:" -ForegroundColor Yellow
        $cssFiles | ForEach-Object {
            $sizeKB = [math]::Round($_.Length / 1KB, 2)
            Write-Host "  $($_.Name): $sizeKB KB" -ForegroundColor White
        }
    }
} else {
    Write-Host "❌ Build output not found." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host "`n🎉 Build optimization completed!" -ForegroundColor Green
Write-Host "📦 Optimized files are in the 'dist' directory." -ForegroundColor Cyan
Write-Host "🚀 Ready for production deployment." -ForegroundColor Cyan
Write-Host "`nPress Enter to exit..." -ForegroundColor Yellow
Read-Host | Out-Null
exit 0
