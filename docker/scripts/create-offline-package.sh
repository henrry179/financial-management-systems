#!/bin/bash

# Docker离线镜像包创建脚本
# 作者: Financial Management System Team
# 版本: v1.0
# 最后更新: 2025-01-20 18:50:00

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 项目必需镜像列表
declare -A REQUIRED_IMAGES=(
    # 核心运行时
    ["node:18-alpine"]="Node.js运行时环境"
    ["postgres:13-alpine"]="PostgreSQL数据库"
    ["redis:6-alpine"]="Redis缓存服务"
    ["nginx:alpine"]="Nginx Web服务器"
    
    # 开发工具
    ["dpage/pgadmin4:latest"]="PostgreSQL管理界面"
    ["maildev/maildev:latest"]="邮件测试服务"
    
    # 基础镜像
    ["alpine:latest"]="Alpine Linux基础镜像"
    ["busybox:latest"]="BusyBox工具集"
)

# 创建离线包目录
create_package_structure() {
    local package_dir="docker/offline-package-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$package_dir/images"
    mkdir -p "$package_dir/scripts"
    mkdir -p "$package_dir/config"
    
    echo "$package_dir"
}

# 拉取并保存镜像
save_images() {
    local package_dir=$1
    local images_dir="$package_dir/images"
    local manifest_file="$package_dir/manifest.txt"
    
    log_info "开始保存Docker镜像..."
    
    # 创建镜像清单
    echo "# Docker离线镜像清单" > "$manifest_file"
    echo "# 创建时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$manifest_file"
    echo "" >> "$manifest_file"
    
    local saved_count=0
    local total_size=0
    
    for image in "${!REQUIRED_IMAGES[@]}"; do
        local description="${REQUIRED_IMAGES[$image]}"
        log_info "处理镜像: $image ($description)"
        
        # 检查镜像是否存在
        if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^$image$"; then
            log_warning "镜像不存在，尝试拉取: $image"
            if ! docker pull "$image"; then
                log_error "无法拉取镜像: $image"
                continue
            fi
        fi
        
        # 生成文件名
        local filename="${image//\//_}.tar"
        filename="${filename//:/_}"
        local filepath="$images_dir/$filename"
        
        # 保存镜像
        log_info "保存镜像到: $filename"
        if docker save "$image" -o "$filepath"; then
            # 获取文件大小
            local size=$(du -h "$filepath" | cut -f1)
            echo "$image|$filename|$size|$description" >> "$manifest_file"
            
            ((saved_count++))
            log_success "✓ 已保存: $image (大小: $size)"
        else
            log_error "✗ 保存失败: $image"
            rm -f "$filepath"
        fi
    done
    
    # 计算总大小
    total_size=$(du -sh "$images_dir" | cut -f1)
    
    echo "" >> "$manifest_file"
    echo "# 统计信息" >> "$manifest_file"
    echo "# 镜像总数: $saved_count/${#REQUIRED_IMAGES[@]}" >> "$manifest_file"
    echo "# 总大小: $total_size" >> "$manifest_file"
    
    log_success "镜像保存完成: 成功 $saved_count/${#REQUIRED_IMAGES[@]}, 总大小: $total_size"
}

