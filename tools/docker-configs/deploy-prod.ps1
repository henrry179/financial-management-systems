Write-Host "🚀 Deploying Financial Management System to Production" -ForegroundColor Cyan
Write-Host ""

# 检查Docker是否安装
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available." -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Docker Desktop and ensure it's running." -ForegroundColor Yellow
    Write-Host "See: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

# 检查Docker Compose是否安装
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available." -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Docker Compose." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

# 检查环境变量文件
if (-not (Test-Path ".env.prod")) {
    Write-Host "⚠️  .env.prod file not found." -ForegroundColor Yellow
    Write-Host "Creating from example..." -ForegroundColor Blue
    if (Test-Path "env.prod.example") {
        Copy-Item "env.prod.example" ".env.prod"
        Write-Host "✅ Created .env.prod from example." -ForegroundColor Green
        Write-Host "⚠️  Please edit .env.prod with your actual values before continuing." -ForegroundColor Yellow
        Read-Host "Press Enter to continue..."
    } else {
        Write-Host "❌ env.prod.example file not found." -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit 1
    }
}

Write-Host "`n🔍 Checking Docker daemon..." -ForegroundColor Blue
try {
    docker info | Out-Null
    Write-Host "✅ Docker daemon is running." -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host "`n🧹 Cleaning up previous deployment..." -ForegroundColor Blue
try {
    docker-compose -f docker-compose.prod.yml down -v
    Write-Host "✅ Previous deployment cleaned up." -ForegroundColor Green
} catch {
    Write-Host "⚠️  Failed to clean up previous deployment, continuing..." -ForegroundColor Yellow
}

Write-Host "`n🏗️  Building production images..." -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build production images." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}
Write-Host "✅ Production images built successfully." -ForegroundColor Green

Write-Host "`n🚀 Starting production services..." -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start production services." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}
Write-Host "✅ Production services started successfully." -ForegroundColor Green

Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Blue
Start-Sleep -Seconds 30

Write-Host "`n🔍 Checking service health..." -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml ps

Write-Host "`n📊 Service URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "  Nginx: http://localhost:80" -ForegroundColor White
Write-Host "  Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "  Grafana: http://localhost:3001" -ForegroundColor White

Write-Host "`n🎉 Production deployment completed successfully!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure your domain and SSL certificates" -ForegroundColor White
Write-Host "  2. Set up monitoring alerts in Grafana" -ForegroundColor White
Write-Host "  3. Configure backup strategies for PostgreSQL" -ForegroundColor White
Write-Host "  4. Set up log aggregation" -ForegroundColor White

Write-Host "`nPress Enter to exit..." -ForegroundColor Yellow
Read-Host | Out-Null
exit 0
