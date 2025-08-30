#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ProjectStatsCollector {
    constructor() {
        this.config = this.loadConfig();
        this.stats = {
            projectName: this.config.projectName,
            lastUpdated: new Date().toISOString(),
            summary: {
                totalModules: 0,
                totalDirectories: 0,
                totalFiles: 0,
                totalLines: 0,
                totalCodeLines: 0,
                totalCommentLines: 0,
                totalBlankLines: 0
            },
            modules: {},
            languages: {},
            fileTypes: {}
        };
    }

    loadConfig() {
        const configPath = path.join(__dirname, 'stats-config.json');
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    isExcluded(filePath, excludePaths) {
        return excludePaths.some(excludePath => {
            const fullExcludePath = path.resolve(excludePath);
            const fullFilePath = path.resolve(filePath);
            return fullFilePath.startsWith(fullExcludePath);
        });
    }

    getFileExtension(fileName) {
        const ext = path.extname(fileName).toLowerCase();
        if (ext) return ext;
        
        // 处理无扩展名的特殊文件
        if (fileName === 'Dockerfile' || fileName.endsWith('.dockerfile')) return '.dockerfile';
        if (fileName === 'package.json') return '.json';
        if (fileName.startsWith('.env')) return '.env';
        
        return '';
    }

    getLanguageByExtension(extension, fileName = '') {
        for (const [language, extensions] of Object.entries(this.config.fileExtensions)) {
            if (extensions.includes(extension) || extensions.includes(fileName)) {
                return language;
            }
        }
        return 'other';
    }

    countLines(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            let codeLines = 0;
            let commentLines = 0;
            let blankLines = 0;
            
            const ext = this.getFileExtension(path.basename(filePath));
            const isCodeFile = ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
            
            lines.forEach(line => {
                const trimmedLine = line.trim();
                
                if (trimmedLine === '') {
                    blankLines++;
                } else if (isCodeFile && (
                    trimmedLine.startsWith('//') || 
                    trimmedLine.startsWith('/*') || 
                    trimmedLine.startsWith('*') ||
                    trimmedLine.endsWith('*/')
                )) {
                    commentLines++;
                } else if (ext === '.md' || ext === '.html') {
                    // Markdown和HTML文件全部算作内容行
                    codeLines++;
                } else {
                    codeLines++;
                }
            });
            
            return {
                total: lines.length,
                code: codeLines,
                comments: commentLines,
                blank: blankLines
            };
        } catch (error) {
            console.warn(`无法读取文件 ${filePath}:`, error.message);
            return { total: 0, code: 0, comments: 0, blank: 0 };
        }
    }

    scanDirectory(dirPath, excludePaths = []) {
        const result = {
            directories: 0,
            files: 0,
            lines: { total: 0, code: 0, comments: 0, blank: 0 },
            languages: {},
            fileTypes: {}
        };

        try {
            if (!fs.existsSync(dirPath) || this.isExcluded(dirPath, excludePaths)) {
                return result;
            }

            const items = fs.readdirSync(dirPath);
            
            items.forEach(item => {
                const fullPath = path.join(dirPath, item);
                
                if (this.isExcluded(fullPath, excludePaths)) {
                    return;
                }

                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    result.directories++;
                    const subResult = this.scanDirectory(fullPath, excludePaths);
                    
                    result.directories += subResult.directories;
                    result.files += subResult.files;
                    result.lines.total += subResult.lines.total;
                    result.lines.code += subResult.lines.code;
                    result.lines.comments += subResult.lines.comments;
                    result.lines.blank += subResult.lines.blank;
                    
                    // 合并语言统计
                    Object.keys(subResult.languages).forEach(lang => {
                        if (!result.languages[lang]) {
                            result.languages[lang] = { files: 0, lines: 0 };
                        }
                        result.languages[lang].files += subResult.languages[lang].files;
                        result.languages[lang].lines += subResult.languages[lang].lines;
                    });
                    
                    // 合并文件类型统计
                    Object.keys(subResult.fileTypes).forEach(type => {
                        if (!result.fileTypes[type]) {
                            result.fileTypes[type] = { files: 0, lines: 0 };
                        }
                        result.fileTypes[type].files += subResult.fileTypes[type].files;
                        result.fileTypes[type].lines += subResult.fileTypes[type].lines;
                    });
                    
                } else if (stat.isFile()) {
                    result.files++;
                    
                    const lineCount = this.countLines(fullPath);
                    result.lines.total += lineCount.total;
                    result.lines.code += lineCount.code;
                    result.lines.comments += lineCount.comments;
                    result.lines.blank += lineCount.blank;
                    
                    // 统计语言
                    const ext = this.getFileExtension(item);
                    const language = this.getLanguageByExtension(ext, item);
                    
                    if (!result.languages[language]) {
                        result.languages[language] = { files: 0, lines: 0 };
                    }
                    result.languages[language].files++;
                    result.languages[language].lines += lineCount.total;
                    
                    // 统计文件类型
                    const fileType = ext || 'no-extension';
                    if (!result.fileTypes[fileType]) {
                        result.fileTypes[fileType] = { files: 0, lines: 0 };
                    }
                    result.fileTypes[fileType].files++;
                    result.fileTypes[fileType].lines += lineCount.total;
                }
            });
            
        } catch (error) {
            console.warn(`扫描目录 ${dirPath} 时出错:`, error.message);
        }

        return result;
    }

    collectStats() {
        console.log('开始收集项目统计数据...');
        
        Object.keys(this.config.modules).forEach(moduleKey => {
            const module = this.config.modules[moduleKey];
            console.log(`正在扫描模块: ${module.name}`);
            
            let moduleStats = {
                name: module.name,
                description: module.description,
                directories: 0,
                files: 0,
                lines: { total: 0, code: 0, comments: 0, blank: 0 },
                languages: {},
                fileTypes: {}
            };
            
            module.paths.forEach(modulePath => {
                const result = this.scanDirectory(modulePath, module.excludePaths || []);
                
                moduleStats.directories += result.directories;
                moduleStats.files += result.files;
                moduleStats.lines.total += result.lines.total;
                moduleStats.lines.code += result.lines.code;
                moduleStats.lines.comments += result.lines.comments;
                moduleStats.lines.blank += result.lines.blank;
                
                // 合并语言统计
                Object.keys(result.languages).forEach(lang => {
                    if (!moduleStats.languages[lang]) {
                        moduleStats.languages[lang] = { files: 0, lines: 0 };
                    }
                    moduleStats.languages[lang].files += result.languages[lang].files;
                    moduleStats.languages[lang].lines += result.languages[lang].lines;
                });
                
                // 合并文件类型统计
                Object.keys(result.fileTypes).forEach(type => {
                    if (!moduleStats.fileTypes[type]) {
                        moduleStats.fileTypes[type] = { files: 0, lines: 0 };
                    }
                    moduleStats.fileTypes[type].files += result.fileTypes[type].files;
                    moduleStats.fileTypes[type].lines += result.fileTypes[type].lines;
                });
            });
            
            this.stats.modules[moduleKey] = moduleStats;
            
            // 更新总计
            this.stats.summary.totalDirectories += moduleStats.directories;
            this.stats.summary.totalFiles += moduleStats.files;
            this.stats.summary.totalLines += moduleStats.lines.total;
            this.stats.summary.totalCodeLines += moduleStats.lines.code;
            this.stats.summary.totalCommentLines += moduleStats.lines.comments;
            this.stats.summary.totalBlankLines += moduleStats.lines.blank;
            
            // 合并全局语言统计
            Object.keys(moduleStats.languages).forEach(lang => {
                if (!this.stats.languages[lang]) {
                    this.stats.languages[lang] = { files: 0, lines: 0 };
                }
                this.stats.languages[lang].files += moduleStats.languages[lang].files;
                this.stats.languages[lang].lines += moduleStats.languages[lang].lines;
            });
            
            // 合并全局文件类型统计
            Object.keys(moduleStats.fileTypes).forEach(type => {
                if (!this.stats.fileTypes[type]) {
                    this.stats.fileTypes[type] = { files: 0, lines: 0 };
                }
                this.stats.fileTypes[type].files += moduleStats.fileTypes[type].files;
                this.stats.fileTypes[type].lines += moduleStats.fileTypes[type].lines;
            });
        });
        
        this.stats.summary.totalModules = Object.keys(this.stats.modules).length;
        console.log('统计数据收集完成!');
    }

    saveJSONStats() {
        const outputPath = path.join(__dirname, 'project-stats.json');
        fs.writeFileSync(outputPath, JSON.stringify(this.stats, null, 2), 'utf8');
        console.log(`JSON统计数据已保存到: ${outputPath}`);
    }

    generateMarkdownTable() {
        let markdown = `# 项目量化统计数据\n\n`;
        markdown += `**项目名称**: ${this.stats.projectName}\n`;
        markdown += `**最后更新**: ${new Date(this.stats.lastUpdated).toLocaleString('zh-CN')}\n\n`;
        
        // 总览统计
        markdown += `## 📊 项目总览\n\n`;
        markdown += `| 指标 | 数量 |\n`;
        markdown += `|------|------|\n`;
        markdown += `| 功能模块 | ${this.stats.summary.totalModules} |\n`;
        markdown += `| 文件夹 | ${this.stats.summary.totalDirectories} |\n`;
        markdown += `| 文件 | ${this.stats.summary.totalFiles} |\n`;
        markdown += `| 总行数 | ${this.stats.summary.totalLines.toLocaleString()} |\n`;
        markdown += `| 代码行数 | ${this.stats.summary.totalCodeLines.toLocaleString()} |\n`;
        markdown += `| 注释行数 | ${this.stats.summary.totalCommentLines.toLocaleString()} |\n`;
        markdown += `| 空行数 | ${this.stats.summary.totalBlankLines.toLocaleString()} |\n\n`;
        
        // 模块详细统计
        markdown += `## 🏗️ 功能模块统计\n\n`;
        markdown += `| 模块 | 描述 | 文件夹 | 文件 | 总行数 | 代码行数 |\n`;
        markdown += `|------|------|--------|------|--------|----------|\n`;
        
        Object.keys(this.stats.modules).forEach(moduleKey => {
            const module = this.stats.modules[moduleKey];
            markdown += `| ${module.name} | ${module.description} | ${module.directories} | ${module.files} | ${module.lines.total.toLocaleString()} | ${module.lines.code.toLocaleString()} |\n`;
        });
        markdown += `\n`;
        
        // 编程语言统计
        markdown += `## 💻 编程语言统计\n\n`;
        markdown += `| 语言 | 文件数 | 行数 | 占比 |\n`;
        markdown += `|------|--------|------|------|\n`;
        
        const sortedLanguages = Object.entries(this.stats.languages)
            .sort((a, b) => b[1].lines - a[1].lines);
        
        sortedLanguages.forEach(([language, stats]) => {
            const percentage = ((stats.lines / this.stats.summary.totalLines) * 100).toFixed(1);
            markdown += `| ${language} | ${stats.files} | ${stats.lines.toLocaleString()} | ${percentage}% |\n`;
        });
        markdown += `\n`;
        
        // 文件类型统计
        markdown += `## 📁 文件类型统计\n\n`;
        markdown += `| 文件类型 | 文件数 | 行数 |\n`;
        markdown += `|----------|--------|------|\n`;
        
        const sortedFileTypes = Object.entries(this.stats.fileTypes)
            .sort((a, b) => b[1].files - a[1].files);
        
        sortedFileTypes.forEach(([fileType, stats]) => {
            const displayType = fileType === 'no-extension' ? '无扩展名' : fileType;
            markdown += `| ${displayType} | ${stats.files} | ${stats.lines.toLocaleString()} |\n`;
        });
        markdown += `\n`;
        
        // 各模块语言分布
        markdown += `## 📈 各模块语言分布\n\n`;
        Object.keys(this.stats.modules).forEach(moduleKey => {
            const module = this.stats.modules[moduleKey];
            if (Object.keys(module.languages).length > 0) {
                markdown += `### ${module.name}\n\n`;
                markdown += `| 语言 | 文件数 | 行数 |\n`;
                markdown += `|------|--------|------|\n`;
                
                const sortedModuleLanguages = Object.entries(module.languages)
                    .sort((a, b) => b[1].lines - a[1].lines);
                
                sortedModuleLanguages.forEach(([language, stats]) => {
                    markdown += `| ${language} | ${stats.files} | ${stats.lines.toLocaleString()} |\n`;
                });
                markdown += `\n`;
            }
        });
        
        return markdown;
    }

    saveMarkdownStats() {
        const markdown = this.generateMarkdownTable();
        const outputPath = path.join(__dirname, 'project-stats.md');
        fs.writeFileSync(outputPath, markdown, 'utf8');
        console.log(`Markdown统计表已保存到: ${outputPath}`);
    }

    run() {
        console.log('🚀 开始项目量化统计...\n');
        this.collectStats();
        this.saveJSONStats();
        this.saveMarkdownStats();
        console.log('\n✅ 统计完成! 请查看生成的文件:');
        console.log('  - quantification/project-stats.json (详细数据)');
        console.log('  - quantification/project-stats.md (统计表格)');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const collector = new ProjectStatsCollector();
    collector.run();
}

module.exports = ProjectStatsCollector; 