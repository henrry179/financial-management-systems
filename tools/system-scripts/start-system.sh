#!/bin/bash

# 智能财务管理系统 - 智能启动脚本 v1.0
# 集成30秒轻音乐提醒系统

set -e

# 获取当前时间
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# 颜色输出函数
print_color() {
    case $1 in
        "red") echo -e "\033[31m$2\033[0m" ;;
        "green") echo -e "\033[32m$2\033[0m" ;;
        "yellow") echo -e "\033[33m$2\033[0m" ;;
        "blue") echo -e "\033[34m$2\033[0m" ;;
        "purple") echo -e "\033[35m$2\033[0m" ;;
        "cyan") echo -e "\033[36m$2\033[0m" ;;
        *) echo "$2" ;;
    esac
}

# 30秒轻音乐提醒系统
play_30s_light_music() {
    local task_type="$1"
    local hour=$(date +%H)
    
    print_color "cyan" "🎵 启动30秒${task_type}轻音乐提醒..."
    
    # 深夜模式检查 (22:00-8:00)
    if [[ $hour -ge 22 || $hour -le 8 ]]; then
        print_color "purple" "🌙 深夜模式：系统启动完成，播放轻柔提醒..."
        for i in {1..5}; do 
            afplay /System/Library/Sounds/Tink.aiff 2>/dev/null || true
            sleep 1.5
        done
        say "财务管理系统已成功启动，深夜模式激活" --voice="Sin-ji" --rate=120 2>/dev/null || echo "🔊 语音提醒: 系统启动完成"
        return
    fi
    
    case "$task_type" in
        "系统启动")
            print_color "green" "🎼 播放系统启动成功古典轻音乐..."
            play_startup_music
            ;;
        "完全运行")
            print_color "gold" "🎶 播放系统完全运行自然轻音乐..."
            play_running_music
            ;;
    esac
}

# 系统启动音乐
play_startup_music() {
    echo "🎼 播放30秒系统启动古典轻音乐..."
    
    # 创建优美的启动音效序列
    (
        for i in {1..8}; do 
            afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true
            sleep 0.8
        done
    ) &
    
    sleep 2
    say "智能财务管理系统正在启动" --voice="Ting-Ting" --rate=160 2>/dev/null || echo "🔊 系统启动中..." &
    
    sleep 10
    
    (
        for i in {1..6}; do 
            afplay /System/Library/Sounds/Ping.aiff 2>/dev/null || true
            sleep 1.2
        done
    ) &
    
    sleep 3
    say "各项服务正在初始化" --voice="Ting-Ting" --rate=150 2>/dev/null || echo "🔊 服务初始化中..." &
    
    sleep 10
    
    (
        for i in {1..5}; do 
            afplay /System/Library/Sounds/Hero.aiff 2>/dev/null || true
            sleep 1.5
        done
    ) &
    
    sleep 2
    say "系统启动即将完成" --voice="Ting-Ting" --rate=140 2>/dev/null || echo "🔊 启动即将完成..." &
    
    print_color "green" "✅ 30秒系统启动古典轻音乐播放完成"
}

# 系统运行音乐
play_running_music() {
    echo "🎶 播放30秒系统运行自然轻音乐..."
    
    (
        for i in {1..10}; do 
            afplay /System/Library/Sounds/Blow.aiff 2>/dev/null || true
            sleep 2.2
        done
    ) &
    
    sleep 4
    say "智能财务管理系统现在完全运行" --voice="Sin-ji" --rate=140 2>/dev/null || echo "🔊 系统完全运行..." &
    
    sleep 10
    say "所有功能模块已激活，Web界面已就绪" --voice="Sin-ji" --rate=130 2>/dev/null || echo "🔊 功能模块激活..." &
    
    sleep 12
    say "请通过浏览器访问系统开始您的财务管理之旅" --voice="Sin-ji" --rate=120 2>/dev/null || echo "🔊 可以开始使用..." &
    
    print_color "gold" "✅ 30秒系统运行自然轻音乐播放完成"
}

# 主启动函数
main() {
    clear
    print_color "cyan" "
╔══════════════════════════════════════════════════════════════╗
║                🚀 智能财务管理系统启动器 v1.0                  ║
║                   Professional Financial System                ║
╚══════════════════════════════════════════════════════════════╝
"

    print_color "yellow" "🕒 启动时间: $CURRENT_TIME"
    echo ""

    # 1. 环境检查
    print_color "blue" "🔍 第一阶段：环境检查..."
    check_environment
    
    # 2. 设置环境文件
    print_color "blue" "📝 第二阶段：环境配置..."
    setup_env_files
    
    # 3. 安装依赖
    print_color "blue" "📦 第三阶段：依赖管理..."
    install_dependencies
    
    # 4. 启动数据库
    print_color "blue" "🗄️ 第四阶段：数据库服务..."
    start_database
    
    # 5. 启动应用
    print_color "blue" "🚀 第五阶段：应用启动..."
    start_application
    
    # 6. 系统完成
    print_color "green" "🎉 第六阶段：启动完成..."
    launch_complete
}

