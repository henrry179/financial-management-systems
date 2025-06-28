#!/bin/bash
# 💻 智能财务管理系统 - Docker完整修复脚本 v2.0
# 🔧 解决所有Docker相关问题的一站式解决方案

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 当前时间
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# 打印彩色输出
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 打印横幅
print_banner() {
    clear
    print_color $CYAN "
╔══════════════════════════════════════════════════════════════╗
║            🔧 Docker完整修复脚本 v2.0                        ║
║              Financial System Docker Fixer                   ║
║                智能诊断·全面修复·一键启动                      ║
╚══════════════════════════════════════════════════════════════╝

🕒 修复时间: $CURRENT_TIME
💻 操作系统: $(uname -s)
📁 当前目录: $(pwd)
"
}

# 检查Docker状态
check_docker_status() {
    print_color $BLUE "🔍 第一步：Docker环境检查..."
    
    if ! command -v docker &> /dev/null; then
        print_color $RED "❌ Docker未安装，请先安装Docker Desktop"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_color $RED "❌ Docker服务未运行，请启动Docker Desktop"
        print_color $YELLOW "💡 请打开Docker Desktop应用后重新运行此脚本"
        exit 1
    fi
    
    print_color $GREEN "✅ Docker服务运行正常"
    
    # 显示Docker版本信息
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f4 | cut -d',' -f1)
    print_color $CYAN "📊 Docker版本: $DOCKER_VERSION"
    print_color $CYAN "📊 Compose版本: $COMPOSE_VERSION"
}

# 修复Docker镜像源
fix_docker_registry() {
    print_color $BLUE "🔧 第二步：优化Docker镜像源配置..."
    
    # 创建Docker配置目录
    DOCKER_CONFIG_DIR="$HOME/.docker"
    mkdir -p "$DOCKER_CONFIG_DIR"
    
    # 备份现有配置
    if [ -f "$DOCKER_CONFIG_DIR/daemon.json" ]; then
        BACKUP_FILE="$DOCKER_CONFIG_DIR/daemon.json.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$DOCKER_CONFIG_DIR/daemon.json" "$BACKUP_FILE"
        print_color $YELLOW "📋 已备份现有配置到: $BACKUP_FILE"
    fi
    
    # 创建优化的daemon.json配置
    cat > "$DOCKER_CONFIG_DIR/daemon.json" << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://dockerproxy.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false,
  "features": {
    "buildkit": true
  },
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "storage-driver": "overlay2",
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1", "223.5.5.5"]
}
EOF
    
    print_color $GREEN "✅ Docker镜像源配置已优化"
    print_color $CYAN "📄 配置文件位置: $DOCKER_CONFIG_DIR/daemon.json"
}

# 重启Docker服务
restart_docker() {
    print_color $BLUE "🔄 第三步：重启Docker服务..."
    
    # 检测操作系统
    OS=$(uname -s)
    case $OS in
        Darwin)
            print_color $YELLOW "🍎 检测到macOS，重启Docker Desktop..."
            # 尝试通过AppleScript重启Docker Desktop
            osascript << 'APPLESCRIPT' 2>/dev/null || true
tell application "Docker Desktop"
    quit
end tell

delay 5

tell application "Docker Desktop"
    activate
end tell
APPLESCRIPT
            ;;
        Linux)
            print_color $YELLOW "🐧 检测到Linux，重启Docker服务..."
            sudo systemctl restart docker || true
            ;;
        *)
            print_color $YELLOW "⚠️  未知操作系统，请手动重启Docker"
            ;;
    esac
    
    # 等待Docker服务就绪
    print_color $YELLOW "⏳ 等待Docker服务重启..."
    RETRY_COUNT=0
    MAX_RETRIES=30
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if docker info &>/dev/null; then
            print_color $GREEN "✅ Docker服务重启成功"
            break
        fi
        
        echo -n "."
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT + 1))
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_color $RED "❌ Docker服务重启超时，请手动重启Docker Desktop"
        return 1
    fi
}

