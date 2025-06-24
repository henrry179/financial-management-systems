# 项目量化统计 PowerShell 脚本
# 替代 Node.js 版本的统计工具

param(
    [string]$ConfigPath = "quantification/stats-config.json",
    [string]$OutputDir = "quantification"
)

# 读取配置文件
function Read-StatsConfig {
    param([string]$ConfigPath)
    
    if (Test-Path $ConfigPath) {
        $configContent = Get-Content $ConfigPath -Raw -Encoding UTF8
        return $configContent | ConvertFrom-Json
    } else {
        Write-Host "配置文件不存在: $ConfigPath" -ForegroundColor Red
        exit 1
    }
}

# 检查路径是否被排除
function Test-ExcludedPath {
    param(
        [string]$FilePath,
        [string[]]$ExcludePaths
    )
    
    foreach ($excludePath in $ExcludePaths) {
        if ($FilePath -like "*$excludePath*") {
            return $true
        }
    }
    return $false
}

# 获取文件扩展名或特殊文件类型
function Get-FileExtension {
    param([string]$FileName)
    
    $ext = [System.IO.Path]::GetExtension($FileName).ToLower()
    
    if ($ext) {
        return $ext
    }
    
    # 处理特殊文件
    if ($FileName -eq "Dockerfile" -or $FileName.EndsWith(".dockerfile")) {
        return ".dockerfile"
    }
    if ($FileName -eq "package.json") {
        return ".json"
    }
    if ($FileName.StartsWith(".env")) {
        return ".env"
    }
    
    return ""
}

# 根据扩展名获取语言类型
function Get-LanguageByExtension {
    param(
        [string]$Extension,
        [string]$FileName,
        $FileExtensions
    )
    
    foreach ($language in $FileExtensions.PSObject.Properties.Name) {
        $extensions = $FileExtensions.$language
        if ($extensions -contains $Extension -or $extensions -contains $FileName) {
            return $language
        }
    }
    return "other"
}

# 统计文件行数
function Count-FileLines {
    param([string]$FilePath)
    
    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        if (-not $content) {
            return @{
                total = 0
                code = 0
                comments = 0
                blank = 0
            }
        }
        
        $lines = $content -split "`n"
        $totalLines = $lines.Count
        $codeLines = 0
        $commentLines = 0
        $blankLines = 0
        
        $ext = Get-FileExtension (Split-Path $FilePath -Leaf)
        $isCodeFile = @(".ts", ".tsx", ".js", ".jsx") -contains $ext
        
        foreach ($line in $lines) {
            $trimmedLine = $line.Trim()
            
            if ($trimmedLine -eq "") {
                $blankLines++
            } elseif ($isCodeFile -and (
                $trimmedLine.StartsWith("//") -or 
                $trimmedLine.StartsWith("/*") -or 
                $trimmedLine.StartsWith("*") -or
                $trimmedLine.EndsWith("*/")
            )) {
                $commentLines++
            } elseif ($ext -eq ".md" -or $ext -eq ".html") {
                $codeLines++
            } else {
                $codeLines++
            }
        }
        
        return @{
            total = $totalLines
            code = $codeLines
            comments = $commentLines
            blank = $blankLines
        }
    } catch {
        Write-Warning "无法读取文件 $FilePath : $($_.Exception.Message)"
        return @{
            total = 0
            code = 0
            comments = 0
            blank = 0
        }
    }
}

