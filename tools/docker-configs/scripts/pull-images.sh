#!/bin/bash

# Docker镜像拉取脚本 - 预拉取所有项目镜像
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

log_progress() {
    echo -e "${PURPLE}[PROGRESS]${NC} $1"
}

# 镜像源配置
MIRRORS=(
    "registry.cn-hangzhou.aliyuncs.com/google_containers"
    "registry.cn-shenzhen.aliyuncs.com/google_containers"
    "ccr.ccs.tencentyun.com/library"
    "hub.docker.com"
)

# 镜像列表配置
declare -A IMAGES=(
    # 基础运行时镜像
    ["node:18-alpine"]="Node.js运行时"
    ["postgres:13-alpine"]="PostgreSQL数据库"
    ["redis:6-alpine"]="Redis缓存"
    ["nginx:alpine"]="Nginx Web服务器"
    
    # 开发工具镜像
    ["pgadmin4:latest"]="PostgreSQL管理工具"
    ["maildev:latest"]="邮件测试工具"
    
    # 监控相关镜像
    ["prom/prometheus:latest"]="Prometheus监控"
    ["grafana/grafana:latest"]="Grafana仪表板"
    
    # 辅助工具镜像
    ["alpine:latest"]="Alpine Linux基础镜像"
    ["busybox:latest"]="BusyBox工具集"
    ["hello-world:latest"]="测试镜像"
)

