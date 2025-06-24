#!/bin/bash

# 快速启动脚本 - 智能财务管理系统

echo "🚀 快速启动智能财务管理系统..."

# 检查环境
if ! command -v docker &> /dev/null; then
    echo "❌ 需要安装 Docker"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ 需要安装 Node.js 18+"
    exit 1
fi

# 创建环境文件
if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "✅ 环境配置已创建"
fi

# 一键启动
echo "🔄 正在启动所有服务..."
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 20

echo "
╔══════════════════════════════════════════════════════════════╗
║                   🎉 系统启动完成！                          ║
╚══════════════════════════════════════════════════════════════╝

🌐 访问地址：
  📱 前端界面: http://localhost:3000
  🔗 后端API:  http://localhost:8000
  🗄️  数据库管理: http://localhost:5050

🔑 测试账户：
  📧 邮箱: admin@financial.com
  🔒 密码: admin123456

💡 停止系统：docker-compose down
" 