@echo off
echo 🚀 启动财务管理系统开发环境
echo ================================

echo 📦 检查Node.js环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装或未添加到PATH
    echo 请安装 Node.js 18+ 版本
    pause
    exit /b 1
)

echo ✅ Node.js 环境检查通过

echo 📦 安装后端依赖...
cd backend
if not exist node_modules (
    echo 正在安装后端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
)

echo 📦 安装前端依赖...
cd ..\frontend
if not exist node_modules (
    echo 正在安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 前端依赖安装失败
        pause
        exit /b 1
    )
)

echo 🔧 生成Prisma客户端...
cd ..\backend
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Prisma客户端生成失败
    pause
    exit /b 1
)

echo 🗄️ 初始化数据库...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ 数据库初始化失败
    pause
    exit /b 1
)

echo 🌱 填充种子数据...
call npm run db:seed
if %errorlevel% neq 0 (
    echo ⚠️ 种子数据填充失败，但可以继续
)

echo 🚀 启动后端服务...
start "后端服务" cmd /k "npm run dev"

echo ⏳ 等待后端服务启动...
timeout /t 5 /nobreak >nul

echo 🎨 启动前端服务...
cd ..\frontend
start "前端服务" cmd /k "npm run dev"

echo ⏳ 等待前端服务启动...
timeout /t 8 /nobreak >nul

echo 🌐 打开浏览器...
start http://localhost:3000

echo ✅ 系统启动完成！
echo ================================
echo 🌐 前端界面: http://localhost:3000
echo ⚡ 后端API: http://localhost:8000
echo 📊 健康检查: http://localhost:8000/health
echo ================================
echo 按任意键退出...
pause >nul