# 扫描目录
function Scan-Directory {
    param(
        [string]$DirPath,
        [string[]]$ExcludePaths,
        $FileExtensions
    )
    
    $result = @{
        directories = 0
        files = 0
        lines = @{
            total = 0
            code = 0
            comments = 0
            blank = 0
        }
        languages = @{}
        fileTypes = @{}
    }
    
    if (-not (Test-Path $DirPath) -or (Test-ExcludedPath $DirPath $ExcludePaths)) {
        return $result
    }
    
    try {
        $items = Get-ChildItem $DirPath -Force
        
        foreach ($item in $items) {
            if (Test-ExcludedPath $item.FullName $ExcludePaths) {
                continue
            }
            
            if ($item.PSIsContainer) {
                $result.directories++
                $subResult = Scan-Directory $item.FullName $ExcludePaths $FileExtensions
                
                $result.directories += $subResult.directories
                $result.files += $subResult.files
                $result.lines.total += $subResult.lines.total
                $result.lines.code += $subResult.lines.code
                $result.lines.comments += $subResult.lines.comments
                $result.lines.blank += $subResult.lines.blank
                
                # 合并语言统计
                foreach ($lang in $subResult.languages.Keys) {
                    if (-not $result.languages.ContainsKey($lang)) {
                        $result.languages[$lang] = @{ files = 0; lines = 0 }
                    }
                    $result.languages[$lang].files += $subResult.languages[$lang].files
                    $result.languages[$lang].lines += $subResult.languages[$lang].lines
                }
                
                # 合并文件类型统计
                foreach ($type in $subResult.fileTypes.Keys) {
                    if (-not $result.fileTypes.ContainsKey($type)) {
                        $result.fileTypes[$type] = @{ files = 0; lines = 0 }
                    }
                    $result.fileTypes[$type].files += $subResult.fileTypes[$type].files
                    $result.fileTypes[$type].lines += $subResult.fileTypes[$type].lines
                }
                
            } else {
                $result.files++
                
                $lineCount = Count-FileLines $item.FullName
                $result.lines.total += $lineCount.total
                $result.lines.code += $lineCount.code
                $result.lines.comments += $lineCount.comments
                $result.lines.blank += $lineCount.blank
                
                # 统计语言
                $ext = Get-FileExtension $item.Name
                $language = Get-LanguageByExtension $ext $item.Name $FileExtensions
                
                if (-not $result.languages.ContainsKey($language)) {
                    $result.languages[$language] = @{ files = 0; lines = 0 }
                }
                $result.languages[$language].files++
                $result.languages[$language].lines += $lineCount.total
                
                # 统计文件类型
                $fileType = if ($ext) { $ext } else { "no-extension" }
                if (-not $result.fileTypes.ContainsKey($fileType)) {
                    $result.fileTypes[$fileType] = @{ files = 0; lines = 0 }
                }
                $result.fileTypes[$fileType].files++
                $result.fileTypes[$fileType].lines += $lineCount.total
            }
        }
    } catch {
        Write-Warning "扫描目录 $DirPath 时出错: $($_.Exception.Message)"
    }
    
    return $result
}

# 生成Markdown报告
function Generate-MarkdownReport {
    param([hashtable]$Stats)
    
    $markdown = "# 项目量化统计数据`n`n"
    $markdown += "**项目名称**: $($Stats.projectName)`n"
    $markdown += "**最后更新**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
    
    # 总览统计
    $markdown += "## 📊 项目总览`n`n"
    $markdown += "| 指标 | 数量 |`n"
    $markdown += "|------|------|`n"
    $markdown += "| 功能模块 | $($Stats.summary.totalModules) |`n"
    $markdown += "| 文件夹 | $($Stats.summary.totalDirectories) |`n"
    $markdown += "| 文件 | $($Stats.summary.totalFiles) |`n"
    $markdown += "| 总行数 | $($Stats.summary.totalLines.ToString('N0')) |`n"
    $markdown += "| 代码行数 | $($Stats.summary.totalCodeLines.ToString('N0')) |`n"
    $markdown += "| 注释行数 | $($Stats.summary.totalCommentLines.ToString('N0')) |`n"
    $markdown += "| 空行数 | $($Stats.summary.totalBlankLines.ToString('N0')) |`n`n"
    
    # 模块详细统计
    $markdown += "## 🏗️ 功能模块统计`n`n"
    $markdown += "| 模块 | 描述 | 文件夹 | 文件 | 总行数 | 代码行数 |`n"
    $markdown += "|------|------|--------|------|--------|----------|`n"
    
    foreach ($moduleKey in $Stats.modules.Keys) {
        $module = $Stats.modules[$moduleKey]
        $markdown += "| $($module.name) | $($module.description) | $($module.directories) | $($module.files) | $($module.lines.total.ToString('N0')) | $($module.lines.code.ToString('N0')) |`n"
    }
    $markdown += "`n"
    
    # 编程语言统计
    $markdown += "## 💻 编程语言统计`n`n"
    $markdown += "| 语言 | 文件数 | 行数 | 占比 |`n"
    $markdown += "|------|--------|------|------|`n"
    
    $sortedLanguages = $Stats.languages.GetEnumerator() | Sort-Object { $_.Value.lines } -Descending
    foreach ($lang in $sortedLanguages) {
        $percentage = if ($Stats.summary.totalLines -gt 0) { 
            [math]::Round(($lang.Value.lines / $Stats.summary.totalLines) * 100, 1) 
        } else { 0 }
        $markdown += "| $($lang.Key) | $($lang.Value.files) | $($lang.Value.lines.ToString('N0')) | $percentage% |`n"
    }
    $markdown += "`n"
    
    # 文件类型统计
    $markdown += "## 📁 文件类型统计`n`n"
    $markdown += "| 文件类型 | 文件数 | 行数 |`n"
    $markdown += "|----------|--------|------|`n"
    
    $sortedFileTypes = $Stats.fileTypes.GetEnumerator() | Sort-Object { $_.Value.files } -Descending
    foreach ($fileType in $sortedFileTypes) {
        $displayType = if ($fileType.Key -eq "no-extension") { "无扩展名" } else { $fileType.Key }
        $markdown += "| $displayType | $($fileType.Value.files) | $($fileType.Value.lines.ToString('N0')) |`n"
    }
    $markdown += "`n"
    
    return $markdown
}

