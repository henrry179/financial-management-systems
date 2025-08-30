# 智能财务管理系统 - 开发环境启动脚本 (Windows PowerShell)

Write-Host "🚀 启动智能财务管理系统开发环境..." -ForegroundColor Green

# 检查是否安装了 Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker 未安装，请先安装 Docker Desktop for Windows" -ForegroundColor Red
    exit 1
}

# 检查是否安装了 Docker Compose
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose 未安装，请先安装 Docker Compose" -ForegroundColor Red
    exit 1
}

# 检查是否安装了 Node.js
try {
    $nodeVersion = node --version
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        Write-Host "❌ Node.js 版本过低，当前版本: $nodeVersion，需要 18 或更高版本" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js 已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装，请先安装 Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 环境检查通过" -ForegroundColor Green

# 创建环境变量文件
Write-Host "📝 设置环境变量..." -ForegroundColor Cyan

if (!(Test-Path "backend\.env")) {
    Write-Host "📄 创建后端环境配置文件..." -ForegroundColor Yellow
    Copy-Item "backend\env.example" "backend\.env"
    Write-Host "✅ 后端 .env 文件已创建，请根据需要修改配置" -ForegroundColor Green
}

if (!(Test-Path "frontend\.env")) {
    Write-Host "📄 创建前端环境配置文件..." -ForegroundColor Yellow
    New-Item -Path "frontend\.env" -ItemType File -Force | Out-Null
    Set-Content -Path "frontend\.env" -Value @"
# API Configuration
VITE_API_URL=http://localhost:8000

# App Configuration
VITE_APP_NAME=智能财务管理系统
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development
"@
    Write-Host "✅ 前端 .env 文件已创建" -ForegroundColor Green
}

# 安装依赖
Write-Host "📦 安装项目依赖..." -ForegroundColor Cyan
npm install

Write-Host "📦 安装前端依赖..." -ForegroundColor Cyan
Set-Location frontend
npm install
Set-Location ..

Write-Host "📦 安装后端依赖..." -ForegroundColor Cyan
Set-Location backend
npm install
Set-Location ..

# 启动数据库服务
Write-Host "🗄️ 启动数据库服务..." -ForegroundColor Cyan
docker-compose up -d postgres redis

# 等待数据库启动
Write-Host "⏳ 等待数据库启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 运行数据库迁移
Write-Host "🔄 运行数据库迁移..." -ForegroundColor Cyan
Set-Location backend
npm run db:generate
npm run db:migrate

# 填充测试数据
Write-Host "🌱 填充测试数据..." -ForegroundColor Cyan
npm run db:seed
Set-Location ..

Write-Host "🎉 数据库设置完成" -ForegroundColor Green

# 启动开发服务器
Write-Host "🚀 启动开发服务器..." -ForegroundColor Green
Write-Host ""
Write-Host "✅ 开发环境启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 访问地址：" -ForegroundColor Cyan
Write-Host "   前端: http://localhost:3000" -ForegroundColor White
Write-Host "   后端: http://localhost:8000" -ForegroundColor White
Write-Host "   API文档: http://localhost:8000/api/v1/docs" -ForegroundColor White
Write-Host "   数据库管理: http://localhost:5050" -ForegroundColor White
Write-Host ""
Write-Host "📧 默认测试账户：" -ForegroundColor Cyan
Write-Host "   邮箱: admin@financial.com" -ForegroundColor White
Write-Host "   密码: admin123456" -ForegroundColor White
Write-Host ""
Write-Host "🛑 停止服务器：按 Ctrl+C" -ForegroundColor Yellow

npm run dev 