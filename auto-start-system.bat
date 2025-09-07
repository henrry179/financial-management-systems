@echo off
chcp 65001 >nul
echo.
echo ==================================================
echo 🚀 智能财务管理系统 - 自动启动脚本
echo ==================================================
echo.

REM 检查Node.js环境
echo ✅ 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js未安装，请先安装Node.js
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm未安装，请先安装npm
    pause
    exit /b 1
)

echo ✅ 环境检查通过
echo.

REM 清理现有进程
echo 🔧 清理现有服务进程...
npx kill-port 8000 3000 3001 3002 >nul 2>&1
echo ✅ 端口清理完成
echo.

REM 启动后端服务器
echo 🔧 启动后端服务器 (端口 8000)...
start "后端服务器" cmd /k "cd backend && npm run dev"

REM 等待后端启动
echo ⏳ 等待后端服务启动...
timeout /t 8 /nobreak >nul

REM 检查后端是否启动成功
echo 🔍 检查后端服务状态...
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ 后端服务启动失败，请检查错误信息
    pause
    exit /b 1
)

echo ✅ 后端服务启动成功
echo.

REM 启动前端服务器
echo 🎨 启动前端界面 (端口 3000)...
start "前端界面" cmd /k "cd frontend && npm run dev"

REM 等待前端启动
echo ⏳ 等待前端服务启动...
timeout /t 10 /nobreak >nul

echo ✅ 前端服务启动中
echo.

REM 打开启动门户
echo 🌐 打开系统启动门户...
start "" "launch-portal.html"

echo.
echo ==================================================
echo 🎉 系统启动完成！
echo 🔗 前端界面: http://localhost:3000
echo 🔗 后端API: http://localhost:8000  
echo 📖 API文档: http://localhost:8000/api/v1/docs
echo 🔐 登录账号: admin@financial.com / admin123456
echo ==================================================
echo.
echo 💡 提示:
echo   1. 系统会自动打开启动门户页面
echo   2. 点击页面中的按钮即可访问相应服务
echo   3. 不要关闭弹出的命令窗口
echo.

pause