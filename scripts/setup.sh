#!/bin/bash

# 综合智能财务管理解决方案 - 快速启动脚本
# 使用方法: ./scripts/setup.sh

echo "🚀 综合智能财务管理解决方案 - 快速启动"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查必要工具是否已安装
check_tools() {
    echo -e "${BLUE}📋 检查开发环境...${NC}"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装。请安装 Node.js 18+ 版本${NC}"
        exit 1
    fi
    
    node_version=$(node -v | sed 's/v//' | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        echo -e "${RED}❌ Node.js 版本过低。当前版本: $(node -v)，需要 18+ 版本${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm $(npm -v)${NC}"
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker 未安装。将跳过容器化启动选项${NC}"
        HAS_DOCKER=false
    else
        echo -e "${GREEN}✅ Docker $(docker --version | cut -d' ' -f3 | sed 's/,//')${NC}"
        HAS_DOCKER=true
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker Compose 未安装${NC}"
        HAS_DOCKER_COMPOSE=false
    else
        echo -e "${GREEN}✅ Docker Compose $(docker-compose --version | cut -d' ' -f3 | sed 's/,//')${NC}"
        HAS_DOCKER_COMPOSE=true
    fi
}

# 安装项目依赖
install_dependencies() {
    echo -e "\n${BLUE}📦 安装项目依赖...${NC}"
    
    # 安装根目录依赖
    echo "安装根目录依赖..."
    npm install
    
    # 安装前端依赖
    echo "安装前端依赖..."
    cd frontend && npm install && cd ..
    
    # 安装后端依赖
    echo "安装后端依赖..."
    cd backend && npm install && cd ..
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 设置环境变量
setup_environment() {
    echo -e "\n${BLUE}⚙️  设置环境变量...${NC}"
    
    # 设置后端环境变量
    if [ ! -f "backend/.env" ]; then
        echo "创建后端环境变量文件..."
        cp backend/env.example backend/.env
        echo -e "${GREEN}✅ 后端环境变量文件已创建: backend/.env${NC}"
        echo -e "${YELLOW}⚠️  请根据实际情况修改 backend/.env 文件中的配置${NC}"
    else
        echo -e "${GREEN}✅ 后端环境变量文件已存在${NC}"
    fi
    
    # 设置前端环境变量
    if [ ! -f "frontend/.env" ]; then
        echo "创建前端环境变量文件..."
        cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
EOF
        echo -e "${GREEN}✅ 前端环境变量文件已创建: frontend/.env${NC}"
    else
        echo -e "${GREEN}✅ 前端环境变量文件已存在${NC}"
    fi
}

# 设置数据库
setup_database() {
    echo -e "\n${BLUE}🗄️  设置数据库...${NC}"
    
    if [ "$HAS_DOCKER" = true ] && [ "$HAS_DOCKER_COMPOSE" = true ]; then
        echo "使用 Docker 启动数据库服务..."
        
        # 启动数据库服务
        docker-compose up -d postgres redis
        
        echo "等待数据库启动..."
        sleep 10
        
        # 运行数据库迁移
        echo "运行数据库迁移..."
        cd backend
        npm run db:generate
        npm run db:migrate
        
        # 填充初始数据
        echo "填充初始数据..."
        npm run db:seed
        cd ..
        
        echo -e "${GREEN}✅ 数据库设置完成${NC}"
    else
        echo -e "${YELLOW}⚠️  请手动设置 PostgreSQL 和 Redis 数据库${NC}"
        echo "1. 安装 PostgreSQL 15+ 和 Redis 7+"
        echo "2. 创建数据库: createdb financial_db"
        echo "3. 运行: cd backend && npm run db:migrate && npm run db:seed"
    fi
}

# 启动开发服务器
start_development() {
    echo -e "\n${BLUE}🌟 启动开发服务器...${NC}"
    
    echo "请选择启动方式："
    echo "1. 同时启动前后端 (推荐)"
    echo "2. 仅启动后端"
    echo "3. 仅启动前端"
    echo "4. 使用 Docker 启动完整环境"
    echo "5. 退出"
    
    read -p "请输入选择 (1-5): " choice
    
    case $choice in
        1)
            echo -e "${GREEN}🚀 启动前后端开发服务器...${NC}"
            npm run dev
            ;;
        2)
            echo -e "${GREEN}🚀 启动后端开发服务器...${NC}"
            cd backend && npm run dev
            ;;
        3)
            echo -e "${GREEN}🚀 启动前端开发服务器...${NC}"
            cd frontend && npm run dev
            ;;
        4)
            if [ "$HAS_DOCKER" = true ] && [ "$HAS_DOCKER_COMPOSE" = true ]; then
                echo -e "${GREEN}🚀 使用 Docker 启动完整环境...${NC}"
                docker-compose up
            else
                echo -e "${RED}❌ Docker 或 Docker Compose 未安装${NC}"
            fi
            ;;
        5)
            echo -e "${YELLOW}👋 退出安装程序${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 无效选择${NC}"
            start_development
            ;;
    esac
}

# 显示访问信息
show_access_info() {
    echo -e "\n${GREEN}🎉 设置完成！${NC}"
    echo -e "\n${BLUE}📱 访问地址：${NC}"
    echo "• 前端应用: http://localhost:3000"
    echo "• 后端API: http://localhost:8000"
    echo "• API文档: http://localhost:8000/docs"
    echo "• 数据库管理: http://localhost:5050 (pgAdmin)"
    echo ""
    echo -e "${BLUE}👤 默认账号：${NC}"
    echo "• 邮箱: admin@financial.com"
    echo "• 密码: admin123456"
    echo ""
    echo -e "${BLUE}📚 更多信息：${NC}"
    echo "• 快速指南: docs/QUICK_START.md"
    echo "• API文档: docs/api/API_DESIGN.md"
    echo "• 项目文档: README.md"
}

# 主函数
main() {
    echo -e "${BLUE}开始设置项目...${NC}\n"
    
    check_tools
    install_dependencies
    setup_environment
    setup_database
    show_access_info
    
    echo -e "\n${YELLOW}是否现在启动开发服务器？(y/n)${NC}"
    read -p "" start_now
    
    if [ "$start_now" = "y" ] || [ "$start_now" = "Y" ]; then
        start_development
    else
        echo -e "${GREEN}🎯 稍后可以运行 'npm run dev' 启动开发服务器${NC}"
    fi
}

# 执行主函数
main 