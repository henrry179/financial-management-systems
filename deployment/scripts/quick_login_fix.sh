#!/bin/bash

# 财务管理系统 - 快速登录修复脚本
# 修复时间: 2025-06-29 20:48:58

echo "🔧 财务管理系统登录修复脚本启动..."
echo "================================================"

# 检查Docker状态
echo "📋 1. 检查Docker服务状态..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker服务未启动，正在启动Docker Desktop..."
    open -a Docker
    echo "⏳ 等待Docker启动（30秒）..."
    sleep 30
    
    # 再次检查
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker启动失败，请手动启动Docker Desktop"
        echo "💡 解决方案："
        echo "   1. 打开Docker Desktop应用"
        echo "   2. 等待Docker启动完成"
        echo "   3. 重新运行此脚本"
        exit 1
    fi
fi
echo "✅ Docker服务正常运行"

# 清理旧容器
echo "📋 2. 清理旧容器和网络..."
docker-compose down --remove-orphans 2>/dev/null || true
docker system prune -f 2>/dev/null || true
echo "✅ 清理完成"

# 重建和启动服务
echo "📋 3. 重建并启动系统服务..."
docker-compose up --build -d

# 等待服务启动
echo "📋 4. 等待服务启动完成..."
sleep 30

# 检查服务状态
echo "📋 5. 检查服务运行状态..."
BACKEND_STATUS=$(docker-compose ps backend | grep "Up" || echo "Down")
FRONTEND_STATUS=$(docker-compose ps frontend | grep "Up" || echo "Down")
POSTGRES_STATUS=$(docker-compose ps postgres | grep "Up" || echo "Down")

if [[ $BACKEND_STATUS == *"Up"* ]]; then
    echo "✅ 后端服务: 运行正常"
else
    echo "❌ 后端服务: 启动失败"
fi

if [[ $FRONTEND_STATUS == *"Up"* ]]; then
    echo "✅ 前端服务: 运行正常"
else
    echo "❌ 前端服务: 启动失败"
fi

if [[ $POSTGRES_STATUS == *"Up"* ]]; then
    echo "✅ 数据库服务: 运行正常"
else
    echo "❌ 数据库服务: 启动失败"
fi

# 健康检查
echo "📋 6. 执行系统健康检查..."
echo "正在检查后端API连接..."
for i in {1..10}; do
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ 后端API连接正常"
        break
    fi
    echo "⏳ 等待后端启动... ($i/10)"
    sleep 3
done

echo "正在检查前端服务..."
for i in {1..10}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ 前端服务连接正常"
        break
    fi
    echo "⏳ 等待前端启动... ($i/10)"
    sleep 3
done

# 输出访问信息
echo ""
echo "🎉 系统修复完成！"
echo "================================================"
echo "📱 前端应用: http://localhost:3000"
echo "🔌 后端API:  http://localhost:8000"
echo "🗄️  数据库管理: http://localhost:5050"
echo ""
echo "👤 演示账户："
echo "   邮箱: admin@financial.com"
echo "   密码: admin123456"
echo ""
echo "🔧 如果仍有问题，请检查："
echo "   1. Docker Desktop是否正常运行"
echo "   2. 端口3000, 8000, 5432是否被占用"
echo "   3. 浏览器是否清除了缓存"
echo ""
echo "📊 查看服务状态: docker-compose ps"
echo "📋 查看服务日志: docker-compose logs -f [service_name]"
echo "================================================" 