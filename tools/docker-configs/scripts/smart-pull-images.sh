#!/bin/bash

# 智能Docker镜像拉取脚本 v2.0 - 解决重复拉取失败问题
# 作者: Financial Management System Team
# 版本: v2.0 - 增强版
# 最后更新: 2025-09-05 10:49:44

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置参数
MAX_RETRY=3
RETRY_DELAY=5
TIMEOUT=120
NETWORK_TEST_TIMEOUT=5

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_debug() { echo -e "${PURPLE}[DEBUG]${NC} $1"; }
log_network() { echo -e "${CYAN}[NETWORK]${NC} $1"; }

# 镜像源配置 - 按优先级排序
declare -A MIRROR_SOURCES=(
    ["ustc"]="https://docker.mirrors.ustc.edu.cn"
    ["163"]="https://hub-mirror.c.163.com"
    ["baidu"]="https://mirror.baidubce.com"
    ["aliyun"]="https://registry.cn-hangzhou.aliyuncs.com"
    ["tencent"]="https://mirror.ccs.tencentyun.com"
    ["huawei"]="https://repo.huaweicloud.com"
    ["dockerhub"]="https://registry-1.docker.io"
)

# 镜像源别名映射
declare -A MIRROR_ALIASES=(
    ["ustc"]="中科大镜像源"
    ["163"]="网易云镜像源"
    ["baidu"]="百度云镜像源"
    ["aliyun"]="阿里云镜像源"
    ["tencent"]="腾讯云镜像源"
    ["huawei"]="华为云镜像源"
    ["dockerhub"]="Docker官方源"
)

# 核心镜像列表
declare -A CORE_IMAGES=(
    ["node:18-alpine"]="Node.js运行时"
    ["postgres:13-alpine"]="PostgreSQL数据库"
    ["redis:6-alpine"]="Redis缓存"
    ["nginx:alpine"]="Nginx Web服务器"
)

