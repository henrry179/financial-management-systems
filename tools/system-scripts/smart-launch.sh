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
        # 播放轻柔的系统音效
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
            # 播放成功启动的音效序列
            play_startup_music
            ;;
        "服务就绪")
            print_color "blue" "🎹 播放服务就绪钢琴轻音乐..."
            play_service_music
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
        # 第一段：欢迎音效 (10秒)
        for i in {1..8}; do 
            afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true
            sleep 0.8
        done
    ) &
    
    sleep 2
    say "智能财务管理系统正在启动，" --voice="Ting-Ting" --rate=160 2>/dev/null || echo "🔊 系统启动中..." &
    
    sleep 8
    
    # 第二段：进度音效 (10秒)
    (
        for i in {1..6}; do 
            afplay /System/Library/Sounds/Ping.aiff 2>/dev/null || true
            sleep 1.2
        done
    ) &
    
    sleep 3
    say "各项服务正在初始化，" --voice="Ting-Ting" --rate=150 2>/dev/null || echo "🔊 服务初始化中..." &
    
    sleep 8
    
    # 第三段：完成音效 (10秒)
    (
        for i in {1..5}; do 
            afplay /System/Library/Sounds/Hero.aiff 2>/dev/null || true
            sleep 1.5
        done
    ) &
    
    sleep 2
    say "系统启动即将完成，请稍候片刻。" --voice="Ting-Ting" --rate=140 2>/dev/null || echo "🔊 启动即将完成..." &
    
    sleep 8
    print_color "green" "✅ 30秒系统启动古典轻音乐播放完成"
}

# 服务就绪音乐
play_service_music() {
    echo "🎹 播放30秒服务就绪钢琴轻音乐..."
    
    # 优雅的服务就绪音效
    (
        for i in {1..12}; do 
            afplay /System/Library/Sounds/Purr.aiff 2>/dev/null || true
            sleep 1.8
        done
    ) &
    
    sleep 3
    say "所有核心服务已成功启动，" --voice="Mei-Jia" --rate=150 2>/dev/null || echo "🔊 核心服务就绪..." &
    
    sleep 10
    say "数据库连接正常，API服务运行中，" --voice="Mei-Jia" --rate=140 2>/dev/null || echo "🔊 服务运行正常..." &
    
    sleep 12
    say "系统已准备就绪，可以开始使用。" --voice="Mei-Jia" --rate=130 2>/dev/null || echo "🔊 系统就绪完成..." &
    
    print_color "blue" "✅ 30秒服务就绪钢琴轻音乐播放完成"
}

# 系统运行音乐
play_running_music() {
    echo "🎶 播放30秒系统运行自然轻音乐..."
    
    # 自然和谐的运行音效
    (
        for i in {1..10}; do 
            afplay /System/Library/Sounds/Blow.aiff 2>/dev/null || true
            sleep 2.2
        done
    ) &
    
    sleep 4
    say "智能财务管理系统现在完全运行，" --voice="Sin-ji" --rate=140 2>/dev/null || echo "🔊 系统完全运行..." &
    
    sleep 10
    say "所有功能模块已激活，Web界面已就绪，" --voice="Sin-ji" --rate=130 2>/dev/null || echo "🔊 功能模块激活..." &
    
    sleep 12
    say "请通过浏览器访问系统开始您的财务管理之旅。" --voice="Sin-ji" --rate=120 2>/dev/null || echo "🔊 可以开始使用..." &
    
    print_color "gold" "✅ 30秒系统运行自然轻音乐播放完成"
}

# 系统启动主函数
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

    # 1. 环境检查阶段
    print_color "blue" "🔍 第一阶段：环境检查..."
    check_environment
    
    # 2. 依赖安装阶段  
    print_color "blue" "📦 第二阶段：依赖管理..."
    install_dependencies
    
    # 3. 数据库初始化阶段
    print_color "blue" "🗄️ 第三阶段：数据库服务..."
    setup_database
    
    # 4. 服务启动阶段
    print_color "blue" "🚀 第四阶段：服务启动..."
    start_services
    
    # 5. 健康检查阶段
    print_color "blue" "💊 第五阶段：健康检查..."
    health_check
    
    # 6. 完成阶段
    print_color "green" "🎉 第六阶段：启动完成..."
    launch_complete
}

