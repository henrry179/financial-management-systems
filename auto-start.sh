#!/bin/bash

# 智能财务管理系统自动启动脚本
echo "🚀 启动智能财务管理系统..."

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "✅ 环境检查通过"

# 启动后端服务器
echo "🔧 启动后端服务器 (端口 8000)..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 5

# 启动前端服务器
echo "🎨 启动前端界面 (端口 3001)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# 保存进程ID
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo ""
echo "=================================================="
echo "🎉 系统启动完成！"
echo "🔗 后端服务器: http://localhost:8000"
echo "🔗 前端界面: http://localhost:3001"
echo "📖 API文档: http://localhost:8000/api/v1/docs"
echo "🔐 登录账号: admin@financial.com / admin123456"
echo "=================================================="
echo ""
echo "💡 提示: 按 Ctrl+C 停止所有服务"

# 等待用户中断
wait