# 项目量化统计

本文件夹包含项目开发过程中的量化统计数据，用于跟踪项目的发展进度和代码规模。

## 文件说明

- `project-stats.json` - 项目统计数据的JSON格式文件
- `project-stats.md` - 项目统计数据的Markdown格式表格
- `update-stats.js` - 自动更新统计数据的脚本
- `stats-config.json` - 统计配置文件

## 使用方法

### 方案1：PowerShell脚本（推荐）
```powershell
# 运行PowerShell统计脚本
powershell -ExecutionPolicy Bypass -File quantification\Update-ProjectStats.ps1
```

### 方案2：批处理脚本（简化版）
```cmd
# 运行简化的批处理统计
quantification\count-files.bat
```

### 方案3：Python脚本（如果有Python环境）
```bash
# 运行Python统计脚本
python quantification/update_stats.py
```

### 方案4：Node.js脚本（原版本，需要Node.js）
```bash
node quantification/update-stats.js
```

### 手动查看统计数据
```bash
# 查看Markdown格式的统计表
cat quantification/project-stats.md

# 查看JSON格式的详细数据
cat quantification/project-stats.json
```

## 统计指标

- 功能模块数量
- 文件夹数量
- 文件数量
- 代码行数（按语言分类）
- 注释行数
- 空行数
- 代码复杂度指标

## 更新频率

建议在以下情况下更新统计数据：
- 完成新功能模块开发
- 重要代码重构
- 版本发布前
- 每周定期更新 