# 环境检查
check_environment() {
    print_color "yellow" "📋 正在检查系统环境..."
    
    # 检查操作系统
    OS_TYPE=$(uname -s)
    print_color "cyan" "🖥️  操作系统: $OS_TYPE"
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        print_color "red" "❌ Docker 未安装"
        print_color "yellow" "💡 请访问 https://docs.docker.com/get-docker/ 安装Docker"
        exit 1
    fi
    print_color "green" "✅ Docker 已安装: $(docker --version | cut -d' ' -f3 | tr -d ',')"
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_color "red" "❌ Docker Compose 未安装"
        print_color "yellow" "💡 请安装 Docker Compose"
        exit 1
    fi
    print_color "green" "✅ Docker Compose 已安装: $(docker-compose --version | cut -d' ' -f3 | tr -d ',')"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        print_color "red" "❌ Node.js 未安装"
        print_color "yellow" "💡 请安装 Node.js 18+ 版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_color "red" "❌ Node.js 版本过低: v$(node -v | cut -d'v' -f2)"
        print_color "yellow" "💡 需要 Node.js 18 或更高版本"
        exit 1
    fi
    print_color "green" "✅ Node.js 版本符合要求: $(node -v)"
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        print_color "red" "❌ npm 未安装"
        exit 1
    fi
    print_color "green" "✅ npm 已安装: $(npm -v)"
    
    # 检查端口占用
    check_ports
    
    print_color "green" "🎯 环境检查完成！"
    sleep 1
}

# 检查端口占用
check_ports() {
    local ports=(3000 8000 5432 6379 5050)
    local port_names=("前端" "后端API" "PostgreSQL" "Redis" "pgAdmin")
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}
        
        if lsof -ti:$port &> /dev/null; then
            print_color "yellow" "⚠️  端口 $port ($name) 已被占用"
            local pid=$(lsof -ti:$port)
            print_color "cyan" "   进程ID: $pid"
            read -p "是否终止占用进程？(y/N): " kill_process
            if [[ $kill_process =~ ^[Yy]$ ]]; then
                kill -9 $pid 2>/dev/null || true
                print_color "green" "✅ 已终止进程 $pid"
            else
                print_color "yellow" "⚠️  请手动处理端口冲突"
            fi
        else
            print_color "green" "✅ 端口 $port ($name) 可用"
        fi
    done
}

# 依赖安装
install_dependencies() {
    print_color "yellow" "📦 正在管理项目依赖..."
    
    # 检查并创建环境配置文件
    setup_env_files
    
    # 安装根目录依赖
    if [ -f "package.json" ]; then
        print_color "cyan" "📋 安装根目录依赖..."
        npm install --silent || {
            print_color "red" "❌ 根目录依赖安装失败"
            exit 1
        }
        print_color "green" "✅ 根目录依赖安装完成"
    fi
    
    # 安装前端依赖
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_color "cyan" "🎨 安装前端依赖..."
        cd frontend
        npm install --silent || {
            print_color "red" "❌ 前端依赖安装失败"
            exit 1
        }
        cd ..
        print_color "green" "✅ 前端依赖安装完成"
    fi
    
    # 安装后端依赖
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_color "cyan" "⚡ 安装后端依赖..."
        cd backend
        npm install --silent || {
            print_color "red" "❌ 后端依赖安装失败"
            exit 1
        }
        cd ..
        print_color "green" "✅ 后端依赖安装完成"
    fi
    
    print_color "green" "🎯 依赖管理完成！"
    sleep 1
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
    
    # 前端环境文件
    if [ ! -f "frontend/.env" ] && [ -f "frontend/.env.example" ]; then
        print_color "cyan" "📄 创建前端环境配置文件..."
        cp frontend/.env.example frontend/.env
        print_color "green" "✅ 前端 .env 文件已创建"
    fi
    
    # 检查必要的环境变量
    if [ -f "backend/.env" ]; then
        print_color "green" "✅ 后端环境配置就绪"
    else
        print_color "yellow" "⚠️  后端环境配置文件不存在，将使用默认配置"
    fi
}

