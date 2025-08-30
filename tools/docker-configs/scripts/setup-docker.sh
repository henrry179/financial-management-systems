#!/bin/bash

# Docker环境设置脚本 - 彻底解决镜像拉取问题
# 作者: Financial Management System Team
# 版本: v1.0
# 最后更新: 2025-01-20 15:45:00

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "检测到root用户，某些操作可能需要调整权限"
    fi
}

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        log_info "检测到macOS系统"
    elif [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        log_info "检测到Linux系统: $PRETTY_NAME"
    else
        log_error "无法检测操作系统类型"
        exit 1
    fi
}

# 检查Docker安装状态
check_docker() {
    log_info "检查Docker安装状态..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        log_info "安装指南: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_warning "docker-compose未安装，尝试安装..."
        install_docker_compose
    fi
    
    # 检查Docker服务状态
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行，请启动Docker服务"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 安装docker-compose
install_docker_compose() {
    log_info "安装docker-compose..."
    
    if [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install docker-compose
        else
            log_error "请手动安装docker-compose或安装Homebrew"
            exit 1
        fi
    else
        # Linux系统
        DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')
        sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    log_success "docker-compose安装完成"
}

# 配置Docker镜像加速器
configure_docker_mirrors() {
    log_info "配置Docker镜像加速器..."
    
    if [[ "$OS" == "macos" ]]; then
        DOCKER_CONFIG_DIR="$HOME/.docker"
        DAEMON_JSON="$DOCKER_CONFIG_DIR/daemon.json"
    else
        DOCKER_CONFIG_DIR="/etc/docker"
        DAEMON_JSON="$DOCKER_CONFIG_DIR/daemon.json"
    fi
    
    # 创建配置目录
    if [[ ! -d "$DOCKER_CONFIG_DIR" ]]; then
        if [[ "$OS" == "macos" ]]; then
            mkdir -p "$DOCKER_CONFIG_DIR"
        else
            sudo mkdir -p "$DOCKER_CONFIG_DIR"
        fi
    fi
    
    # 备份现有配置
    if [[ -f "$DAEMON_JSON" ]]; then
        BACKUP_FILE="${DAEMON_JSON}.backup.$(date +%Y%m%d_%H%M%S)"
        if [[ "$OS" == "macos" ]]; then
            cp "$DAEMON_JSON" "$BACKUP_FILE"
        else
            sudo cp "$DAEMON_JSON" "$BACKUP_FILE"
        fi
        log_info "已备份现有配置到: $BACKUP_FILE"
    fi
    
    # 创建新的daemon.json配置
    cat > /tmp/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://dockerproxy.com",
    "https://registry.cn-hangzhou.aliyuncs.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "default-ulimits": {
    "nofile": {
      "name": "nofile",
      "hard": 65536,
      "soft": 1024
    }
  },
  "dns": ["8.8.8.8", "8.8.4.4"],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5
}
EOF
    
    # 移动配置文件到正确位置
    if [[ "$OS" == "macos" ]]; then
        mv /tmp/daemon.json "$DAEMON_JSON"
    else
        sudo mv /tmp/daemon.json "$DAEMON_JSON"
        sudo chown root:root "$DAEMON_JSON"
        sudo chmod 644 "$DAEMON_JSON"
    fi
    
    log_success "Docker镜像加速器配置完成"
}

# 重启Docker服务
restart_docker() {
    log_info "重启Docker服务..."
    
    if [[ "$OS" == "macos" ]]; then
        # macOS - 通过Docker Desktop API重启
        osascript -e 'quit app "Docker"' 2>/dev/null || true
        sleep 5
        open -a Docker
        log_info "Docker Desktop正在重启，请等待..."
        
        # 等待Docker服务启动
        local retry_count=0
        while ! docker info &> /dev/null && [ $retry_count -lt 30 ]; do
            sleep 2
            retry_count=$((retry_count + 1))
            echo -n "."
        done
        echo
        
        if docker info &> /dev/null; then
            log_success "Docker Desktop重启成功"
        else
            log_error "Docker Desktop重启失败，请手动重启"
            exit 1
        fi
    else
        # Linux系统
        sudo systemctl daemon-reload
        sudo systemctl restart docker
        sudo systemctl enable docker
        
        # 等待Docker服务启动
        sleep 5
        if docker info &> /dev/null; then
            log_success "Docker服务重启成功"
        else
            log_error "Docker服务重启失败"
            exit 1
        fi
    fi
}