# 主函数
function Main {
    Write-Host "🚀 开始项目量化统计..." -ForegroundColor Green
    Write-Host ""
    
    # 读取配置
    $config = Read-StatsConfig $ConfigPath
    
    # 初始化统计数据
    $stats = @{
        projectName = $config.projectName
        lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        summary = @{
            totalModules = 0
            totalDirectories = 0
            totalFiles = 0
            totalLines = 0
            totalCodeLines = 0
            totalCommentLines = 0
            totalBlankLines = 0
        }
        modules = @{}
        languages = @{}
        fileTypes = @{}
    }
    
    # 扫描各个模块
    foreach ($moduleKey in $config.modules.PSObject.Properties.Name) {
        $module = $config.modules.$moduleKey
        Write-Host "正在扫描模块: $($module.name)" -ForegroundColor Yellow
        
        $moduleStats = @{
            name = $module.name
            description = $module.description
            directories = 0
            files = 0
            lines = @{
                total = 0
                code = 0
                comments = 0
                blank = 0
            }
            languages = @{}
            fileTypes = @{}
        }
        
        foreach ($modulePath in $module.paths) {
            $excludePaths = if ($module.excludePaths) { $module.excludePaths } else { @() }
            $result = Scan-Directory $modulePath $excludePaths $config.fileExtensions
            
            $moduleStats.directories += $result.directories
            $moduleStats.files += $result.files
            $moduleStats.lines.total += $result.lines.total
            $moduleStats.lines.code += $result.lines.code
            $moduleStats.lines.comments += $result.lines.comments
            $moduleStats.lines.blank += $result.lines.blank
            
            # 合并语言统计
            foreach ($lang in $result.languages.Keys) {
                if (-not $moduleStats.languages.ContainsKey($lang)) {
                    $moduleStats.languages[$lang] = @{ files = 0; lines = 0 }
                }
                $moduleStats.languages[$lang].files += $result.languages[$lang].files
                $moduleStats.languages[$lang].lines += $result.languages[$lang].lines
            }
            
            # 合并文件类型统计
            foreach ($type in $result.fileTypes.Keys) {
                if (-not $moduleStats.fileTypes.ContainsKey($type)) {
                    $moduleStats.fileTypes[$type] = @{ files = 0; lines = 0 }
                }
                $moduleStats.fileTypes[$type].files += $result.fileTypes[$type].files
                $moduleStats.fileTypes[$type].lines += $result.fileTypes[$type].lines
            }
        }
        
        $stats.modules[$moduleKey] = $moduleStats
        
        # 更新总计
        $stats.summary.totalDirectories += $moduleStats.directories
        $stats.summary.totalFiles += $moduleStats.files
        $stats.summary.totalLines += $moduleStats.lines.total
        $stats.summary.totalCodeLines += $moduleStats.lines.code
        $stats.summary.totalCommentLines += $moduleStats.lines.comments
        $stats.summary.totalBlankLines += $moduleStats.lines.blank
        
        # 合并全局语言统计
        foreach ($lang in $moduleStats.languages.Keys) {
            if (-not $stats.languages.ContainsKey($lang)) {
                $stats.languages[$lang] = @{ files = 0; lines = 0 }
            }
            $stats.languages[$lang].files += $moduleStats.languages[$lang].files
            $stats.languages[$lang].lines += $moduleStats.languages[$lang].lines
        }
        
        # 合并全局文件类型统计
        foreach ($type in $moduleStats.fileTypes.Keys) {
            if (-not $stats.fileTypes.ContainsKey($type)) {
                $stats.fileTypes[$type] = @{ files = 0; lines = 0 }
            }
            $stats.fileTypes[$type].files += $moduleStats.fileTypes[$type].files
            $stats.fileTypes[$type].lines += $moduleStats.fileTypes[$type].lines
        }
    }
    
    $stats.summary.totalModules = $stats.modules.Count
    
    # 保存JSON文件
    $jsonPath = Join-Path $OutputDir "project-stats.json"
    $stats | ConvertTo-Json -Depth 10 | Out-File $jsonPath -Encoding UTF8
    Write-Host "JSON统计数据已保存到: $jsonPath" -ForegroundColor Green
    
    # 保存Markdown文件
    $markdownPath = Join-Path $OutputDir "project-stats.md"
    $markdown = Generate-MarkdownReport $stats
    $markdown | Out-File $markdownPath -Encoding UTF8
    Write-Host "Markdown统计表已保存到: $markdownPath" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "✅ 统计完成! 请查看生成的文件:" -ForegroundColor Green
    Write-Host "  - $jsonPath (详细数据)" -ForegroundColor Cyan
    Write-Host "  - $markdownPath (统计表格)" -ForegroundColor Cyan
}

# 运行主函数
Main 