# 环境检查
check_environment() {
    print_color "yellow" "📋 正在检查系统环境..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        print_color "red" "❌ Docker 未安装，请先安装 Docker"
        exit 1
    fi
    print_color "green" "✅ Docker 已安装"
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_color "red" "❌ Docker Compose 未安装"
        exit 1
    fi
    print_color "green" "✅ Docker Compose 已安装"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        print_color "red" "❌ Node.js 未安装，请安装 Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_color "red" "❌ Node.js 版本过低，需要 18 或更高版本"
        exit 1
    fi
    print_color "green" "✅ Node.js 版本符合要求: $(node -v)"
    
    print_color "green" "🎯 环境检查完成！"
}

# 设置环境文件
setup_env_files() {
    print_color "yellow" "📝 设置环境配置文件..."
    
    # 后端环境文件
    if [ ! -f "backend/.env" ] && [ -f "backend/env.example" ]; then
        print_color "cyan" "📄 创建后端环境配置文件..."
        cp backend/env.example backend/.env
        print_color "green" "✅ 后端 .env 文件已创建"
    fi
    
    print_color "green" "🎯 环境配置完成！"
}

# 安装依赖
install_dependencies() {
    print_color "yellow" "📦 正在安装项目依赖..."
    
    # 安装根目录依赖
    if [ -f "package.json" ]; then
        print_color "cyan" "📋 安装根目录依赖..."
        npm install --silent
        print_color "green" "✅ 根目录依赖安装完成"
    fi
    
    # 安装前端依赖
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_color "cyan" "🎨 安装前端依赖..."
        cd frontend && npm install --silent && cd ..
        print_color "green" "✅ 前端依赖安装完成"
    fi
    
    # 安装后端依赖
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_color "cyan" "⚡ 安装后端依赖..."
        cd backend && npm install --silent && cd ..
        print_color "green" "✅ 后端依赖安装完成"
    fi
    
    print_color "green" "🎯 依赖安装完成！"
}

# 启动数据库
start_database() {
    print_color "yellow" "🗄️ 正在启动数据库服务..."
    
    # 停止旧容器
    print_color "cyan" "🔄 清理旧容器..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # 启动数据库服务
    print_color "cyan" "🚀 启动数据库服务..."
    docker-compose up -d postgres redis
    
    # 等待数据库启动
    print_color "cyan" "⏳ 等待数据库就绪..."
    sleep 15
    
    # 运行数据库迁移
    if [ -d "backend" ]; then
        print_color "cyan" "🔄 运行数据库初始化..."
        cd backend
        npm run db:generate 2>/dev/null || true
        npm run db:migrate 2>/dev/null || true
        npm run db:seed 2>/dev/null || true
        cd ..
    fi
    
    print_color "green" "🎯 数据库服务完成！"
    
    # 播放启动音乐
    play_30s_light_music "系统启动"
}

# 启动应用
start_application() {
    print_color "yellow" "🚀 正在启动应用服务..."
    
    # 启动所有服务
    print_color "cyan" "🌐 启动完整应用堆栈..."
    docker-compose up -d
    
    # 等待服务启动
    print_color "cyan" "⏳ 等待应用完全启动..."
    sleep 10
    
    print_color "green" "🎯 应用服务启动完成！"
}

# 启动完成
launch_complete() {
    print_color "green" "
╔══════════════════════════════════════════════════════════════╗
║                   🎉 系统启动成功！                          ║
║              智能财务管理系统已完全运行                       ║
╚══════════════════════════════════════════════════════════════╝
"

    print_color "cyan" "🌐 服务访问地址："
    echo "   📱 前端界面: http://localhost:3000"
    echo "   🔗 后端API:  http://localhost:8000"
    echo "   📊 API文档:  http://localhost:8000/api/v1/docs"
    echo "   🗄️  数据库管理: http://localhost:5050"
    echo ""
    
    print_color "cyan" "🔑 默认测试账户："
    echo "   📧 邮箱: admin@financial.com"
    echo "   🔒 密码: admin123456"
    echo ""
    
    print_color "cyan" "💡 管理命令："
    echo "   🛑 停止系统: docker-compose down"
    echo "   📊 查看日志: docker-compose logs -f"
    echo "   🔄 重启系统: docker-compose restart"
    echo ""
    
    print_color "yellow" "⏱️ 启动完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 播放完成音乐
    play_30s_light_music "完全运行"
    
    print_color "green" "🚀 智能财务管理系统已准备就绪，祝您使用愉快！"
}

# 信号处理
trap 'print_color "yellow" "\n🛑 启动过程被中断"; exit 130' INT TERM

# 开始执行主函数
main "$@" 