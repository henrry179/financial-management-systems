#!/bin/bash

# Cursor 网页端开发启动脚本
# 专为 Cursor Background 网页环境设计

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}${1}${NC}"
}

# 检查运行环境
check_environment() {
    log_header "🌐 检查 Cursor 网页端环境..."
    
    # 检查是否在容器环境中
    if [ -f /.dockerenv ]; then
        log_info "检测到容器环境"
        ENV_TYPE="container"
    else
        log_info "检测到标准Linux环境"
        ENV_TYPE="linux"
    fi
    
    # 检查Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js已安装: $NODE_VERSION"
    else
        log_error "Node.js未安装，正在安装..."
        install_nodejs
    fi
    
    # 检查npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "npm已安装: $NPM_VERSION"
    else
        log_error "npm未找到"
        exit 1
    fi
    
    # 检查端口占用
    check_ports
}

# 安装Node.js (如果需要)
install_nodejs() {
    log_info "正在安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log_success "Node.js安装完成"
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用情况..."
    
    # 检查3000端口(前端)
    if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
        log_warning "端口3000已被占用，正在尝试释放..."
        pkill -f "vite" || true
        pkill -f "node.*3000" || true
        sleep 2
    fi
    
    # 检查8000端口(后端)
    if netstat -tuln 2>/dev/null | grep -q ":8000 "; then
        log_warning "端口8000已被占用，正在尝试释放..."
        pkill -f "tsx.*8000" || true
        pkill -f "node.*8000" || true
        sleep 2
    fi
}

# 安装依赖
install_dependencies() {
    log_header "📦 安装项目依赖..."
    
    # 前端依赖
    log_info "安装前端依赖..."
    cd /workspace/frontend
    if [ ! -d "node_modules" ]; then
        npm install --production=false
        log_success "前端依赖安装完成"
    else
        log_info "前端依赖已存在，跳过安装"
    fi
    
    # 后端依赖
    log_info "安装后端依赖..."
    cd /workspace/backend
    if [ ! -d "node_modules" ]; then
        npm install --production=false
        log_success "后端依赖安装完成"
    else
        log_info "后端依赖已存在，跳过安装"
    fi
    
    cd /workspace
}

# 配置前端开发环境
configure_frontend() {
    log_header "⚙️  配置前端开发环境..."
    
    cd /workspace/frontend
    
    # 创建网页端专用的Vite配置
    cat > vite.config.web.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Cursor 网页端专用配置
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
    host: '0.0.0.0',  // 重要：允许外部访问
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          charts: ['echarts', 'echarts-for-react']
        }
      }
    }
  }
})
EOF

    # 更新package.json启动脚本
    npm pkg set scripts.dev:web="vite --config vite.config.web.ts"
    npm pkg set scripts.start:web="vite --config vite.config.web.ts"
    
    log_success "前端配置完成"
}

# 配置后端开发环境
configure_backend() {
    log_header "⚙️  配置后端开发环境..."
    
    cd /workspace/backend
    
    # 创建网页端专用的环境配置
    cat > .env.web << 'EOF'
# Cursor 网页端开发环境配置
NODE_ENV=development
PORT=8000
HOST=0.0.0.0

# 数据库配置 (使用SQLite以简化网页端开发)
DATABASE_URL="file:./dev.db"

# JWT配置
JWT_SECRET=cursor-web-dev-secret-key-2024
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=*

# 日志配置
LOG_LEVEL=info

# Redis配置 (可选，网页端可以禁用)
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false

# 邮件配置 (开发环境)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dev@example.com
SMTP_PASS=dev-password

# 其他配置
API_PREFIX=/api/v1
FILE_UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10MB
EOF

    # 创建简化的数据库配置
    cat > prisma/schema.dev.prisma << 'EOF'
// Cursor 网页端开发专用数据库配置
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
  budgets      Budget[]
  
  @@map("users")
}

