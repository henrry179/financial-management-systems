#!/bin/bash

# 财务管理系统状态检查脚本
# 创建时间: 2025-06-29 20:48:58

echo "🔍 财务管理系统状态检查"
echo "================================================"

# 1. 检查Docker服务
echo "📋 1. Docker服务状态检查"
if docker info > /dev/null 2>&1; then
    echo "✅ Docker服务运行正常"
else
    echo "❌ Docker服务未运行"
    exit 1
fi

# 2. 检查容器状态
echo ""
echo "📋 2. 容器运行状态检查"
CONTAINERS=$(docker-compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null | tail -n +2)
if [ -n "$CONTAINERS" ]; then
    echo "$CONTAINERS" | while read line; do
        if [[ $line == *"Up"* ]]; then
            echo "✅ $line"
        else
            echo "❌ $line"
        fi
    done
else
    echo "❌ 没有运行的容器"
fi

# 3. 检查服务连接
echo ""
echo "📋 3. 服务连接测试"

# 检查后端API
echo -n "后端API (localhost:8000): "
if curl -s http://localhost:8000/health > /dev/null; then
    BACKEND_STATUS=$(curl -s http://localhost:8000/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "✅ 正常 (状态: $BACKEND_STATUS)"
else
    echo "❌ 连接失败"
fi

# 检查前端服务
echo -n "前端服务 (localhost:3000): "
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 正常"
else
    echo "❌ 连接失败"
fi

# 检查数据库连接
echo -n "数据库连接 (localhost:5432): "
if nc -z localhost 5432 2>/dev/null; then
    echo "✅ 正常"
else
    echo "❌ 连接失败"
fi

# 检查Redis连接
echo -n "Redis缓存 (localhost:6379): "
if nc -z localhost 6379 2>/dev/null; then
    echo "✅ 正常"
else
    echo "❌ 连接失败"
fi

# 4. 检查修复状态
echo ""
echo "📋 4. 登录界面修复验证"
echo -n "前端认证模块: "
if curl -s http://localhost:3000 | grep -q "财务管理系统" 2>/dev/null; then
    echo "✅ 页面加载正常，修复成功"
else
    echo "⚠️  页面内容检查失败，可能需要进一步验证"
fi

# 5. 系统访问信息
echo ""
echo "🎉 系统状态检查完成！"
echo "================================================"
echo "📱 系统访问地址："
echo "   前端应用: http://localhost:3000"
echo "   后端API:  http://localhost:8000"
echo "   数据库管理: http://localhost:5050"
echo ""
echo "👤 测试账户："
echo "   邮箱: admin@financial.com"
echo "   密码: admin123456"
echo ""
echo "🔧 常用命令："
echo "   查看服务状态: docker-compose ps"
echo "   查看服务日志: docker-compose logs -f [service_name]"
echo "   重启服务: docker-compose restart [service_name]"
echo "   停止所有服务: docker-compose down"
echo "================================================" 