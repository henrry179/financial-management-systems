#!/bin/bash

# Docker清理脚本 - 清理未使用的镜像、容器和卷
# 作者: Financial Management System Team
# 版本: v1.0
# 最后更新: 2025-09-05 10:49:44

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
    echo -e "${PURPLE}[CLEANUP]${NC} $1"
}

# 显示当前Docker使用情况
show_current_usage() {
    log_header "📊 当前Docker磁盘使用情况"
    docker system df
    echo
}

# 安全确认
confirm_cleanup() {
    echo -e "${YELLOW}⚠️  清理操作可能会删除以下内容:${NC}"
    echo "   - 未使用的镜像"
    echo "   - 停止的容器"
    echo "   - 未使用的网络"
    echo "   - 悬挂的卷（可选）"
    echo "   - 构建缓存"
    echo
    
    read -p "您确定要继续吗? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "清理操作已取消"
        exit 0
    fi
}

# 清理停止的容器
cleanup_containers() {
    log_header "🗑️  清理停止的容器"
    
    local stopped_containers=$(docker ps -aq --filter "status=exited")
    
    if [[ -n "$stopped_containers" ]]; then
        log_info "发现 $(echo "$stopped_containers" | wc -l) 个停止的容器"
        
        if docker container prune -f; then
            log_success "已清理停止的容器"
        else
            log_error "清理停止的容器失败"
        fi
    else
        log_info "没有发现停止的容器"
    fi
    echo
}

# 清理悬挂的镜像
cleanup_dangling_images() {
    log_header "🗑️  清理悬挂的镜像"
    
    local dangling_images=$(docker images -f "dangling=true" -q)
    
    if [[ -n "$dangling_images" ]]; then
        log_info "发现 $(echo "$dangling_images" | wc -l) 个悬挂的镜像"
        
        if docker image prune -f; then
            log_success "已清理悬挂的镜像"
        else
            log_error "清理悬挂的镜像失败"
        fi
    else
        log_info "没有发现悬挂的镜像"
    fi
    echo
}

# 清理未使用的镜像
cleanup_unused_images() {
    log_header "🗑️  清理未使用的镜像"
    
    log_info "清理所有未被容器使用的镜像..."
    
    if docker image prune -a -f; then
        log_success "已清理未使用的镜像"
    else
        log_error "清理未使用的镜像失败"
    fi
    echo
}

# 清理未使用的网络
cleanup_networks() {
    log_header "🗑️  清理未使用的网络"
    
    local unused_networks=$(docker network ls --filter "dangling=true" -q)
    
    if [[ -n "$unused_networks" ]]; then
        log_info "发现 $(echo "$unused_networks" | wc -l) 个未使用的网络"
        
        if docker network prune -f; then
            log_success "已清理未使用的网络"
        else
            log_error "清理未使用的网络失败"
        fi
    else
        log_info "没有发现未使用的网络"
    fi
    echo
}

# 清理构建缓存
cleanup_build_cache() {
    log_header "🗑️  清理构建缓存"
    
    if docker builder prune -f; then
        log_success "已清理构建缓存"
    else
        log_warning "清理构建缓存失败（可能是Docker版本不支持）"
    fi
    echo
}

# 清理未使用的卷（可选）
cleanup_volumes() {
    log_header "🗑️  清理未使用的卷"
    
    echo -e "${YELLOW}⚠️  警告: 清理卷可能会删除重要数据！${NC}"
    read -p "您确定要清理未使用的卷吗? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        local unused_volumes=$(docker volume ls -f "dangling=true" -q)
        
        if [[ -n "$unused_volumes" ]]; then
            log_info "发现 $(echo "$unused_volumes" | wc -l) 个未使用的卷"
            
            if docker volume prune -f; then
                log_success "已清理未使用的卷"
            else
                log_error "清理未使用的卷失败"
            fi
        else
            log_info "没有发现未使用的卷"
        fi
    else
        log_info "跳过卷清理"
    fi
    echo
}

# 清理系统缓存
cleanup_system_cache() {
    log_header "🗑️  清理系统缓存"
    
    if docker system prune -f; then
        log_success "已清理系统缓存"
    else
        log_error "清理系统缓存失败"
    fi
    echo
}

