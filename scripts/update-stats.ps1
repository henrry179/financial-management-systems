#!/usr/bin/env pwsh

# 项目统计数据更新脚本
# 用法: ./scripts/update-stats.ps1

# 快速更新项目统计数据
# Quick update project statistics

Write-Host "🚀 启动项目量化统计..." -ForegroundColor Green
Write-Host ""

# 检查是否在项目根目录
if (-not (Test-Path "quantification\stats-config.json")) {
    Write-Host "❌ 错误: 请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

# 运行PowerShell统计脚本
try {
    & "quantification\Update-ProjectStats.ps1"
    Write-Host ""
    Write-Host "📊 统计完成！" -ForegroundColor Green
    Write-Host "📁 查看结果:" -ForegroundColor Cyan
    Write-Host "   - quantification\project-stats.json (详细数据)" -ForegroundColor Gray
    Write-Host "   - quantification\project-stats.md (统计报告)" -ForegroundColor Gray
} catch {
    Write-Host "❌ 运行统计时出错: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "💡 提示: 你也可以直接运行:" -ForegroundColor Yellow
Write-Host "   powershell -ExecutionPolicy Bypass -File quantification\Update-ProjectStats.ps1" -ForegroundColor Gray 