model Transaction {
  id          Int      @id @default(autoincrement())
  userId      Int
  type        String   // 'income' | 'expense'
  amount      Float
  category    String
  description String?
  date        DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("transactions")
}

model Budget {
  id        Int      @id @default(autoincrement())
  userId    Int
  category  String
  amount    Float
  period    String   // 'monthly' | 'yearly'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("budgets")
}
EOF

    # 添加网页端专用启动脚本
    npm pkg set scripts.dev:web="tsx watch --env-file=.env.web src/index.ts"
    npm pkg set scripts.start:web="tsx --env-file=.env.web src/index.ts"
    
    log_success "后端配置完成"
}

# 初始化数据库
initialize_database() {
    log_header "🗄️  初始化数据库..."
    
    cd /workspace/backend
    
    # 安装Prisma CLI
    if ! command -v prisma &> /dev/null; then
        npm install -g prisma
    fi
    
    # 使用简化的SQLite数据库
    if [ ! -f "prisma/dev.db" ]; then
        log_info "创建SQLite数据库..."
        
        # 生成Prisma客户端
        npx prisma generate --schema=prisma/schema.dev.prisma
        
        # 创建数据库
        npx prisma db push --schema=prisma/schema.dev.prisma
        
        # 创建初始用户数据
        cat > prisma/seed.web.ts << 'EOF'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建测试用户
  const hashedPassword = await bcrypt.hash('123456', 10)
  
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: '演示用户',
    },
  })

  // 创建示例交易数据
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
      {
        userId: user.id,
        type: 'expense',
        amount: 800,
        category: '餐饮',
        description: '生活费',
        date: new Date(),
      },
    ],
  })

  console.log('数据库初始化完成')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
EOF

        # 运行种子数据
        npx tsx prisma/seed.web.ts
        
        log_success "数据库初始化完成"
    else
        log_info "数据库已存在，跳过初始化"
    fi
}

# 启动后端服务
start_backend() {
    log_header "🚀 启动后端服务..."
    
    cd /workspace/backend
    
    # 后台启动后端
    nohup npm run dev:web > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    
    # 等待后端启动
    log_info "等待后端服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            log_success "后端服务启动成功 (PID: $BACKEND_PID)"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            log_error "后端服务启动超时"
            exit 1
        fi
    done
}

# 启动前端服务
start_frontend() {
    log_header "🎨 启动前端服务..."
    
    cd /workspace/frontend
    
    # 前台启动前端（以便看到输出）
    log_info "正在启动前端开发服务器..."
    npm run dev:web
}

# 创建日志目录
create_log_dir() {
    mkdir -p /workspace/logs
}

# 显示访问信息
show_access_info() {
    log_header "🌐 服务访问信息"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 前端开发服务器:${NC} http://localhost:3000"
    echo -e "${GREEN}✅ 后端API服务:${NC}    http://localhost:8000"
    echo -e "${GREEN}✅ API文档:${NC}        http://localhost:8000/api/docs"
    echo -e "${GREEN}✅ 健康检查:${NC}       http://localhost:8000/health"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📝 测试账号:${NC}"
    echo -e "   邮箱: demo@example.com"
    echo -e "   密码: 123456"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}💡 提示:${NC}"
    echo -e "   - 前端服务运行在前台，按 Ctrl+C 停止"
    echo -e "   - 后端服务运行在后台，日志在 logs/backend.log"
    echo -e "   - 数据库文件: backend/prisma/dev.db"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 清理函数
cleanup() {
    log_info "正在清理后台进程..."
    if [ -f /workspace/logs/backend.pid ]; then
        BACKEND_PID=$(cat /workspace/logs/backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm -f /workspace/logs/backend.pid
    fi
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    log_header "🚀 Cursor 网页端财务管理系统启动器"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    create_log_dir
    check_environment
    install_dependencies
    configure_frontend
    configure_backend
    initialize_database
    start_backend
    
    echo ""
    show_access_info
    echo ""
    
    # 启动前端（前台运行）
    start_frontend
}

# 运行主函数
main "$@"