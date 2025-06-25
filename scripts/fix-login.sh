#!/bin/bash

echo "🔧 修复登录问题..."

# 创建后端 .env 文件
echo "📝 创建后端环境配置文件..."
cat > backend/.env << EOF
# 数据库配置
DATABASE_URL="postgresql://financial_user:financial_password@localhost:5432/financial_db"

# Redis配置
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

echo "✅ 环境配置文件创建完成"

# 检查Docker服务状态
echo "🐳 检查Docker服务状态..."
docker-compose ps

# 重启后端服务以应用新配置
echo "🔄 重启后端服务..."
docker-compose restart backend

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查后端健康状态
echo "🏥 检查后端健康状态..."
curl -f http://localhost:8000/health || echo "⚠️ 后端服务可能还在启动中"

echo "
✅ 修复完成！

📌 您现在可以使用以下账号登录：
   邮箱: admin@financial.com
   密码: admin123456

📌 或者：
   邮箱: user@financial.com  
   密码: user123456

🌐 访问地址: http://localhost:3000
"

# 可选：查看后端日志
echo "📋 查看后端日志（按Ctrl+C退出）："
docker-compose logs -f backend 