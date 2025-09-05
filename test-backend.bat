@echo off
echo 🔧 测试后端编译和启动
echo ========================

cd backend

echo 📦 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo 🔧 生成Prisma客户端...
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

echo 🏗️ 编译TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ TypeScript编译失败
    pause
    exit /b 1
)

echo ✅ 后端编译成功！
echo 🚀 启动后端服务...
call npm run dev

pause
