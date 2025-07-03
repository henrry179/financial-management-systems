#!/bin/bash

# 快速状态检查脚本
echo "🔍 检查Docker服务状态..."

# 检查Docker是否运行
if docker info &> /dev/null; then
    echo "✅ Docker 运行正常"
else
    echo "❌ Docker 未运行"
    exit 1
fi

# 检查容器状态
echo ""
echo "📦 Docker容器状态:"
docker ps -a --filter "name=financial-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 服务连接测试:"

# 测试前端
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务 (http://localhost:3000) - 可访问"
else
    echo "❌ 前端服务 (http://localhost:3000) - 不可访问"
fi

# 测试后端健康检查
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端健康检查 (http://localhost:8000/health) - 可访问"
else
    echo "❌ 后端健康检查 (http://localhost:8000/health) - 不可访问"
fi

# 测试后端API
if curl -s http://localhost:8000/api/v1/docs > /dev/null; then
    echo "✅ 后端API (http://localhost:8000/api/v1) - 可访问"
else
    echo "❌ 后端API (http://localhost:8000/api/v1) - 不可访问"
fi

echo ""
echo "🎯 如果服务都正常，可以访问:"
echo "   前端界面: http://localhost:3000"
echo "   后端API文档: http://localhost:8000/api/v1/docs"
echo ""
echo "🧪 测试账户:"
echo "   邮箱: admin@financial.com" 
echo "   密码: admin123456" 