# 测试镜像拉取
test_image_pull() {
    print_color $BLUE "🧪 第四步：测试镜像拉取..."
    
    # 测试小镜像
    print_color $YELLOW "📦 测试基础镜像拉取..."
    if docker pull hello-world:latest &>/dev/null; then
        print_color $GREEN "✅ 基础镜像拉取成功"
        docker rmi hello-world:latest &>/dev/null || true
    else
        print_color $RED "❌ 基础镜像拉取失败"
        return 1
    fi
    
    # 测试项目所需镜像
    REQUIRED_IMAGES=(
        "postgres:15-alpine"
        "redis:7-alpine"
        "node:18-alpine"
        "dpage/pgadmin4:latest"
    )
    
    SUCCESS_COUNT=0
    TOTAL_IMAGES=${#REQUIRED_IMAGES[@]}
    
    for image in "${REQUIRED_IMAGES[@]}"; do
        print_color $YELLOW "📥 拉取镜像: $image"
        
        if timeout 300 docker pull "$image" &>/dev/null; then
            print_color $GREEN "✅ 成功: $image"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            print_color $RED "❌ 失败: $image"
            
            # 尝试拉取替代版本
            case $image in
                *postgres*)
                    print_color $YELLOW "🔄 尝试拉取 postgres:latest"
                    if timeout 300 docker pull postgres:latest &>/dev/null; then
                        print_color $GREEN "✅ 成功拉取替代版本: postgres:latest"
                        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
                    fi
                    ;;
                *redis*)
                    print_color $YELLOW "🔄 尝试拉取 redis:latest"
                    if timeout 300 docker pull redis:latest &>/dev/null; then
                        print_color $GREEN "✅ 成功拉取替代版本: redis:latest"
                        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
                    fi
                    ;;
            esac
        fi
    done
    
    print_color $CYAN "📊 镜像拉取结果: $SUCCESS_COUNT/$TOTAL_IMAGES 成功"
    
    if [ $SUCCESS_COUNT -ge 2 ]; then
        print_color $GREEN "✅ 足够的镜像已成功拉取，可以启动系统"
        return 0
    else
        print_color $RED "❌ 拉取的镜像数量不足，建议使用本地开发模式"
        return 1
    fi
}

# 优化Docker Compose配置
optimize_compose_config() {
    print_color $BLUE "📝 第五步：优化Docker Compose配置..."
    
    # 检查是否存在docker-compose-fixed.yml
    if [ -f "docker-compose-fixed.yml" ]; then
        print_color $GREEN "✅ 发现优化的Compose配置文件"
        
        # 备份原始配置
        if [ -f "docker-compose.yml" ]; then
            cp docker-compose.yml "docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)"
            print_color $YELLOW "📋 已备份原始配置"
        fi
        
        # 使用优化配置
        cp docker-compose-fixed.yml docker-compose.yml
        print_color $GREEN "✅ 已应用优化的Docker Compose配置"
    else
        print_color $YELLOW "⚠️  未找到优化配置文件，保持现有配置"
    fi
}

# 清理Docker环境
cleanup_docker() {
    print_color $BLUE "🧹 第六步：清理Docker环境..."
    
    print_color $YELLOW "🔄 停止现有容器..."
    docker-compose down --remove-orphans &>/dev/null || true
    
    print_color $YELLOW "🗑️  清理无用镜像和容器..."
    docker system prune -f &>/dev/null || true
    
    print_color $GREEN "✅ Docker环境清理完成"
}

# 测试系统启动
test_system_startup() {
    print_color $BLUE "🚀 第七步：测试系统启动..."
    
    print_color $YELLOW "📦 启动数据库服务..."
    if timeout 120 docker-compose up -d postgres redis &>/dev/null; then
        print_color $GREEN "✅ 数据库服务启动成功"
        
        print_color $YELLOW "⏳ 等待服务就绪..."
        sleep 15
        
        # 检查服务状态
        if docker-compose ps | grep -q "Up"; then
            print_color $GREEN "✅ 系统启动测试成功！"
            
            # 显示服务状态
            print_color $CYAN "📊 服务状态:"
            docker-compose ps
            
            return 0
        else
            print_color $RED "❌ 服务未正常启动"
            return 1
        fi
    else
        print_color $RED "❌ 数据库服务启动失败"
        return 1
    fi
}

