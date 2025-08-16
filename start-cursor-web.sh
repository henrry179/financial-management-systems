#!/bin/bash

# Cursor 网页端快速启动脚本
# 一键启动财务管理系统

echo "🚀 Cursor 网页端财务管理系统启动器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"

# 创建日志目录
mkdir -p logs

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
cd ../backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# 配置网页端环境
echo "⚙️ 配置网页端环境..."

# 前端配置
cd ../frontend
cat > vite.config.web.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
EOF

# 添加网页端启动脚本
npm pkg set scripts.dev:web="vite --config vite.config.web.ts"

# 后端配置
cd ../backend
cat > .env.web << 'EOF'
NODE_ENV=development
PORT=8000
HOST=0.0.0.0
DATABASE_URL="file:./dev.db"
JWT_SECRET=cursor-web-dev-secret-2024
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
LOG_LEVEL=info
REDIS_ENABLED=false
EOF

# 添加网页端启动脚本
npm pkg set scripts.dev:web="tsx watch --env-file=.env.web src/index.ts"

echo "🗄️ 初始化SQLite数据库..."
# 简化的数据库schema
cat > prisma/schema.web.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  transactions Transaction[]
  
  @@map("users")
}

model Transaction {
  id          Int      @id @default(autoincrement())
  userId      Int
  type        String
  amount      Float
  category    String
  description String?
  date        DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("transactions")
}
EOF

# 初始化数据库
if [ ! -f "prisma/dev.db" ]; then
    npx prisma generate --schema=prisma/schema.web.prisma
    npx prisma db push --schema=prisma/schema.web.prisma
    
    # 创建测试数据
    cat > init-data.js << 'EOF'
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)
  
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: '演示用户',
    },
  })

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        type: 'income',
        amount: 5000,
        category: '工资',
        description: '月工资',
        date: new Date(),
      },
      {
        userId: user.id,
        type: 'expense',
        amount: 1200,
        category: '住房',
        description: '房租',
        date: new Date(),
      },
    ],
  })

  console.log('✅ 测试数据创建完成')
}

main().catch(console.error).finally(() => prisma.$disconnect())
EOF

    node init-data.js
    rm init-data.js
fi

echo "🚀 启动后端服务..."
nohup npm run dev:web > ../logs/backend.log 2>&1 &
echo $! > ../logs/backend.pid

# 等待后端启动
echo "⏳ 等待后端服务启动..."
for i in {1..20}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ 后端服务启动成功"
        break
    fi
    sleep 1
done

cd ../

echo ""
echo "🌐 服务访问信息"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 前端开发服务器: http://localhost:3000"
echo "✅ 后端API服务:    http://localhost:8000"
echo "✅ 健康检查:       http://localhost:8000/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 测试账号:"
echo "   邮箱: demo@example.com"
echo "   密码: 123456"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 提示: 按 Ctrl+C 停止前端服务"
echo ""

# 启动前端
echo "🎨 启动前端服务..."
cd frontend
npm run dev:web