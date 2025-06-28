#!/bin/bash
# Docker网络连接修复脚本 v1.0
# 解决Docker Hub连接问题

echo "🔧 Docker网络连接修复脚本启动..."
echo "⏱️  执行时间: $(date '+%Y-%m-%d %H:%M:%S')"

# 检查Docker状态
echo "📊 检查Docker服务状态..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker服务未运行，请启动Docker Desktop"
    exit 1
fi

echo "✅ Docker服务正常运行"

# 配置Docker镜像加速器
echo "🚀 配置Docker镜像加速器..."

# 创建或备份daemon.json
DOCKER_CONFIG_DIR="$HOME/.docker"
DAEMON_JSON="$DOCKER_CONFIG_DIR/daemon.json"

mkdir -p "$DOCKER_CONFIG_DIR"

if [ -f "$DAEMON_JSON" ]; then
    echo "📋 备份现有配置..."
    cp "$DAEMON_JSON" "$DAEMON_JSON.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 创建新的daemon.json配置
cat > "$DAEMON_JSON" << 'EOF'
{
  "registry-mirrors": [
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://dockerproxy.com",
    "https://ccr.ccs.tencentyun.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false,
  "features": {
    "buildkit": true
  },
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
}
EOF

echo "✅ Docker镜像加速器配置完成"
echo "📄 配置文件位置: $DAEMON_JSON"

# 重启Docker Desktop (macOS)
echo "🔄 重启Docker Desktop..."
echo "请在Docker Desktop重启后运行系统启动器"

osascript << 'APPLESCRIPT'
tell application "Docker Desktop"
    quit
end tell

delay 5

tell application "Docker Desktop"
    activate
end tell
APPLESCRIPT

echo "⏳ 等待Docker Desktop重启..."
sleep 10

# 等待Docker服务就绪
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker info > /dev/null 2>&1; then
        echo "✅ Docker服务重启成功"
        break
    fi
    
    echo "⏳ 等待Docker服务启动... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Docker服务重启超时，请手动重启Docker Desktop"
    exit 1
fi

# 测试镜像拉取
echo "🧪 测试镜像拉取..."
if docker pull hello-world > /dev/null 2>&1; then
    echo "✅ 镜像拉取测试成功"
    docker rmi hello-world > /dev/null 2>&1
else
    echo "⚠️  镜像拉取可能仍有问题，但配置已更新"
fi

echo "🎯 Docker网络修复完成！"
echo "💡 现在可以运行: python launch_system.py"

# 30秒轻音乐提醒
echo "🎵 播放30秒网络修复完成提醒音乐..."
for i in {1..8}; do
    afplay /System/Library/Sounds/Glass.aiff > /dev/null 2>&1 &
    sleep 2
    if [ $i -eq 3 ]; then
        say "Docker网络连接已修复" --voice="Ting-Ting" --rate=160 > /dev/null 2>&1 &
    elif [ $i -eq 6 ]; then
        say "现在可以启动财务管理系统" --voice="Ting-Ting" --rate=150 > /dev/null 2>&1 &
    fi
done

echo "✅ 修复完成，请尝试重新运行系统启动器" 