# 网络诊断
diagnose_network() {
    log_network "开始网络诊断..."
    
    # 测试基本网络连接
    if ping -c 1 -W 2 8.8.8.8 &>/dev/null; then
        log_success "✓ 基本网络连接正常"
    else
        log_error "✗ 基本网络连接失败"
        return 1
    fi
    
    # 测试DNS解析
    if nslookup docker.com &>/dev/null; then
        log_success "✓ DNS解析正常"
    else
        log_error "✗ DNS解析失败"
        return 1
    fi
    
    # 测试各镜像源连接
    log_network "测试镜像源连接状态..."
    local available_mirrors=()
    
    for mirror in "${!MIRROR_SOURCES[@]}"; do
        local url="${MIRROR_SOURCES[$mirror]}"
        local name="${MIRROR_ALIASES[$mirror]}"
        
        if timeout $NETWORK_TEST_TIMEOUT curl -sI "$url" &>/dev/null; then
            log_success "✓ $name ($url) - 可用"
            available_mirrors+=("$mirror")
        else
            log_warning "✗ $name ($url) - 不可用"
        fi
    done
    
    if [ ${#available_mirrors[@]} -eq 0 ]; then
        log_error "所有镜像源都不可用，请检查网络连接"
        return 1
    fi
    
    log_success "可用镜像源: ${available_mirrors[@]}"
    echo "${available_mirrors[@]}"
}

# 动态配置Docker镜像源
configure_docker_mirrors() {
    log_info "动态配置Docker镜像源..."
    
    # 获取可用镜像源
    local available_mirrors=($(diagnose_network))
    
    if [ ${#available_mirrors[@]} -eq 0 ]; then
        log_error "没有可用的镜像源"
        return 1
    fi
    
    # 生成镜像源配置
    local mirrors_json=""
    for mirror in "${available_mirrors[@]}"; do
        if [ -n "$mirrors_json" ]; then
            mirrors_json+=","
        fi
        mirrors_json+="\"${MIRROR_SOURCES[$mirror]}\""
    done
    
    # 创建daemon.json配置
    local daemon_json="{
  \"registry-mirrors\": [$mirrors_json],
  \"max-concurrent-downloads\": 10,
  \"max-concurrent-uploads\": 5,
  \"log-driver\": \"json-file\",
  \"log-opts\": {
    \"max-size\": \"10m\",
    \"max-file\": \"3\"
  }
}"
    
    # 备份现有配置
    if [ -f ~/.docker/daemon.json ]; then
        cp ~/.docker/daemon.json ~/.docker/daemon.json.bak
        log_info "已备份原配置到 ~/.docker/daemon.json.bak"
    fi
    
    # 写入新配置
    echo "$daemon_json" > ~/.docker/daemon.json
    log_success "Docker镜像源配置已更新"
    
    # 重启Docker服务
    restart_docker_service
}

# 重启Docker服务
restart_docker_service() {
    log_info "重启Docker服务..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e 'quit app "Docker"' 2>/dev/null || true
        sleep 2
        open -a Docker
        log_info "等待Docker Desktop启动..."
        
        # 等待Docker就绪
        local count=0
        while ! docker info &>/dev/null && [ $count -lt 30 ]; do
            sleep 2
            ((count++))
        done
        
        if docker info &>/dev/null; then
            log_success "Docker服务已重启"
        else
            log_error "Docker服务重启失败"
            return 1
        fi
    else
        # Linux
        sudo systemctl restart docker
        log_success "Docker服务已重启"
    fi
}

# 智能拉取镜像
smart_pull_image() {
    local image=$1
    local description=$2
    local retry_count=0
    
    log_info "拉取镜像: $image ($description)"
    
    # 检查镜像是否已存在
    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$image$"; then
        log_warning "镜像已存在，跳过: $image"
        return 0
    fi
    
    # 获取可用镜像源
    local available_mirrors=($(diagnose_network | tail -1))
    
    # 尝试从多个镜像源拉取
    for mirror in "${available_mirrors[@]}"; do
        local mirror_name="${MIRROR_ALIASES[$mirror]}"
        retry_count=0
        
        while [ $retry_count -lt $MAX_RETRY ]; do
            log_info "尝试从 $mirror_name 拉取 (尝试 $((retry_count+1))/$MAX_RETRY)..."
            
            if pull_from_specific_mirror "$mirror" "$image"; then
                log_success "✓ 成功从 $mirror_name 拉取 $image"
                return 0
            else
                log_warning "从 $mirror_name 拉取失败"
                ((retry_count++))
                
                if [ $retry_count -lt $MAX_RETRY ]; then
                    log_info "等待 ${RETRY_DELAY} 秒后重试..."
                    sleep $RETRY_DELAY
                fi
            fi
        done
    done
    
    log_error "✗ 从所有镜像源拉取 $image 失败"
    return 1
}

# 从特定镜像源拉取
pull_from_specific_mirror() {
    local mirror=$1
    local image=$2
    
    # 根据镜像源生成完整镜像名
    local full_image=""
    case $mirror in
        "aliyun")
            full_image="registry.cn-hangzhou.aliyuncs.com/google_containers/${image#*/}"
            ;;
        "tencent")
            full_image="ccr.ccs.tencentyun.com/mirrors/${image#*/}"
            ;;
        "dockerhub")
            full_image="$image"
            ;;
        *)
            # 对于其他镜像源，直接使用原始镜像名
            full_image="$image"
            ;;
    esac
    
    # 拉取镜像
    if timeout $TIMEOUT docker pull "$full_image" 2>&1; then
        # 如果使用了替代镜像名，重新标记
        if [[ "$full_image" != "$image" ]]; then
            docker tag "$full_image" "$image"
            docker rmi "$full_image" 2>/dev/null || true
        fi
        return 0
    else
        return 1
    fi
}

