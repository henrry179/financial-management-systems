#!/bin/bash

# 项目统计数据更新脚本
# 用法: ./scripts/update-stats.sh

echo "🚀 开始更新项目量化统计数据..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js版本: $NODE_VERSION"

# 获取脚本所在目录的上级目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 项目根目录: $PROJECT_ROOT"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 检查量化统计脚本是否存在
STATS_SCRIPT="$PROJECT_ROOT/quantification/update-stats.js"
if [ ! -f "$STATS_SCRIPT" ]; then
    echo "❌ 错误: 找不到统计脚本 $STATS_SCRIPT"
    exit 1
fi

echo "📊 正在执行统计脚本..."

# 运行统计脚本
if node "$STATS_SCRIPT"; then
    echo ""
    echo "✅ 统计数据更新完成!"
    echo ""
    echo "📄 生成的文件:"
    echo "  - quantification/project-stats.json (详细JSON数据)"
    echo "  - quantification/project-stats.md (Markdown统计表)"
    echo ""
    echo "💡 查看统计结果:"
    echo "  cat quantification/project-stats.md"
    echo ""
    
    # 显示简要统计信息
    if [ -f "quantification/project-stats.json" ]; then
        echo "📈 项目概览:"
        
        # 使用node来解析JSON（更跨平台）
        node -e "
            const fs = require('fs');
            const stats = JSON.parse(fs.readFileSync('quantification/project-stats.json', 'utf8'));
            console.log('  功能模块:', stats.summary.totalModules);
            console.log('  文件夹:', stats.summary.totalDirectories);
            console.log('  文件:', stats.summary.totalFiles);
            console.log('  总行数:', stats.summary.totalLines.toLocaleString());
            console.log('  代码行数:', stats.summary.totalCodeLines.toLocaleString());
        "
    fi
    
    echo ""
    echo "🎉 统计数据更新完成!"
else
    echo "❌ 统计脚本执行失败"
    exit 1
fi 