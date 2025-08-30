#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
项目量化统计 Python 脚本
替代 Node.js 版本的统计工具
"""

import os
import json
import time
from pathlib import Path
from collections import defaultdict
import sys

class ProjectStatsCollector:
    def __init__(self, config_path="quantification/stats-config.json"):
        self.config_path = config_path
        self.config = self.load_config()
        self.stats = {
            "projectName": self.config["projectName"],
            "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "summary": {
                "totalModules": 0,
                "totalDirectories": 0,
                "totalFiles": 0,
                "totalLines": 0,
                "totalCodeLines": 0,
                "totalCommentLines": 0,
                "totalBlankLines": 0
            },
            "modules": {},
            "languages": defaultdict(lambda: {"files": 0, "lines": 0}),
            "fileTypes": defaultdict(lambda: {"files": 0, "lines": 0})
        }

    def load_config(self):
        """加载配置文件"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"配置文件不存在: {self.config_path}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"配置文件格式错误: {e}")
            sys.exit(1)

    def is_excluded(self, file_path, exclude_paths):
        """检查路径是否被排除"""
        file_path = os.path.normpath(file_path)
        for exclude_path in exclude_paths:
            exclude_path = os.path.normpath(exclude_path)
            if exclude_path in file_path:
                return True
        return False

    def get_file_extension(self, filename):
        """获取文件扩展名或特殊文件类型"""
        ext = Path(filename).suffix.lower()
        
        if ext:
            return ext
            
        # 处理特殊文件
        if filename == "Dockerfile" or filename.endswith(".dockerfile"):
            return ".dockerfile"
        if filename == "package.json":
            return ".json"
        if filename.startswith(".env"):
            return ".env"
            
        return ""

    def get_language_by_extension(self, extension, filename=""):
        """根据扩展名获取语言类型"""
        for language, extensions in self.config["fileExtensions"].items():
            if extension in extensions or filename in extensions:
                return language
        return "other"

    def count_lines(self, file_path):
        """统计文件行数"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            if not content:
                return {"total": 0, "code": 0, "comments": 0, "blank": 0}
                
            lines = content.split('\n')
            total_lines = len(lines)
            code_lines = 0
            comment_lines = 0
            blank_lines = 0
            
            ext = self.get_file_extension(os.path.basename(file_path))
            is_code_file = ext in [".ts", ".tsx", ".js", ".jsx"]
            
            for line in lines:
                trimmed_line = line.strip()
                
                if trimmed_line == "":
                    blank_lines += 1
                elif is_code_file and (
                    trimmed_line.startswith("//") or 
                    trimmed_line.startswith("/*") or 
                    trimmed_line.startswith("*") or
                    trimmed_line.endswith("*/")
                ):
                    comment_lines += 1
                elif ext in [".md", ".html"]:
                    code_lines += 1
                else:
                    code_lines += 1
            
            return {
                "total": total_lines,
                "code": code_lines,
                "comments": comment_lines,
                "blank": blank_lines
            }
        except Exception as e:
            print(f"警告: 无法读取文件 {file_path}: {e}")
            return {"total": 0, "code": 0, "comments": 0, "blank": 0}

    def scan_directory(self, dir_path, exclude_paths=None):
        """扫描目录"""
        if exclude_paths is None:
            exclude_paths = []
            
        result = {
            "directories": 0,
            "files": 0,
            "lines": {"total": 0, "code": 0, "comments": 0, "blank": 0},
            "languages": defaultdict(lambda: {"files": 0, "lines": 0}),
            "fileTypes": defaultdict(lambda: {"files": 0, "lines": 0})
        }
        
        if not os.path.exists(dir_path) or self.is_excluded(dir_path, exclude_paths):
            return result
            
        try:
            for root, dirs, files in os.walk(dir_path):
                # 过滤排除的目录
                dirs[:] = [d for d in dirs if not self.is_excluded(os.path.join(root, d), exclude_paths)]
                
                # 统计目录数
                result["directories"] += len(dirs)
                
                # 统计文件
                for file in files:
                    file_path = os.path.join(root, file)
                    
                    if self.is_excluded(file_path, exclude_paths):
                        continue
                        
                    result["files"] += 1
                    
                    # 统计行数
                    line_count = self.count_lines(file_path)
                    result["lines"]["total"] += line_count["total"]
                    result["lines"]["code"] += line_count["code"]
                    result["lines"]["comments"] += line_count["comments"]
                    result["lines"]["blank"] += line_count["blank"]
                    
                    # 统计语言
                    ext = self.get_file_extension(file)
                    language = self.get_language_by_extension(ext, file)
                    
                    result["languages"][language]["files"] += 1
                    result["languages"][language]["lines"] += line_count["total"]
                    
                    # 统计文件类型
                    file_type = ext if ext else "no-extension"
                    result["fileTypes"][file_type]["files"] += 1
                    result["fileTypes"][file_type]["lines"] += line_count["total"]
                    
        except Exception as e:
            print(f"警告: 扫描目录 {dir_path} 时出错: {e}")
            
        return result

    def collect_stats(self):
        """收集统计数据"""
        print("🚀 开始收集项目统计数据...")
        
        for module_key, module in self.config["modules"].items():
            print(f"正在扫描模块: {module['name']}")
            
            module_stats = {
                "name": module["name"],
                "description": module["description"],
                "directories": 0,
                "files": 0,
                "lines": {"total": 0, "code": 0, "comments": 0, "blank": 0},
                "languages": defaultdict(lambda: {"files": 0, "lines": 0}),
                "fileTypes": defaultdict(lambda: {"files": 0, "lines": 0})
            }
            
            for module_path in module["paths"]:
                exclude_paths = module.get("excludePaths", [])
                result = self.scan_directory(module_path, exclude_paths)
                
                module_stats["directories"] += result["directories"]
                module_stats["files"] += result["files"]
                module_stats["lines"]["total"] += result["lines"]["total"]
                module_stats["lines"]["code"] += result["lines"]["code"]
                module_stats["lines"]["comments"] += result["lines"]["comments"]
                module_stats["lines"]["blank"] += result["lines"]["blank"]
                
                # 合并语言统计
                for lang, stats in result["languages"].items():
                    module_stats["languages"][lang]["files"] += stats["files"]
                    module_stats["languages"][lang]["lines"] += stats["lines"]
                    
                # 合并文件类型统计
                for file_type, stats in result["fileTypes"].items():
                    module_stats["fileTypes"][file_type]["files"] += stats["files"]
                    module_stats["fileTypes"][file_type]["lines"] += stats["lines"]
            
            # 转换为普通字典
            module_stats["languages"] = dict(module_stats["languages"])
            module_stats["fileTypes"] = dict(module_stats["fileTypes"])
            
            self.stats["modules"][module_key] = module_stats
            
            # 更新总计
            self.stats["summary"]["totalDirectories"] += module_stats["directories"]
            self.stats["summary"]["totalFiles"] += module_stats["files"]
            self.stats["summary"]["totalLines"] += module_stats["lines"]["total"]
            self.stats["summary"]["totalCodeLines"] += module_stats["lines"]["code"]
            self.stats["summary"]["totalCommentLines"] += module_stats["lines"]["comments"]
            self.stats["summary"]["totalBlankLines"] += module_stats["lines"]["blank"]
            
            # 合并全局语言统计
            for lang, stats in module_stats["languages"].items():
                self.stats["languages"][lang]["files"] += stats["files"]
                self.stats["languages"][lang]["lines"] += stats["lines"]
                
            # 合并全局文件类型统计
            for file_type, stats in module_stats["fileTypes"].items():
                self.stats["fileTypes"][file_type]["files"] += stats["files"]
                self.stats["fileTypes"][file_type]["lines"] += stats["lines"]
        
        self.stats["summary"]["totalModules"] = len(self.stats["modules"])
        
        # 转换为普通字典
        self.stats["languages"] = dict(self.stats["languages"])
        self.stats["fileTypes"] = dict(self.stats["fileTypes"])
        
        print("✅ 统计数据收集完成!")

    def save_json_stats(self, output_dir="quantification"):
        """保存JSON统计数据"""
        output_path = os.path.join(output_dir, "project-stats.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.stats, f, ensure_ascii=False, indent=2)
        print(f"JSON统计数据已保存到: {output_path}")

    def generate_markdown_report(self):
        """生成Markdown报告"""
        md = f"# 项目量化统计数据\n\n"
        md += f"**项目名称**: {self.stats['projectName']}\n"
        md += f"**最后更新**: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # 总览统计
        md += "## 📊 项目总览\n\n"
        md += "| 指标 | 数量 |\n"
        md += "|------|------|\n"
        md += f"| 功能模块 | {self.stats['summary']['totalModules']} |\n"
        md += f"| 文件夹 | {self.stats['summary']['totalDirectories']} |\n"
        md += f"| 文件 | {self.stats['summary']['totalFiles']} |\n"
        md += f"| 总行数 | {self.stats['summary']['totalLines']:,} |\n"
        md += f"| 代码行数 | {self.stats['summary']['totalCodeLines']:,} |\n"
        md += f"| 注释行数 | {self.stats['summary']['totalCommentLines']:,} |\n"
        md += f"| 空行数 | {self.stats['summary']['totalBlankLines']:,} |\n\n"
        
        # 模块详细统计
        md += "## 🏗️ 功能模块统计\n\n"
        md += "| 模块 | 描述 | 文件夹 | 文件 | 总行数 | 代码行数 |\n"
        md += "|------|------|--------|------|--------|----------|\n"
        
        for module in self.stats["modules"].values():
            md += f"| {module['name']} | {module['description']} | {module['directories']} | {module['files']} | {module['lines']['total']:,} | {module['lines']['code']:,} |\n"
        md += "\n"
        
        # 编程语言统计
        md += "## 💻 编程语言统计\n\n"
        md += "| 语言 | 文件数 | 行数 | 占比 |\n"
        md += "|------|--------|------|------|\n"
        
        sorted_languages = sorted(self.stats["languages"].items(), key=lambda x: x[1]["lines"], reverse=True)
        for language, stats in sorted_languages:
            percentage = (stats["lines"] / self.stats["summary"]["totalLines"] * 100) if self.stats["summary"]["totalLines"] > 0 else 0
            md += f"| {language} | {stats['files']} | {stats['lines']:,} | {percentage:.1f}% |\n"
        md += "\n"
        
        # 文件类型统计
        md += "## 📁 文件类型统计\n\n"
        md += "| 文件类型 | 文件数 | 行数 |\n"
        md += "|----------|--------|------|\n"
        
        sorted_file_types = sorted(self.stats["fileTypes"].items(), key=lambda x: x[1]["files"], reverse=True)
        for file_type, stats in sorted_file_types:
            display_type = "无扩展名" if file_type == "no-extension" else file_type
            md += f"| {display_type} | {stats['files']} | {stats['lines']:,} |\n"
        md += "\n"
        
        return md

    def save_markdown_stats(self, output_dir="quantification"):
        """保存Markdown统计表"""
        markdown = self.generate_markdown_report()
        output_path = os.path.join(output_dir, "project-stats.md")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(markdown)
        print(f"Markdown统计表已保存到: {output_path}")

    def run(self):
        """运行统计"""
        print("🚀 开始项目量化统计...\n")
        self.collect_stats()
        self.save_json_stats()
        self.save_markdown_stats()
        print("\n✅ 统计完成! 请查看生成的文件:")
        print("  - quantification/project-stats.json (详细数据)")
        print("  - quantification/project-stats.md (统计表格)")

if __name__ == "__main__":
    collector = ProjectStatsCollector()
    collector.run() 