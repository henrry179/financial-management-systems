# 智能财务管理系统自动启动脚本 (PowerShell)
Write-Host "🚀 启动智能财务管理系统..." -ForegroundColor Green

# 检查 Node.js 环境
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js 未安装，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm 未安装，请先安装 npm" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 环境检查通过" -ForegroundColor Green

# 启动后端服务器
Write-Host "🔧 启动后端服务器 (端口 8000)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location backend
    npm run dev
}

# 等待后端启动
Start-Sleep -Seconds 5

# 启动前端服务器
Write-Host "🎨 启动前端界面 (端口 3001)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location frontend
    npm run dev
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🎉 系统启动完成！" -ForegroundColor Green
Write-Host "🔗 后端服务器: http://localhost:8000" -ForegroundColor White
Write-Host "🔗 前端界面: http://localhost:3001" -ForegroundColor White
Write-Host "📖 API文档: http://localhost:8000/api/v1/docs" -ForegroundColor White
Write-Host "🔐 登录账号: admin@financial.com / admin123456" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示: 按 Enter 键停止所有服务" -ForegroundColor Gray

# 等待用户输入
Read-Host "按 Enter 键停止"

# 停止服务
Write-Host "🛑 停止服务..." -ForegroundColor Yellow
Stop-Job $backendJob
Stop-Job $frontendJob
Remove-Job $backendJob
Remove-Job $frontendJob

Write-Host "✅ 所有服务已停止" -ForegroundColor Green