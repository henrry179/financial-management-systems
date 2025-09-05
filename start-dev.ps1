# 财务管理系统开发环境启动脚本
Write-Host "🚀 启动财务管理系统开发环境" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查Node.js环境
Write-Host "📦 检查Node.js环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装或未添加到PATH" -ForegroundColor Red
    Write-Host "请安装 Node.js 18+ 版本" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 检查npm
try {
    $npmVersion = npm --version
    Write-Host "✅ NPM 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ NPM 未安装" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 安装后端依赖
Write-Host "📦 安装后端依赖..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装后端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 后端依赖安装失败" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
}

# 生成Prisma客户端
Write-Host "🔧 生成Prisma客户端..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma客户端生成失败" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 初始化数据库
Write-Host "🗄️ 初始化数据库..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 数据库初始化失败" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 填充种子数据
Write-Host "🌱 填充种子数据..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ 种子数据填充失败，但可以继续" -ForegroundColor Yellow
}

# 启动后端服务
Write-Host "🚀 启动后端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

# 等待后端服务启动
Write-Host "⏳ 等待后端服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 安装前端依赖
Write-Host "📦 安装前端依赖..." -ForegroundColor Yellow
Set-Location ..\frontend
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装前端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 前端依赖安装失败" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
}

# 启动前端服务
Write-Host "🎨 启动前端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

# 等待前端服务启动
Write-Host "⏳ 等待前端服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# 打开浏览器
Write-Host "🌐 打开浏览器..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host "✅ 系统启动完成！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "🌐 前端界面: http://localhost:3000" -ForegroundColor Cyan
Write-Host "⚡ 后端API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📊 健康检查: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Green

Read-Host "按回车键退出"