# 创建加载脚本
create_load_script() {
    local package_dir=$1
    local load_script="$package_dir/load-images.sh"
    
    cat > "$load_script" << 'SCRIPT'
#!/bin/bash

# Docker离线镜像加载脚本
# 自动加载所有离线镜像

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查Docker
if ! command -v docker &>/dev/null; then
    log_error "Docker未安装，请先安装Docker"
    exit 1
fi

if ! docker info &>/dev/null; then
    log_error "Docker服务未运行，请启动Docker"
    exit 1
fi

# 加载镜像
log_info "开始加载Docker镜像..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGES_DIR="$SCRIPT_DIR/images"
MANIFEST_FILE="$SCRIPT_DIR/manifest.txt"

if [ ! -d "$IMAGES_DIR" ]; then
    log_error "镜像目录不存在: $IMAGES_DIR"
    exit 1
fi

# 读取清单并加载镜像
loaded_count=0
failed_count=0

while IFS='|' read -r image filename size description || [ -n "$image" ]; do
    # 跳过注释和空行
    [[ "$image" =~ ^#.*$ ]] && continue
    [[ -z "$image" ]] && continue
    
    filepath="$IMAGES_DIR/$filename"
    
    if [ -f "$filepath" ]; then
        log_info "加载镜像: $image ($size)"
        if docker load -i "$filepath"; then
            ((loaded_count++))
            log_success "✓ 已加载: $image"
        else
            ((failed_count++))
            log_error "✗ 加载失败: $image"
        fi
    else
        log_error "镜像文件不存在: $filename"
        ((failed_count++))
    fi
done < "$MANIFEST_FILE"

# 显示结果
echo
echo "======================================"
echo "  加载完成"
echo "======================================"
echo "成功加载: $loaded_count"
echo "加载失败: $failed_count"
echo

# 验证镜像
log_info "验证已加载的镜像..."
docker images

log_success "镜像加载完成！"
SCRIPT
    
    chmod +x "$load_script"
}

# 创建快速部署脚本
create_deploy_script() {
    local package_dir=$1
    local deploy_script="$package_dir/quick-deploy.sh"
    
    cat > "$deploy_script" << 'DEPLOY'
#!/bin/bash

# 快速部署脚本
# 加载镜像并启动系统

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================"
echo "  财务管理系统快速部署"
echo "======================================"

# 1. 加载Docker镜像
echo "步骤 1/3: 加载Docker镜像..."
bash "$SCRIPT_DIR/load-images.sh"

# 2. 复制配置文件
echo
echo "步骤 2/3: 复制配置文件..."
if [ -d "$SCRIPT_DIR/config" ]; then
    cp -r "$SCRIPT_DIR/config"/* ./ 2>/dev/null || true
    echo "✓ 配置文件已复制"
fi

# 3. 启动系统
echo
echo "步骤 3/3: 启动系统..."
if [ -f "docker-compose.yml" ]; then
    docker-compose up -d
    echo "✓ 系统已启动"
    echo
    echo "访问地址:"
    echo "  前端: http://localhost:3000"
    echo "  后端: http://localhost:8000"
    echo "  数据库管理: http://localhost:5050"
else
    echo "⚠ 未找到docker-compose.yml，请手动启动系统"
fi

echo
echo "部署完成！"
DEPLOY
    
    chmod +x "$deploy_script"
}

# 创建说明文档
create_readme() {
    local package_dir=$1
    local readme_file="$package_dir/README.md"
    
    cat > "$readme_file" << EOF
# Docker离线镜像包

## 📦 包信息

- **创建时间**: $(date '+%Y-%m-%d %H:%M:%S')
- **系统版本**: Financial Management System v1.0
- **包含镜像**: ${#REQUIRED_IMAGES[@]} 个
- **总大小**: $(du -sh "$package_dir/images" | cut -f1)

## 🚀 快速使用

### 方法一：一键部署（推荐）
\`\`\`bash
# 解压后进入目录
cd offline-package-*

# 运行快速部署脚本
./quick-deploy.sh
\`\`\`

### 方法二：手动加载
\`\`\`bash
# 加载所有镜像
./load-images.sh

# 手动启动系统
docker-compose up -d
\`\`\`

## 📋 镜像清单

| 镜像名称 | 说明 | 文件大小 |
|---------|------|----------|
$(while IFS='|' read -r image filename size description; do
    [[ "$image" =~ ^#.*$ ]] && continue
    [[ -z "$image" ]] && continue
    echo "| $image | $description | $size |"
done < "$package_dir/manifest.txt")

## 🛠 系统要求

- Docker >= 20.10.0
- Docker Compose >= 2.0.0
- 可用磁盘空间 >= 5GB
- 内存 >= 4GB

## ⚠️ 注意事项

1. 确保Docker服务已启动
2. 检查端口3000、8000、5432是否被占用
3. 首次启动可能需要几分钟初始化数据库
4. 默认管理员账号: admin@example.com / admin123

## 🔧 故障排除

### 镜像加载失败
- 检查Docker服务状态: \`docker info\`
- 检查磁盘空间: \`df -h\`
- 查看Docker日志: \`docker logs\`

### 容器启动失败
- 检查端口占用: \`netstat -tuln | grep -E '3000|8000|5432'\`
- 查看容器状态: \`docker-compose ps\`
- 查看容器日志: \`docker-compose logs\`

### 网络连接问题
- 重启Docker服务
- 检查防火墙设置
- 确保Docker网络正常: \`docker network ls\`

## 📞 技术支持

如遇到问题，请查看项目文档或联系技术支持团队。

---
*此离线包由自动化脚本生成*
EOF
}

# 复制必要的配置文件
copy_config_files() {
    local package_dir=$1
    local config_dir="$package_dir/config"
    
    log_info "复制配置文件..."
    
    # 复制docker-compose文件
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml "$config_dir/"
    fi
    
    if [ -f "docker/docker-compose-fixed.yml" ]; then
        cp docker/docker-compose-fixed.yml "$config_dir/"
    fi
    
    # 复制环境配置示例
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example "$config_dir/"
    fi
    
    log_success "配置文件已复制"
}

# 创建压缩包
create_archive() {
    local package_dir=$1
    local archive_name="${package_dir}.tar.gz"
    
    log_info "创建压缩包..."
    
    # 使用tar创建压缩包
    tar -czf "$archive_name" -C "$(dirname "$package_dir")" "$(basename "$package_dir")"
    
    local archive_size=$(du -h "$archive_name" | cut -f1)
    log_success "压缩包已创建: $archive_name (大小: $archive_size)"
    
    # 生成MD5校验和
    if command -v md5sum &>/dev/null; then
        md5sum "$archive_name" > "${archive_name}.md5"
        log_info "MD5校验和: $(cat "${archive_name}.md5")"
    fi
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "======================================"
    echo "  Docker离线镜像包创建工具"
    echo "  适用于网络受限环境部署"
    echo "======================================"
    echo -e "${NC}"
    
    # 检查Docker
    if ! command -v docker &>/dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! docker info &>/dev/null; then
        log_error "Docker服务未运行，请启动Docker"
        exit 1
    fi
    
    # 创建包目录结构
    PACKAGE_DIR=$(create_package_structure)
    log_success "创建包目录: $PACKAGE_DIR"
    
    # 保存镜像
    save_images "$PACKAGE_DIR"
    
    # 创建脚本和文档
    create_load_script "$PACKAGE_DIR"
    create_deploy_script "$PACKAGE_DIR"
    create_readme "$PACKAGE_DIR"
    copy_config_files "$PACKAGE_DIR"
    
    # 创建压缩包
    create_archive "$PACKAGE_DIR"
    
    # 清理临时目录（可选）
    read -p "是否删除未压缩的目录？[y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PACKAGE_DIR"
        log_info "已删除临时目录"
    fi
    
    echo
    echo -e "${GREEN}======================================"
    echo "  ✅ 离线包创建完成！"
    echo "======================================"
    echo -e "${NC}"
    echo "离线包位置: ${PACKAGE_DIR}.tar.gz"
    echo
    echo "使用方法:"
    echo "1. 将 ${PACKAGE_DIR}.tar.gz 复制到目标机器"
    echo "2. 解压: tar -xzf ${PACKAGE_DIR}.tar.gz"
    echo "3. 进入目录运行: ./quick-deploy.sh"
    echo
    
    # 播放完成提示音
    if command -v afplay &>/dev/null; then
        (for i in {1..10}; do afplay /System/Library/Sounds/Glass.aiff; sleep 3; done) &
    fi
}

# 运行主函数
main "$@" 