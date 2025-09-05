#!/bin/bash

# Docker服务健康检查脚本
# 作者: Financial Management System Team
# 版本: v1.0
# 最后更新: 2025-09-05 11:37:47

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

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
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

# 检查Docker状态
check_docker_status() {
    log_header "🐳 检查Docker环境状态"
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行"
        return 1
    fi
    
    log_success "Docker环境正常"
    
    # 显示Docker版本信息
    log_info "Docker版本: $(docker --version)"
    log_info "Docker Compose版本: $(docker-compose --version 2>/dev/null || echo 'Not installed')"
}

# 检查容器状态
check_containers() {
    log_header "📦 检查容器运行状态"
    
    local containers=(
        "financial-postgres:PostgreSQL数据库"
        "financial-redis:Redis缓存"
        "financial-backend:后端服务"
        "financial-frontend:前端服务"
        "financial-nginx:Nginx代理"
    )
    
    local running_count=0
    local total_count=${#containers[@]}
    
    for container_info in "${containers[@]}"; do
        IFS=':' read -r container_name description <<< "$container_info"
        
        if docker ps --format "{{.Names}}" | grep -q "^$container_name$"; then
            local status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
            
            if [[ "$status" == "running" ]]; then
                if [[ "$health" == "healthy" || "$health" == "none" ]]; then
                    log_success "✓ $container_name ($description) - 运行中"
                    running_count=$((running_count + 1))
                else
                    log_warning "⚠ $container_name ($description) - 运行中但健康检查失败 ($health)"
                fi
            else
                log_error "✗ $container_name ($description) - 状态: $status"
            fi
        else
            log_warning "⚠ $container_name ($description) - 未运行"
        fi
    done
    
    echo
    log_info "容器状态统计: $running_count/$total_count 正在运行"
    
    if [[ $running_count -eq $total_count ]]; then
        log_success "所有容器运行正常"
        return 0
    else
        log_warning "部分容器未正常运行"
        return 1
    fi
}

# 检查网络连接
check_network_connectivity() {
    log_header "🌐 检查网络连接"
    
    local endpoints=(
        "http://localhost:3000:前端服务"
        "http://localhost:8000:后端API"
        "http://localhost:8000/health:健康检查"
        "postgres://localhost:5432:PostgreSQL"
        "redis://localhost:6379:Redis"
    )
    
    local success_count=0
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r endpoint description <<< "$endpoint_info"
        
        case "$endpoint" in
            http://*)
                if curl -f -s --max-time 10 "$endpoint" > /dev/null 2>&1; then
                    log_success "✓ $description ($endpoint)"
                    success_count=$((success_count + 1))
                else
                    log_error "✗ $description ($endpoint) - 连接失败"
                fi
                ;;
            postgres://*)
                if timeout 5 bash -c "</dev/tcp/localhost/5432" 2>/dev/null; then
                    log_success "✓ $description (端口可达)"
                    success_count=$((success_count + 1))
                else
                    log_error "✗ $description - 端口不可达"
                fi
                ;;
            redis://*)
                if timeout 5 bash -c "</dev/tcp/localhost/6379" 2>/dev/null; then
                    log_success "✓ $description (端口可达)"
                    success_count=$((success_count + 1))
                else
                    log_error "✗ $description - 端口不可达"
                fi
                ;;
        esac
    done
    
    echo
    log_info "网络连接统计: $success_count/${#endpoints[@]} 可访问"
}

# 检查资源使用情况
check_resource_usage() {
    log_header "📊 检查资源使用情况"
    
    # Docker系统信息
    log_info "Docker系统资源使用:"
    docker system df --format "table {{.Type}}\t{{.Total}}\t{{.Active}}\t{{.Size}}\t{{.Reclaimable}}"
    
    echo
    
    # 容器资源使用
    log_info "容器资源使用:"
    if docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" 2>/dev/null | head -10; then
        true
    else
        log_warning "无法获取容器资源使用情况"
    fi
}

# 检查数据持久化
check_data_persistence() {
    log_header "💾 检查数据持久化"
    
    local volumes=(
        "financial_postgres_data:PostgreSQL数据"
        "financial_redis_data:Redis数据"
    )
    
    for volume_info in "${volumes[@]}"; do
        IFS=':' read -r volume_name description <<< "$volume_info"
        
        if docker volume ls --format "{{.Name}}" | grep -q "^$volume_name$"; then
            local size=$(docker system df -v | grep "$volume_name" | awk '{print $3}' 2>/dev/null || echo "未知")
            log_success "✓ $description ($volume_name) - 大小: $size"
        else
            log_error "✗ $description ($volume_name) - 卷不存在"
        fi
    done
}

# 检查日志状态
check_logs() {
    log_header "📝 检查日志状态"
    
    local containers=(
        "financial-backend"
        "financial-frontend"
        "financial-postgres"
        "financial-redis"
    )
    
    for container in "${containers[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^$container$"; then
            local log_count=$(docker logs "$container" 2>&1 | wc -l)
            local error_count=$(docker logs "$container" 2>&1 | grep -i error | wc -l)
            
            if [[ $error_count -eq 0 ]]; then
                log_success "✓ $container - 日志行数: $log_count, 错误: $error_count"
            else
                log_warning "⚠ $container - 日志行数: $log_count, 错误: $error_count"
            fi
        else
            log_warning "⚠ $container - 容器未运行，无法检查日志"
        fi
    done
}

# 运行诊断命令
run_diagnostics() {
    log_header "🔍 运行系统诊断"
    
    # 检查端口占用
    log_info "检查关键端口占用:"
    for port in 3000 8000 5432 6379; do
        if netstat -tuln 2>/dev/null | grep ":$port " > /dev/null; then
            log_success "✓ 端口 $port 被占用 (正常)"
        else
            log_warning "⚠ 端口 $port 未被占用"
        fi
    done
    
    echo
    
    # 检查Docker网络
    log_info "检查Docker网络:"
    docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
    
    echo
    
    # 检查Docker镜像
    log_info "检查本地镜像 (最近10个):"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}" | head -11
}

