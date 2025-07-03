#!/bin/bash

# =============================================================================
# 🚀 财务管理系统 Docker 登录修复解决方案 v1.0
# =============================================================================

set -e  # 遇到错误立即退出

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
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${PURPLE}$1${NC}"
}

# 获取当前时间
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# 检查Docker是否运行
check_docker() {
    log_info "检查Docker状态..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker Desktop"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_warning "Docker daemon 未运行，正在启动..."
        open -a Docker
        log_info "等待Docker启动..."
        
        # 等待Docker启动 (最多等待60秒)
        for i in {1..12}; do
            if docker info &> /dev/null; then
                log_success "Docker 已启动"
                break
            fi
            echo -n "."
            sleep 5
        done
        
        if ! docker info &> /dev/null; then
            log_error "Docker 启动失败，请手动启动 Docker Desktop"
            exit 1
        fi
    else
        log_success "Docker 运行正常"
    fi
}

# 清理旧容器和网络
cleanup_docker() {
    log_info "清理旧的Docker资源..."
    
    # 停止并删除所有相关容器
    docker stop financial-frontend financial-backend financial-postgres financial-redis financial-pgadmin 2>/dev/null || true
    docker rm financial-frontend financial-backend financial-postgres financial-redis financial-pgadmin 2>/dev/null || true
    
    # 删除悬空镜像
    docker image prune -f 2>/dev/null || true
    
    # 清理网络
    docker network rm financial-network 2>/dev/null || true
    
    log_success "Docker资源清理完成"
}

# 创建优化的Docker配置
create_optimized_config() {
    log_info "创建优化的Docker配置..."
    
    cat > docker-compose-login-fix.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL 数据库 - 简化配置用于测试
  postgres:
    image: postgres:15-alpine
    container_name: financial-postgres
    environment:
      - POSTGRES_DB=financial_db
      - POSTGRES_USER=financial_user
      - POSTGRES_PASSWORD=financial_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - financial-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U financial_user -d financial_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 后端服务 - 优化启动配置
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: financial-backend
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://financial_user:financial_password@postgres:5432/financial_db
      - JWT_SECRET=financial-system-jwt-secret-key
      - PORT=8000
      - CORS_ORIGIN=http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - financial-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # 前端服务 - 优化配置
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: financial-frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:8000
      - VITE_API_VERSION=v1
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - financial-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

volumes:
  postgres_data:

networks:
  financial-network:
    driver: bridge
EOF

    log_success "优化配置文件已创建: docker-compose-login-fix.yml"
}

# 构建并启动服务
build_and_start() {
    log_info "构建并启动优化后的Docker服务..."
    
    # 构建镜像
    log_info "构建Docker镜像..."
    docker-compose -f docker-compose-login-fix.yml build --no-cache
    
    # 启动服务
    log_info "启动Docker服务..."
    docker-compose -f docker-compose-login-fix.yml up -d
    
    log_success "Docker服务已启动"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "检查服务状态 (${attempt}/${max_attempts})..."
        
        # 检查后端健康状态
        if curl -f http://localhost:8000/health &>/dev/null; then
            log_success "后端服务已就绪"
            backend_ready=true
        else
            backend_ready=false
        fi
        
        # 检查前端健康状态
        if curl -f http://localhost:3000 &>/dev/null; then
            log_success "前端服务已就绪"
            frontend_ready=true
        else
            frontend_ready=false
        fi
        
        if [ "$backend_ready" = true ] && [ "$frontend_ready" = true ]; then
            log_success "所有服务已就绪！"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_warning "服务启动超时，检查容器状态..."
    docker-compose -f docker-compose-login-fix.yml ps
    return 1
}

# 创建测试用户
create_test_user() {
    log_info "创建测试用户..."
    
    # 等待后端完全启动
    sleep 5
    
    # 创建演示用户
    curl -X POST http://localhost:8000/api/v1/auth/register \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@financial.com",
            "password": "admin123456",
            "username": "admin",
            "firstName": "系统",
            "lastName": "管理员"
        }' \
        --silent --show-error || log_warning "用户可能已存在"
    
    log_success "测试用户已创建 (如果不存在的话)"
}

# 测试登录功能
test_login() {
    log_info "测试登录功能..."
    
    local login_response=$(curl -X POST http://localhost:8000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@financial.com",
            "password": "admin123456"
        }' \
        --silent 2>/dev/null)
    
    if echo "$login_response" | grep -q "token\|success"; then
        log_success "登录功能测试通过！"
        echo "登录响应: $login_response"
        return 0
    else
        log_warning "登录功能需要进一步检查"
        echo "登录响应: $login_response"
        return 1
    fi
}

# 显示服务状态
show_status() {
    log_header "📊 服务状态报告"
    echo ""
    
    log_info "Docker容器状态:"
    docker-compose -f docker-compose-login-fix.yml ps
    echo ""
    
    log_info "服务URL:"
    echo "🌐 前端界面: http://localhost:3000"
    echo "⚡ 后端API: http://localhost:8000"
    echo "🗄️ API文档: http://localhost:8000/api/docs"
    echo ""
    
    log_info "测试账户:"
    echo "📧 邮箱: admin@financial.com"
    echo "🔐 密码: admin123456"
    echo ""
    
    log_info "Docker日志查看:"
    echo "docker-compose -f docker-compose-login-fix.yml logs -f frontend"
    echo "docker-compose -f docker-compose-login-fix.yml logs -f backend"
}

# 主函数
main() {
    local start_time=$(date +%s)
    
    log_header "
╔══════════════════════════════════════════════════════════════╗
║          🚀 财务管理系统 Docker 登录修复方案 v1.0            ║
║                 Docker Login Fix Solution                    ║
╚══════════════════════════════════════════════════════════════╝"
    
    log_info "开始时间: $(get_timestamp)"
    echo ""
    
    # 执行修复步骤
    check_docker
    cleanup_docker
    create_optimized_config
    build_and_start
    
    if wait_for_services; then
        create_test_user
        if test_login; then
            show_status
            
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            
            log_success "✨ Docker 登录修复完成！耗时: ${duration}秒"
        else
            log_warning "服务已启动，但登录功能需要手动验证"
            show_status
        fi
    else
        log_error "服务启动失败，请检查日志"
        docker-compose -f docker-compose-login-fix.yml logs --tail=50
        exit 1
    fi
}

# 运行主函数
main "$@" 