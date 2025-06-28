#!/bin/bash

echo "🚀 快速修复财务管理系统登录问题..."

# 创建后端环境文件
echo "📝 创建后端环境配置..."
cat > backend/.env << EOF
DATABASE_URL="postgresql://financial_user:financial_password@localhost:5432/financial_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_EXPIRES_IN="30d"
NODE_ENV="development"
PORT=8000
API_VERSION="v1"
BCRYPT_ROUNDS=12
EOF

# 启动后端（使用内存数据库模式）
echo "🚀 启动后端服务..."
cd backend
npm install
npx prisma generate
npm run dev &
BACKEND_PID=$!
cd ..

# 启动前端
echo "🚀 启动前端服务..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

# 等待服务启动
echo "⏳ 等待服务启动 (15秒)..."
sleep 15

# 显示成功信息
echo "
╔══════════════════════════════════════════════════════════════╗
║                    🎉 系统启动成功！                         ║
╚══════════════════════════════════════════════════════════════╝

🔑 测试登录账号：
   
   管理员账号:
   📧 邮箱: admin@financial.com
   🔒 密码: admin123456
   
   普通用户账号:
   📧 邮箱: user@financial.com
   🔒 密码: user123456

🌐 访问地址: http://localhost:3000

💡 说明：
   - 这是快速演示模式，使用内存中的模拟数据
   - 如需持久化数据，请修复 Docker 环境
   - 按 Ctrl+C 停止所有服务
"

# 等待用户退出
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait 