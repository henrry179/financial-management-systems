# 综合智能财务管理解决方案 - PowerShell 快速启动脚本
# 使用方法: .\scripts\setup.ps1

Write-Host "🚀 综合智能财务管理解决方案 - 快速启动" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue

# 检查必要工具是否已安装
function Check-Tools {
    Write-Host "📋 检查开发环境..." -ForegroundColor Blue
    
    # 检查 Node.js
    try {
        $nodeVersion = node --version
        $nodeVersionNumber = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
        if ($nodeVersionNumber -lt 18) {
            Write-Host "❌ Node.js 版本过低。当前版本: $nodeVersion，需要 18+ 版本" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Node.js 未安装。请安装 Node.js 18+ 版本" -ForegroundColor Red
        exit 1
    }
    
    # 检查 npm
    try {
        $npmVersion = npm --version
        Write-Host "✅ npm $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ npm 未安装" -ForegroundColor Red
        exit 1
    }
    
    # 检查 Docker
    try {
        $dockerVersion = docker --version
        Write-Host "✅ Docker $dockerVersion" -ForegroundColor Green
        $global:HAS_DOCKER = $true
    }
    catch {
        Write-Host "⚠️  Docker 未安装。将跳过容器化启动选项" -ForegroundColor Yellow
        $global:HAS_DOCKER = $false
    }
    
    # 检查 Docker Compose
    try {
        $dockerComposeVersion = docker-compose --version
        Write-Host "✅ Docker Compose $dockerComposeVersion" -ForegroundColor Green
        $global:HAS_DOCKER_COMPOSE = $true
    }
    catch {
        Write-Host "⚠️  Docker Compose 未安装" -ForegroundColor Yellow
        $global:HAS_DOCKER_COMPOSE = $false
    }
}

# 安装项目依赖
function Install-Dependencies {
    Write-Host "`n📦 安装项目依赖..." -ForegroundColor Blue
    
    # 安装根目录依赖
    Write-Host "安装根目录依赖..."
    npm install
    
    # 安装前端依赖
    Write-Host "安装前端依赖..."
    Set-Location frontend
    npm install
    Set-Location ..
    
    # 安装后端依赖
    Write-Host "安装后端依赖..."
    Set-Location backend
    npm install
    Set-Location ..
    
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
}

# 设置环境变量
function Setup-Environment {
    Write-Host "`n⚙️  设置环境变量..." -ForegroundColor Blue
    
    # 设置后端环境变量
    if (-not (Test-Path "backend\.env")) {
        Write-Host "创建后端环境变量文件..."
        Copy-Item "backend\env.example" "backend\.env"
        Write-Host "✅ 后端环境变量文件已创建: backend\.env" -ForegroundColor Green
        Write-Host "⚠️  请根据实际情况修改 backend\.env 文件中的配置" -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ 后端环境变量文件已存在" -ForegroundColor Green
    }
    
    # 设置前端环境变量
    if (-not (Test-Path "frontend\.env")) {
        Write-Host "创建前端环境变量文件..."
        @"
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
"@ | Out-File -FilePath "frontend\.env" -Encoding utf8
        Write-Host "✅ 前端环境变量文件已创建: frontend\.env" -ForegroundColor Green
    }
    else {
        Write-Host "✅ 前端环境变量文件已存在" -ForegroundColor Green
    }
}

# 设置数据库
function Setup-Database {
    Write-Host "`n🗄️  设置数据库..." -ForegroundColor Blue
    
    if ($global:HAS_DOCKER -and $global:HAS_DOCKER_COMPOSE) {
        Write-Host "使用 Docker 启动数据库服务..."
        
        # 启动数据库服务
        docker-compose up -d postgres redis
        
        Write-Host "等待数据库启动..."
        Start-Sleep -Seconds 10
        
        # 运行数据库迁移
        Write-Host "运行数据库迁移..."
        Set-Location backend
        npm run db:generate
        npm run db:migrate
        
        # 填充初始数据
        Write-Host "填充初始数据..."
        npm run db:seed
        Set-Location ..
        
        Write-Host "✅ 数据库设置完成" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  请手动设置 PostgreSQL 和 Redis 数据库" -ForegroundColor Yellow
        Write-Host "1. 安装 PostgreSQL 15+ 和 Redis 7+"
        Write-Host "2. 创建数据库: createdb financial_db"
        Write-Host "3. 运行: cd backend && npm run db:migrate && npm run db:seed"
    }
}

# 启动开发服务器
function Start-Development {
    Write-Host "`n🌟 启动开发服务器..." -ForegroundColor Blue
    
    Write-Host "请选择启动方式："
    Write-Host "1. 同时启动前后端 (推荐)"
    Write-Host "2. 仅启动后端"
    Write-Host "3. 仅启动前端"
    Write-Host "4. 使用 Docker 启动完整环境"
    Write-Host "5. 退出"
    
    $choice = Read-Host "请输入选择 (1-5)"
    
    switch ($choice) {
        "1" {
            Write-Host "🚀 启动前后端开发服务器..." -ForegroundColor Green
            npm run dev
        }
        "2" {
            Write-Host "🚀 启动后端开发服务器..." -ForegroundColor Green
            Set-Location backend
            npm run dev
        }
        "3" {
            Write-Host "🚀 启动前端开发服务器..." -ForegroundColor Green
            Set-Location frontend
            npm run dev
        }
        "4" {
            if ($global:HAS_DOCKER -and $global:HAS_DOCKER_COMPOSE) {
                Write-Host "🚀 使用 Docker 启动完整环境..." -ForegroundColor Green
                docker-compose up
            }
            else {
                Write-Host "❌ Docker 或 Docker Compose 未安装" -ForegroundColor Red
            }
        }
        "5" {
            Write-Host "👋 退出安装程序" -ForegroundColor Yellow
            exit 0
        }
        default {
            Write-Host "❌ 无效选择" -ForegroundColor Red
            Start-Development
        }
    }
}

# 显示访问信息
function Show-AccessInfo {
    Write-Host "`n🎉 设置完成！" -ForegroundColor Green
    Write-Host "`n📱 访问地址：" -ForegroundColor Blue
    Write-Host "• 前端应用: http://localhost:3000"
    Write-Host "• 后端API: http://localhost:8000"
    Write-Host "• API文档: http://localhost:8000/docs"
    Write-Host "• 数据库管理: http://localhost:5050 (pgAdmin)"
    Write-Host ""
    Write-Host "👤 默认账号：" -ForegroundColor Blue
    Write-Host "• 邮箱: admin@financial.com"
    Write-Host "• 密码: admin123456"
    Write-Host ""
    Write-Host "📚 更多信息：" -ForegroundColor Blue
    Write-Host "• 快速指南: docs\QUICK_START.md"
    Write-Host "• API文档: docs\api\API_DESIGN.md"
    Write-Host "• 项目文档: README.md"
}

# 主函数
function Main {
    Write-Host "开始设置项目...`n" -ForegroundColor Blue
    
    Check-Tools
    Install-Dependencies
    Setup-Environment
    Setup-Database
    Show-AccessInfo
    
    $startNow = Read-Host "`n是否现在启动开发服务器？(y/n)"
    
    if ($startNow -eq "y" -or $startNow -eq "Y") {
        Start-Development
    }
    else {
        Write-Host "🎯 稍后可以运行 'npm run dev' 启动开发服务器" -ForegroundColor Green
    }
}

# 执行主函数
Main 