# 统计变量
TOTAL_IMAGES=${#IMAGES[@]}
SUCCESS_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

# 检查Docker状态
check_docker() {
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行，请先启动Docker"
        exit 1
    fi
    log_success "Docker服务状态正常"
}

# 检查镜像是否已存在
image_exists() {
    local image=$1
    docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$image$"
}

# 从指定镜像源拉取镜像
pull_from_mirror() {
    local mirror=$1
    local image=$2
    local description=$3
    
    local full_image
    if [[ "$mirror" == "hub.docker.com" ]]; then
        full_image="$image"
    else
        full_image="$mirror/$image"
    fi
    
    log_progress "从 $mirror 拉取 $image ($description)"
    
    if timeout 300 docker pull "$full_image"; then
        # 如果不是官方镜像，重新标记
        if [[ "$mirror" != "hub.docker.com" ]]; then
            docker tag "$full_image" "$image"
            log_info "已标记为官方名称: $image"
        fi
        return 0
    else
        return 1
    fi
}

# 拉取单个镜像
pull_image() {
    local image=$1
    local description=$2
    
    echo
    log_info "正在拉取: $image ($description)"
    log_info "进度: $((SUCCESS_COUNT + FAILED_COUNT + SKIPPED_COUNT + 1))/$TOTAL_IMAGES"
    
    # 检查镜像是否已存在
    if image_exists "$image"; then
        log_warning "镜像 $image 已存在，跳过"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        return
    fi
    
    # 尝试从多个镜像源拉取
    local pulled=false
    for mirror in "${MIRRORS[@]}"; do
        if pull_from_mirror "$mirror" "$image" "$description"; then
            log_success "✓ $image 拉取成功 (来源: $mirror)"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            pulled=true
            break
        else
            log_warning "✗ 从 $mirror 拉取失败，尝试下一个镜像源..."
        fi
    done
    
    if [[ "$pulled" == false ]]; then
        log_error "✗ $image 从所有镜像源拉取失败"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
}

# 验证镜像完整性
verify_images() {
    log_info "验证已拉取的镜像..."
    
    for image in "${!IMAGES[@]}"; do
        if image_exists "$image"; then
            # 检查镜像是否可以创建容器
            if docker run --rm "$image" echo "test" &> /dev/null; then
                log_success "✓ $image 验证通过"
            else
                log_warning "⚠ $image 可能存在问题"
            fi
        fi
    done
}

# 清理重复镜像
cleanup_duplicate_images() {
    log_info "清理重复镜像..."
    
    # 清理悬挂镜像
    if docker images -f "dangling=true" -q | head -1 | grep -q .; then
        docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || true
        log_success "已清理悬挂镜像"
    fi
    
    # 清理未使用的镜像标签
    docker image prune -f &> /dev/null || true
    log_success "已清理未使用的镜像"
}

# 生成镜像报告
generate_image_report() {
    local report_file="docker-images-report.txt"
    
    cat > "$report_file" <<EOF
Docker镜像拉取报告
==================
拉取时间: $(date '+%Y-%m-%d %H:%M:%S')
总镜像数: $TOTAL_IMAGES
成功拉取: $SUCCESS_COUNT
拉取失败: $FAILED_COUNT
跳过镜像: $SKIPPED_COUNT

镜像详情:
EOF
    
    echo "镜像名称 | 镜像ID | 大小 | 创建时间" >> "$report_file"
    echo "---------|--------|------|----------" >> "$report_file"
    
    for image in "${!IMAGES[@]}"; do
        if image_exists "$image"; then
            docker images --format "$image | {{.ID}} | {{.Size}} | {{.CreatedSince}}" | grep "^$image" >> "$report_file" || true
        else
            echo "$image | - | - | 拉取失败" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" <<EOF

磁盘使用情况:
$(docker system df)

建议:
1. 定期运行 docker system prune 清理未使用的镜像
2. 使用 docker images 查看本地镜像列表
3. 使用 docker rmi <image> 删除不需要的镜像

EOF
    
    log_success "镜像报告已生成: $report_file"
}

# 显示使用建议
show_usage_tips() {
    echo
    echo -e "${GREEN}======================================"
    echo "  🚀 镜像拉取完成！使用建议："
    echo "======================================${NC}"
    echo
    echo "启动服务："
    echo "  开发环境: docker-compose -f docker-compose.dev.yml up -d"
    echo "  生产环境: docker-compose -f docker-compose.yml up -d"
    echo "  本地测试: docker-compose -f docker-compose.local.yml up -d"
    echo
    echo "管理命令："
    echo "  查看状态: docker-compose ps"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo
    echo "维护命令："
    echo "  清理系统: docker system prune -f"
    echo "  查看镜像: docker images"
    echo "  查看容器: docker ps -a"
    echo
    echo "问题排查："
    echo "  健康检查: ./scripts/health-check.sh"
    echo "  故障排除: 查看 troubleshooting/ 目录"
    echo
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "======================================"
    echo "  Docker镜像拉取脚本 v1.0"
    echo "  预拉取所有项目依赖镜像"
    echo "======================================"
    echo -e "${NC}"
    
    check_docker
    
    log_info "开始拉取 $TOTAL_IMAGES 个镜像..."
    log_info "使用镜像源: ${MIRRORS[*]}"
    
    # 拉取所有镜像
    for image in "${!IMAGES[@]}"; do
        pull_image "$image" "${IMAGES[$image]}"
    done
    
    # 验证和清理
    verify_images
    cleanup_duplicate_images
    generate_image_report
    
    # 显示结果统计
    echo
    echo -e "${GREEN}======================================"
    echo "  📊 拉取结果统计"
    echo "======================================${NC}"
    echo "总镜像数: $TOTAL_IMAGES"
    echo -e "成功拉取: ${GREEN}$SUCCESS_COUNT${NC}"
    echo -e "拉取失败: ${RED}$FAILED_COUNT${NC}"
    echo -e "跳过镜像: ${YELLOW}$SKIPPED_COUNT${NC}"
    
    if [[ $FAILED_COUNT -gt 0 ]]; then
        echo
        log_warning "部分镜像拉取失败，可能原因："
        echo "  1. 网络连接问题"
        echo "  2. 镜像源暂时不可用"
        echo "  3. 镜像名称或版本错误"
        echo "  建议稍后重试或查看错误日志"
    fi
    
    show_usage_tips
}

# 信号处理
trap 'echo -e "\n${YELLOW}脚本被中断${NC}"; exit 1' INT TERM

# 运行主函数
main "$@" 