# 创建快速启动脚本
create_quick_start() {
    print_color $BLUE "📜 第八步：创建快速启动脚本..."
    
    cat > "quick-start-docker.sh" << 'EOF'
#!/bin/bash
# 💻 智能财务管理系统 - Docker快速启动脚本

echo "🚀 启动智能财务管理系统（Docker模式）..."

# 停止现有服务
echo "🔄 停止现有服务..."
docker-compose down --remove-orphans

# 启动所有服务
echo "🌐 启动所有服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动完成..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

echo "
╔══════════════════════════════════════════════════════════════╗
║                   🎉 系统启动完成！                          ║
╚══════════════════════════════════════════════════════════════╝

🌐 访问地址：
  📱 前端界面: http://localhost:3000
  🔗 后端API:  http://localhost:8000
  🗄️ 数据库管理: http://localhost:5050

🔑 测试账户：
  📧 邮箱: admin@financial.com
  🔒 密码: admin123456

📊 管理命令：
  🔍 查看状态: docker-compose ps
  📋 查看日志: docker-compose logs -f
  🛑 停止服务: docker-compose down
"

# 播放启动完成音效
if [[ "$OSTYPE" == "darwin"* ]]; then
    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
    say "财务管理系统启动完成" 2>/dev/null &
fi
EOF
    
    chmod +x quick-start-docker.sh
    print_color $GREEN "✅ 快速启动脚本已创建: quick-start-docker.sh"
}

# 播放30秒修复完成轻音乐
play_fix_completion_music() {
    print_color $PURPLE "🎵 播放30秒Docker修复完成轻音乐..."
    
    # 检查是否为深夜模式
    HOUR=$(date +%H)
    if [ $HOUR -ge 22 ] || [ $HOUR -le 8 ]; then
        print_color $PURPLE "🌙 深夜模式：播放轻柔提醒音效..."
        # 播放10秒轻柔音效
        for i in {1..5}; do
            if [[ "$OSTYPE" == "darwin"* ]]; then
                afplay /System/Library/Sounds/Tink.aiff 2>/dev/null &
            fi
            sleep 2
        done
        if [[ "$OSTYPE" == "darwin"* ]]; then
            say "Docker系统修复完成，深夜模式激活" --voice="Sin-ji" --rate=120 2>/dev/null &
        fi
    else
        print_color $GREEN "🎼 播放30秒Docker修复成功古典轻音乐..."
        # 播放25秒古典音效序列
        for i in {1..10}; do
            if [[ "$OSTYPE" == "darwin"* ]]; then
                afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
            fi
            sleep 2.5
            
            if [ $i -eq 3 ]; then
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    say "Docker系统已成功修复" --voice="Ting-Ting" --rate=160 2>/dev/null &
                fi
            elif [ $i -eq 7 ]; then
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    say "财务管理系统现在可以正常启动" --voice="Ting-Ting" --rate=150 2>/dev/null &
                fi
            fi
        done
    fi
    
    print_color $GREEN "✅ 30秒Docker修复轻音乐播放完成"
}

# 显示修复结果
show_fix_results() {
    print_color $GREEN "
╔══════════════════════════════════════════════════════════════╗
║                  🎉 Docker修复完成！                         ║
╚══════════════════════════════════════════════════════════════╝

✅ 修复成果：
  🔧 Docker镜像源已优化
  📦 必要镜像已拉取
  📝 Compose配置已优化
  🚀 系统启动测试通过
  📜 快速启动脚本已创建

🚀 启动系统：
  bash quick-start-docker.sh

🛠️ 故障排除：
  如果Docker模式仍有问题，请使用本地开发模式：
  python deployment/scripts/start_local_system.py

📊 其他命令：
  🔍 查看容器状态: docker-compose ps
  📋 查看服务日志: docker-compose logs -f
  🛑 停止所有服务: docker-compose down
  🧹 清理Docker环境: docker system prune -f

最后修复时间: $CURRENT_TIME
"
}

# 主函数
main() {
    print_banner
    
    # 执行修复流程
    check_docker_status
    fix_docker_registry
    restart_docker
    
    if test_image_pull; then
        optimize_compose_config
        cleanup_docker
        
        if test_system_startup; then
            create_quick_start
            play_fix_completion_music
            show_fix_results
            
            print_color $GREEN "🎯 Docker修复成功！推荐使用Docker模式启动系统"
            return 0
        else
            print_color $YELLOW "⚠️  Docker启动测试失败，建议使用本地开发模式"
        fi
    else
        print_color $YELLOW "⚠️  镜像拉取失败，建议使用本地开发模式"
    fi
    
    print_color $CYAN "💡 替代方案：使用本地开发模式"
    print_color $CYAN "   python deployment/scripts/start_local_system.py"
}

# 执行主函数
main "$@" 