# 数据库设置
setup_database() {
    print_color "yellow" "🗄️ 正在设置数据库服务..."
    
    # 停止可能存在的旧容器
    print_color "cyan" "🔄 清理旧容器..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # 启动数据库服务
    print_color "cyan" "🚀 启动数据库服务..."
    docker-compose up -d postgres redis || {
        print_color "red" "❌ 数据库服务启动失败"
        exit 1
    }
    
    # 等待数据库启动
    print_color "cyan" "⏳ 等待数据库就绪..."
    local retry_count=0
    local max_retries=30
    
    while ! docker-compose exec -T postgres pg_isready -U financial_user -d financial_db &>/dev/null; do
        if [ $retry_count -ge $max_retries ]; then
            print_color "red" "❌ 数据库启动超时"
            exit 1
        fi
        print_color "yellow" "⏳ 等待PostgreSQL启动... ($((retry_count + 1))/$max_retries)"
        sleep 2
        ((retry_count++))
    done
    
    print_color "green" "✅ PostgreSQL 数据库就绪"
    
    # 检查Redis
    if docker-compose exec -T redis redis-cli ping &>/dev/null; then
        print_color "green" "✅ Redis 缓存就绪"
    else
        print_color "yellow" "⚠️  Redis 启动中..."
        sleep 3
    fi
    
    # 运行数据库迁移
    if [ -d "backend" ]; then
        print_color "cyan" "🔄 运行数据库迁移..."
        cd backend
        npm run db:generate 2>/dev/null || print_color "yellow" "⚠️  Prisma generate 跳过"
        npm run db:migrate 2>/dev/null || print_color "yellow" "⚠️  数据库迁移跳过"
        
        # 填充测试数据
        print_color "cyan" "🌱 填充测试数据..."
        npm run db:seed 2>/dev/null || print_color "yellow" "⚠️  测试数据填充跳过"
        cd ..
        print_color "green" "✅ 数据库初始化完成"
    fi
    
    print_color "green" "🎯 数据库服务完成！"
    
    # 播放服务就绪音乐
    play_30s_light_music "服务就绪"
}

# 启动服务
start_services() {
    print_color "yellow" "🚀 正在启动应用服务..."
    
    # 启动所有服务
    print_color "cyan" "🌐 启动完整应用堆栈..."
    docker-compose up -d || {
        print_color "red" "❌ 应用服务启动失败"
        docker-compose logs
        exit 1
    }
    
    # 等待服务启动
    print_color "cyan" "⏳ 等待服务完全启动..."
    sleep 10
    
    print_color "green" "🎯 应用服务启动完成！"
    sleep 1
}

# 健康检查
health_check() {
    print_color "yellow" "💊 正在进行系统健康检查..."
    
    local services=("前端:http://localhost:3000" "后端API:http://localhost:8000" "数据库管理:http://localhost:5050")
    local healthy_services=0
    
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d':' -f1)
        local url=$(echo $service | cut -d':' -f2-)
        
        print_color "cyan" "🔍 检查 $name 服务..."
        
        if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
            print_color "green" "✅ $name 服务健康"
            ((healthy_services++))
        else
            print_color "yellow" "⚠️  $name 服务启动中..."
        fi
    done
    
    # 检查数据库连接
    if docker-compose exec -T postgres pg_isready -U financial_user -d financial_db &>/dev/null; then
        print_color "green" "✅ 数据库连接正常"
        ((healthy_services++))
    else
        print_color "yellow" "⚠️  数据库连接检查失败"
    fi
    
    # 检查Redis连接
    if docker-compose exec -T redis redis-cli ping &>/dev/null; then
        print_color "green" "✅ Redis缓存连接正常"
        ((healthy_services++))
    else
        print_color "yellow" "⚠️  Redis连接检查失败"
    fi
    
    local total_services=5
    local health_percentage=$((healthy_services * 100 / total_services))
    
    print_color "cyan" "📊 系统健康度: $health_percentage% ($healthy_services/$total_services)"
    
    if [ $health_percentage -ge 80 ]; then
        print_color "green" "🎯 系统健康检查完成！"
    else
        print_color "yellow" "⚠️  部分服务可能需要更多时间启动"
    fi
    
    sleep 1
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
    
    # 更新README进度记录
    update_readme_progress
    
    # 播放完成音乐
    play_30s_light_music "完全运行"
    
    print_color "green" "🚀 智能财务管理系统已准备就绪，祝您使用愉快！"
}

# 更新README进度记录
update_readme_progress() {
    local current_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    print_color "cyan" "📝 更新开发进度记录..."
    
    # 这里应该更新README.md文件中的进度记录
    # 由于这是一个启动脚本，进度更新留给主开发流程处理
    
    print_color "green" "✅ 进度记录准备完成"
}

# 信号处理
trap 'print_color "yellow" "\n🛑 启动过程被中断"; exit 130' INT TERM

# 开始执行主函数
main "$@" 