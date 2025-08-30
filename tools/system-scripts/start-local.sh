#!/bin/bash

echo "🚀 启动本地开发环境（不使用Docker）..."

# 确保环境配置文件存在
echo "📝 创建后端环境配置文件..."
cat > backend/.env << EOF
# 数据库配置 - 使用本地PostgreSQL
DATABASE_URL="postgresql://financial_user:financial_password@localhost:5432/financial_db"

# Redis配置 - 使用本地Redis
REDIS_URL="redis://localhost:6379"

# JWT配置 - 这是登录必需的
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_EXPIRES_IN="30d"

# 服务器配置
NODE_ENV="development"
PORT=8000
API_VERSION="v1"

# 安全配置
BCRYPT_ROUNDS=12
EOF

# 检查PostgreSQL是否运行
echo "🔍 检查PostgreSQL状态..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL未安装。请先安装PostgreSQL。"
    echo "   macOS: brew install postgresql"
    exit 1
fi

# 检查Redis是否运行
echo "🔍 检查Redis状态..."
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis未安装。请先安装Redis。"
    echo "   macOS: brew install redis"
    exit 1
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
npm install

# 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npx prisma generate

# 运行数据库迁移（如果需要）
echo "🗄️ 运行数据库迁移..."
# npx prisma migrate deploy || echo "⚠️ 数据库迁移失败，可能需要手动创建数据库"

# 启动后端服务
echo "🚀 启动后端服务..."
npm run dev &
BACKEND_PID=$!

cd ..

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
npm install

# 启动前端服务
echo "🚀 启动前端服务..."
npm run dev &
FRONTEND_PID=$!

cd ..

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🏥 检查服务状态..."
curl -f http://localhost:8000/health && echo "✅ 后端服务正常" || echo "⚠️ 后端服务可能还在启动中"
curl -f http://localhost:3000 && echo "✅ 前端服务正常" || echo "⚠️ 前端服务可能还在启动中"

echo "
🎉 本地开发环境启动完成！

📌 登录账号：
   邮箱: admin@financial.com
   密码: admin123456

📌 或者：
   邮箱: user@financial.com
   密码: user123456

🌐 访问地址: http://localhost:3000
🔧 后端API: http://localhost:8000

⚠️  注意：这是一个演示环境，使用内存中的模拟数据。
    如需持久化数据，请配置本地PostgreSQL数据库。

按 Ctrl+C 停止所有服务
"

# 等待用户按Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 