# 验证镜像加速器
verify_mirrors() {
    log_info "验证镜像加速器配置..."
    
    # 显示当前配置
    if docker info | grep -A 20 "Registry Mirrors" &> /dev/null; then
        log_success "镜像加速器配置生效:"
        docker info | grep -A 10 "Registry Mirrors"
    else
        log_warning "无法确认镜像加速器状态，但配置已完成"
    fi
    
    # 测试拉取小镜像
    log_info "测试镜像拉取功能..."
    if docker pull hello-world:latest &> /dev/null; then
        log_success "镜像拉取测试成功"
        docker rmi hello-world:latest &> /dev/null || true
    else
        log_warning "镜像拉取测试失败，但镜像加速器已配置"
    fi
}

# 创建Docker网络
create_docker_networks() {
    log_info "创建Docker网络..."
    
    # 创建生产环境网络
    if ! docker network ls | grep -q "financial-network"; then
        docker network create financial-network --driver bridge --subnet=172.20.0.0/16
        log_success "已创建生产环境网络: financial-network"
    fi
    
    # 创建开发环境网络
    if ! docker network ls | grep -q "financial-dev-network"; then
        docker network create financial-dev-network --driver bridge --subnet=172.21.0.0/16
        log_success "已创建开发环境网络: financial-dev-network"
    fi
}

# 预热镜像缓存
preheat_images() {
    log_info "预热Docker镜像缓存..."
    
    # 定义需要预热的镜像列表
    local images=(
        "registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine"
        "registry.cn-hangzhou.aliyuncs.com/google_containers/postgres:13-alpine"
        "registry.cn-hangzhou.aliyuncs.com/google_containers/redis:6-alpine"
        "registry.cn-hangzhou.aliyuncs.com/google_containers/nginx:alpine"
    )
    
    for image in "${images[@]}"; do
        log_info "拉取镜像: $image"
        if docker pull "$image"; then
            log_success "✓ $image"
            
            # 重新标记为官方镜像名
            official_name=$(echo "$image" | sed 's|registry.cn-hangzhou.aliyuncs.com/google_containers/||')
            docker tag "$image" "$official_name"
            log_info "已标记为: $official_name"
        else
            log_warning "✗ $image 拉取失败"
        fi
    done
}

# 清理Docker系统
cleanup_docker() {
    log_info "清理Docker系统..."
    
    # 清理悬挂的镜像
    docker image prune -f &> /dev/null || true
    
    # 清理未使用的容器
    docker container prune -f &> /dev/null || true
    
    # 清理未使用的网络
    docker network prune -f &> /dev/null || true
    
    # 清理未使用的卷
    docker volume prune -f &> /dev/null || true
    
    log_success "Docker系统清理完成"
}

# 生成使用报告
generate_report() {
    log_info "生成Docker环境报告..."
    
    cat > docker-setup-report.txt <<EOF
Docker环境设置报告
==================
设置时间: $(date '+%Y-%m-%d %H:%M:%S')
操作系统: $OS
Docker版本: $(docker --version)
Docker Compose版本: $(docker-compose --version)

镜像加速器配置:
- 中科大: https://docker.mirrors.ustc.edu.cn
- 网易: https://hub-mirror.c.163.com
- 百度: https://mirror.baidubce.com
- Docker代理: https://dockerproxy.com
- 阿里云: https://registry.cn-hangzhou.aliyuncs.com

Docker网络:
$(docker network ls)

可用镜像:
$(docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}")

使用建议:
1. 运行 ./scripts/pull-images.sh 预拉取项目镜像
2. 使用 docker-compose -f docker-compose.dev.yml up -d 启动开发环境
3. 使用 docker-compose -f docker-compose.yml up -d 启动生产环境
4. 定期运行 docker system prune 清理系统

EOF
    
    log_success "环境报告已生成: docker-setup-report.txt"
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "======================================"
    echo "  Docker环境设置脚本 v1.0"
    echo "  彻底解决Docker镜像拉取问题"
    echo "======================================"
    echo -e "${NC}"
    
    check_root
    detect_os
    check_docker
    configure_docker_mirrors
    restart_docker
    verify_mirrors
    create_docker_networks
    preheat_images
    cleanup_docker
    generate_report
    
    echo -e "${GREEN}"
    echo "======================================"
    echo "  🎉 Docker环境设置完成！"
    echo "======================================"
    echo -e "${NC}"
    
    echo "下一步操作："
    echo "1. 运行: chmod +x scripts/pull-images.sh && ./scripts/pull-images.sh"
    echo "2. 启动开发环境: docker-compose -f docker-compose.dev.yml up -d"
    echo "3. 查看服务状态: docker-compose ps"
    echo "4. 查看日志: docker-compose logs -f"
    echo ""
    echo "如遇问题，请查看 troubleshooting/ 目录下的解决方案"
}

# 运行主函数
main "$@" 