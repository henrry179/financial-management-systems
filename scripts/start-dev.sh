#!/bin/bash

# 智能财务管理系统 - 开发环境启动脚本

set -e

echo "🚀 启动智能财务管理系统开发环境..."

# 检查是否安装了 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18 或更高版本"
    exit 1
fi

echo "✅ 环境检查通过"

# 创建环境变量文件
echo "📝 设置环境变量..."

if [ ! -f backend/.env ]; then
    echo "📄 创建后端环境配置文件..."
    cp backend/env.example backend/.env
    echo "✅ 后端 .env 文件已创建，请根据需要修改配置"
fi

if [ ! -f frontend/.env ]; then
    echo "📄 创建前端环境配置文件..."
    cp frontend/.env.example frontend/.env
    echo "✅ 前端 .env 文件已创建"
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install

echo "📦 安装前端依赖..."
cd frontend && npm install && cd ..

echo "📦 安装后端依赖..."
cd backend && npm install && cd ..

# 启动数据库服务
echo "🗄️ 启动数据库服务..."
docker-compose up -d postgres redis

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 运行数据库迁移
echo "🔄 运行数据库迁移..."
cd backend
npm run db:generate
npm run db:migrate

# 填充测试数据
echo "🌱 填充测试数据..."
npm run db:seed
cd ..

echo "🎉 数据库设置完成"

# 启动开发服务器
echo "🚀 启动开发服务器..."
npm run dev

echo "✅ 开发环境启动完成！"
echo ""
echo "🌐 访问地址："
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:8000"
echo "   API文档: http://localhost:8000/api/v1/docs"
echo "   数据库管理: http://localhost:5050"
echo ""
echo "📧 默认测试账户："
echo "   邮箱: admin@financial.com"
echo "   密码: admin123456"
echo ""
echo "🛑 停止服务器：按 Ctrl+C" 