# 生成健康报告
generate_health_report() {
    local report_file="docker-health-report.txt"
    
    cat > "$report_file" <<EOF
Docker健康检查报告
==================
检查时间: $(date '+%Y-%m-%d %H:%M:%S')
检查脚本版本: v1.0

系统信息:
---------
操作系统: $(uname -s)
Docker版本: $(docker --version)
Docker Compose版本: $(docker-compose --version 2>/dev/null || echo 'Not installed')

容器状态:
---------
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")

网络状态:
---------
$(docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}")

卷状态:
-------
$(docker volume ls --format "table {{.Name}}\t{{.Driver}}")

资源使用:
---------
$(docker system df)

建议:
-----
1. 定期运行此健康检查脚本
2. 监控容器日志中的错误信息
3. 定期清理未使用的镜像和容器
4. 备份重要的数据卷

EOF
    
    log_success "健康报告已生成: $report_file"
}

# 显示修复建议
show_fix_suggestions() {
    echo
    log_header "🛠 常见问题修复建议"
    
    echo "1. 容器启动失败:"
    echo "   - 检查端口是否被占用: netstat -tuln | grep :端口号"
    echo "   - 查看容器日志: docker-compose logs 服务名"
    echo "   - 重启服务: docker-compose restart 服务名"
    echo
    
    echo "2. 网络连接问题:"
    echo "   - 检查防火墙设置"
    echo "   - 验证Docker网络配置: docker network inspect network-name"
    echo "   - 重建网络: docker network rm network-name && docker network create network-name"
    echo
    
    echo "3. 镜像拉取问题:"
    echo "   - 运行镜像拉取脚本: ./scripts/pull-images.sh"
    echo "   - 配置镜像加速器: ./scripts/setup-docker.sh"
    echo "   - 手动拉取问题镜像: docker pull 镜像名"
    echo
    
    echo "4. 数据持久化问题:"
    echo "   - 检查卷权限: ls -la /var/lib/docker/volumes/"
    echo "   - 备份数据: docker-compose exec postgres pg_dump ..."
    echo "   - 重建卷: docker-compose down -v && docker-compose up -d"
    echo
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "  🏥 Docker服务健康检查 v1.0"
    echo "========================================"
    echo -e "${NC}"
    
    local exit_code=0
    
    # 执行所有检查
    check_docker_status || exit_code=1
    echo
    
    check_containers || exit_code=1
    echo
    
    check_network_connectivity || exit_code=1
    echo
    
    check_resource_usage
    echo
    
    check_data_persistence
    echo
    
    check_logs
    echo
    
    run_diagnostics
    echo
    
    generate_health_report
    
    # 显示最终结果
    if [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}"
        echo "========================================"
        echo "  ✅ 所有检查通过！系统运行正常"
        echo "========================================"
        echo -e "${NC}"
    else
        echo -e "${YELLOW}"
        echo "========================================"
        echo "  ⚠️  发现问题，请查看上方详情"
        echo "========================================"
        echo -e "${NC}"
        show_fix_suggestions
    fi
    
    return $exit_code
}

# 运行主函数
main "$@" 