# 高级清理（慎用）
advanced_cleanup() {
    echo -e "${RED}⚠️  高级清理模式 - 这将删除所有未使用的Docker资源！${NC}"
    echo "包括:"
    echo "   - 所有停止的容器"
    echo "   - 所有未被容器使用的镜像"
    echo "   - 所有未使用的网络"
    echo "   - 所有未使用的卷"
    echo "   - 所有构建缓存"
    echo
    
    read -p "您确定要执行高级清理吗? 这是不可逆的操作! (yes/NO): " confirmation
    
    if [[ "$confirmation" == "yes" ]]; then
        log_warning "执行高级清理..."
        
        if docker system prune -a -f --volumes; then
            log_success "高级清理完成"
        else
            log_error "高级清理失败"
        fi
    else
        log_info "高级清理已取消"
    fi
    echo
}

# 显示清理后的使用情况
show_cleanup_result() {
    log_header "📊 清理后Docker磁盘使用情况"
    docker system df
    echo
    
    log_header "📈 清理统计"
    echo "当前镜像数量: $(docker images | wc -l)"
    echo "运行中容器: $(docker ps | wc -l)"
    echo "所有容器: $(docker ps -a | wc -l)"
    echo "网络数量: $(docker network ls | wc -l)"
    echo "卷数量: $(docker volume ls | wc -l)"
    echo
}

# 生成清理报告
generate_cleanup_report() {
    local report_file="docker-cleanup-report.txt"
    
    cat > "$report_file" <<EOF
Docker清理报告
==============
清理时间: $(date '+%Y-%m-%d %H:%M:%S')
清理脚本版本: v1.0

清理前状态:
-----------
$(cat /tmp/docker_usage_before.txt 2>/dev/null || echo "未记录")

清理后状态:
-----------
$(docker system df)

当前状态:
---------
镜像数量: $(docker images | wc -l)
容器数量: $(docker ps -a | wc -l)
网络数量: $(docker network ls | wc -l)
卷数量: $(docker volume ls | wc -l)

建议:
-----
1. 定期执行清理操作 (建议每周一次)
2. 监控Docker磁盘使用情况
3. 重要数据务必备份
4. 使用 docker system df 查看使用情况

下次清理建议时间: $(date -d '+7 days' '+%Y-%m-%d')

EOF
    
    log_success "清理报告已生成: $report_file"
}

# 显示使用建议
show_maintenance_tips() {
    log_header "💡 Docker维护建议"
    
    echo "定期维护:"
    echo "  每周执行: ./scripts/cleanup.sh"
    echo "  每月执行: docker system prune -a -f"
    echo "  监控使用: docker system df"
    echo
    
    echo "安全清理:"
    echo "  仅清理悬挂镜像: docker image prune -f"
    echo "  仅清理停止容器: docker container prune -f"
    echo "  仅清理未使用网络: docker network prune -f"
    echo
    
    echo "数据保护:"
    echo "  备份重要卷: docker run --rm -v 卷名:/data alpine tar czf - /data > backup.tar.gz"
    echo "  恢复卷数据: docker run --rm -v 卷名:/data alpine tar xzf - -C /data < backup.tar.gz"
    echo
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "  🧹 Docker清理脚本 v1.0"
    echo "========================================"
    echo -e "${NC}"
    
    # 记录清理前状态
    docker system df > /tmp/docker_usage_before.txt 2>/dev/null || true
    
    show_current_usage
    
    # 检查是否有高级清理参数
    if [[ "$1" == "--advanced" ]]; then
        advanced_cleanup
        show_cleanup_result
        generate_cleanup_report
        return
    fi
    
    # 普通清理流程
    confirm_cleanup
    
    cleanup_containers
    cleanup_dangling_images
    cleanup_networks
    cleanup_build_cache
    cleanup_system_cache
    
    # 可选的镜像和卷清理
    if [[ "$1" == "--all-images" ]]; then
        cleanup_unused_images
    fi
    
    if [[ "$1" == "--volumes" ]]; then
        cleanup_volumes
    fi
    
    show_cleanup_result
    generate_cleanup_report
    show_maintenance_tips
    
    echo -e "${GREEN}"
    echo "========================================"
    echo "  ✅ Docker清理完成！"
    echo "========================================"
    echo -e "${NC}"
    
    log_info "使用方式:"
    echo "  普通清理: ./scripts/cleanup.sh"
    echo "  包含镜像: ./scripts/cleanup.sh --all-images"
    echo "  包含卷: ./scripts/cleanup.sh --volumes"
    echo "  高级清理: ./scripts/cleanup.sh --advanced (慎用!)"
}

# 信号处理
trap 'echo -e "\n${YELLOW}清理操作被中断${NC}"; exit 1' INT TERM

# 运行主函数
main "$@" 