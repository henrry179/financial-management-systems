# 智能财务管理系统 - 快速启动脚本
Write-Host "🚀 智能财务管理系统 - 快速启动" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# 检查Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 未安装 Node.js 或版本过低 (需要 >= 18.0.0)" -ForegroundColor Red
    Write-Host "请访问 https://nodejs.org 下载并安装最新版本" -ForegroundColor Yellow
    exit 1
}

# 检查npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: npm 未正确安装" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 安装项目依赖..." -ForegroundColor Blue

# 安装前端依赖
Write-Host "正在安装前端依赖..." -ForegroundColor Yellow
Push-Location frontend
if (Test-Path "package-lock.json") {
    npm ci
} else {
    npm install
}
Pop-Location

# 安装后端依赖  
Write-Host "正在安装后端依赖..." -ForegroundColor Yellow
Push-Location backend
if (Test-Path "package-lock.json") {
    npm ci
} else {
    npm install
}
Pop-Location

Write-Host ""
Write-Host "🔧 配置环境..." -ForegroundColor Blue

# 创建后端环境文件
if (-not (Test-Path "backend/.env")) {
    Write-Host "创建后端环境配置文件..." -ForegroundColor Yellow
    Copy-Item "backend/env.example" "backend/.env"
    Write-Host "✅ 已创建 backend/.env 文件" -ForegroundColor Green
    Write-Host "⚠️  请编辑 backend/.env 文件配置数据库连接" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 启动服务..." -ForegroundColor Blue

# 创建启动脚本
$startScript = @"
# 同时启动前端和后端服务

# 启动后端服务
Write-Host "🔧 启动后端服务..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

# 等待几秒让后端启动
Start-Sleep -Seconds 3

# 启动前端服务
Write-Host "🎨 启动前端服务..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "🎉 服务启动完成!" -ForegroundColor Green
Write-Host "📱 前端地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "⚡ 后端地址: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API文档: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 小贴士:" -ForegroundColor Yellow
Write-Host "  - 前端支持热重载，修改代码会自动刷新" -ForegroundColor Gray
Write-Host "  - 后端也支持热重载，修改代码会自动重启" -ForegroundColor Gray
Write-Host "  - 按 Ctrl+C 可以停止对应服务" -ForegroundColor Gray
Write-Host "  - 数据库默认使用 PostgreSQL，请确保已安装并配置" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 功能特性:" -ForegroundColor Yellow
Write-Host "  ✅ 智能记账管理" -ForegroundColor Gray
Write-Host "  ✅ 微信支付/支付宝批量导入" -ForegroundColor Gray
Write-Host "  ✅ 多种BI风格数据可视化" -ForegroundColor Gray
Write-Host "  ✅ 财务报告生成" -ForegroundColor Gray
Write-Host "  ✅ 预算管理" -ForegroundColor Gray
Write-Host ""
"@

Invoke-Expression $startScript

# 等待用户按键
Write-Host "按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 