# 创建离线镜像包
create_offline_package() {
    log_info "创建离线镜像包..."
    
    local offline_dir="docker/offline-images"
    mkdir -p "$offline_dir"
    
    # 保存镜像到tar文件
    for image in "${!CORE_IMAGES[@]}"; do
        if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$image$"; then
            local filename="${image//\//_}.tar"
            filename="${filename//:/_}"
            
            log_info "保存镜像: $image -> $filename"
            docker save "$image" -o "$offline_dir/$filename"
        fi
    done
    
    # 创建加载脚本
    cat > "$offline_dir/load-images.sh" << 'EOF'
#!/bin/bash
# 加载离线镜像包

echo "加载离线镜像..."
for tar_file in *.tar; do
    if [ -f "$tar_file" ]; then
        echo "加载: $tar_file"
        docker load -i "$tar_file"
    fi
done
echo "✓ 离线镜像加载完成"
EOF
    
    chmod +x "$offline_dir/load-images.sh"
    
    # 创建说明文件
    cat > "$offline_dir/README.md" << EOF
# 离线镜像包

创建时间: $(date '+%Y-%m-%d %H:%M:%S')

## 使用方法

1. 将整个 offline-images 目录复制到目标机器
2. 运行加载脚本:
   \`\`\`bash
   cd offline-images
   ./load-images.sh
   \`\`\`

## 包含镜像

$(for image in "${!CORE_IMAGES[@]}"; do
    echo "- $image: ${CORE_IMAGES[$image]}"
done)

## 注意事项

- 确保目标机器已安装并启动Docker
- 加载镜像需要足够的磁盘空间
- 镜像包可能较大，传输时请耐心等待
EOF
    
    log_success "离线镜像包已创建: $offline_dir"
}

# 修复Docker配置
fix_docker_config() {
    log_info "修复Docker配置..."
    
    # 创建必要目录
    mkdir -p ~/.docker
    
    # 检查并修复权限
    if [[ "$OSTYPE" != "darwin"* ]]; then
        # Linux系统添加用户到docker组
        if ! groups | grep -q docker; then
            log_info "添加当前用户到docker组..."
            sudo usermod -aG docker $USER
            log_warning "请重新登录或运行 'newgrp docker' 使权限生效"
        fi
    fi
    
    # 清理Docker缓存
    log_info "清理Docker缓存..."
    docker system prune -f 2>/dev/null || true
    
    log_success "Docker配置修复完成"
}

# 生成详细报告
generate_report() {
    local report_file="docker/docker-pull-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
Docker镜像拉取报告
==================
生成时间: $(date '+%Y-%m-%d %H:%M:%S')
系统信息: $(uname -a)
Docker版本: $(docker --version 2>/dev/null || echo "未安装")

网络诊断结果:
$(diagnose_network 2>&1)

镜像拉取结果:
EOF
    
    # 添加镜像状态
    for image in "${!CORE_IMAGES[@]}"; do
        if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$image$"; then
            echo "✓ $image: ${CORE_IMAGES[$image]} - 已拉取" >> "$report_file"
        else
            echo "✗ $image: ${CORE_IMAGES[$image]} - 未拉取" >> "$report_file"
        fi
    done
    
    # 添加Docker信息
    echo -e "\nDocker详细信息:" >> "$report_file"
    docker info >> "$report_file" 2>&1
    
    log_success "详细报告已生成: $report_file"
}

# 主函数
main() {
    echo -e "${CYAN}"
    echo "======================================"
    echo "  智能Docker镜像拉取脚本 v2.0"
    echo "  解决镜像拉取重复失败问题"
    echo "======================================"
    echo -e "${NC}"
    
    # 检查Docker是否安装
    if ! command -v docker &>/dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker服务状态
    if ! docker info &>/dev/null; then
        log_warning "Docker服务未运行，尝试启动..."
        restart_docker_service || exit 1
    fi
    
    # 修复Docker配置
    fix_docker_config
    
    # 动态配置镜像源
    configure_docker_mirrors
    
    # 拉取核心镜像
    local success_count=0
    local failed_images=()
    
    for image in "${!CORE_IMAGES[@]}"; do
        if smart_pull_image "$image" "${CORE_IMAGES[$image]}"; then
            ((success_count++))
        else
            failed_images+=("$image")
        fi
    done
    
    # 显示结果
    echo
    echo -e "${GREEN}======================================"
    echo "  拉取结果统计"
    echo "======================================${NC}"
    echo "总镜像数: ${#CORE_IMAGES[@]}"
    echo -e "成功拉取: ${GREEN}$success_count${NC}"
    echo -e "拉取失败: ${RED}${#failed_images[@]}${NC}"
    
    # 如果有失败的镜像，提供备选方案
    if [ ${#failed_images[@]} -gt 0 ]; then
        echo
        log_warning "以下镜像拉取失败:"
        for image in "${failed_images[@]}"; do
            echo "  - $image"
        done
        
        echo
        log_info "备选解决方案:"
        echo "  1. 检查网络连接和代理设置"
        echo "  2. 使用离线镜像包 (运行 create-offline-package.sh)"
        echo "  3. 手动配置其他镜像源"
        echo "  4. 联系网络管理员开放Docker Hub访问"
    else
        # 创建离线包备份
        create_offline_package
    fi
    
    # 生成报告
    generate_report
    
    # 播放完成提示音（30秒轻音乐）
    if command -v afplay &>/dev/null; then
        # macOS
        (for i in {1..10}; do afplay /System/Library/Sounds/Glass.aiff; sleep 3; done) &
    elif command -v paplay &>/dev/null; then
        # Linux with PulseAudio
        (for i in {1..10}; do paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null; sleep 3; done) &
    fi
    
    if [ ${#failed_images[@]} -eq 0 ]; then
        log_success "🎉 所有镜像拉取成功！系统已准备就绪"
    else
        log_warning "⚠️  部分镜像拉取失败，请查看报告并尝试备选方案"
    fi
}

# 运行主函数
main "$@" 