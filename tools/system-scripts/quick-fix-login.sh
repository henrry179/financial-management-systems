#!/bin/bash

echo "🔧 快速修复登录问题..."

# 创建后端环境文件
echo "📝 创建后端 .env 文件..."
cat > backend/.env << EOF
DATABASE_URL="postgresql://financial_user:financial_password@localhost:5432/financial_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=8000
API_VERSION="v1"
BCRYPT_ROUNDS=12
EOF

echo "✅ .env 文件创建成功"

# 只启动后端服务
echo "🚀 启动后端服务..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
cd ..

# 启动前端服务
echo "🚀 启动前端服务..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

# 等待服务启动
echo "⏳ 等待服务启动 (15秒)..."
sleep 15

# 显示登录信息
echo "
✅ 服务启动完成！

🔑 演示登录账号：
   
   管理员账号:
   邮箱: admin@financial.com
   密码: admin123456
   
   普通用户账号:
   邮箱: user@financial.com
   密码: user123456

🌐 访问地址: http://localhost:3000

📝 说明：
   - 这是演示账号，登录时会使用内存中的模拟数据
   - 如果登录失败，请检查后端日志
   - 按 Ctrl+C 停止所有服务
"

# 捕获Ctrl+C信号
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# 显示后端日志
echo "📋 后端日志："
wait 