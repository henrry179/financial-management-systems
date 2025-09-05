@echo off
echo 🚀 Deploying Financial Management System to Production
echo.

:: 检查Docker是否安装
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH.
    echo Please install Docker Desktop and ensure it's running.
    echo See: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

:: 检查Docker Compose是否安装
where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed or not in PATH.
    echo Please install Docker Compose.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are available.

:: 检查环境变量文件
if not exist ".env.prod" (
    echo ⚠️  .env.prod file not found.
    echo Creating from example...
    if exist "env.prod.example" (
        copy "env.prod.example" ".env.prod"
        echo ✅ Created .env.prod from example.
        echo ⚠️  Please edit .env.prod with your actual values before continuing.
        pause
    ) else (
        echo ❌ env.prod.example file not found.
        pause
        exit /b 1
    )
)

echo.
echo 🔍 Checking Docker daemon...
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker daemon is not running.
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker daemon is running.

echo.
echo 🧹 Cleaning up previous deployment...
docker-compose -f docker-compose.prod.yml down -v
if %errorlevel% neq 0 (
    echo ⚠️  Failed to clean up previous deployment, continuing...
)

echo.
echo 🏗️  Building production images...
docker-compose -f docker-compose.prod.yml build --no-cache
if %errorlevel% neq 0 (
    echo ❌ Failed to build production images.
    pause
    exit /b 1
)

echo ✅ Production images built successfully.

echo.
echo 🚀 Starting production services...
docker-compose -f docker-compose.prod.yml up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start production services.
    pause
    exit /b 1
)

echo ✅ Production services started successfully.

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

echo.
echo 🔍 Checking service health...
docker-compose -f docker-compose.prod.yml ps

echo.
echo 📊 Service URLs:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8000
echo   Nginx: http://localhost:80
echo   Prometheus: http://localhost:9090
echo   Grafana: http://localhost:3001
echo.

echo 🎉 Production deployment completed successfully!
echo.
echo 📝 Next steps:
echo   1. Configure your domain and SSL certificates
echo   2. Set up monitoring alerts in Grafana
echo   3. Configure backup strategies for PostgreSQL
echo   4. Set up log aggregation
echo.
echo Press any key to exit...
pause >nul
exit /b 0
