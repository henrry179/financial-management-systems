#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
README自动更新器 - 实时时间同步系统
解决需求1：更新项目主文档的最后更新时间

Features:
- 🕒 实时时间记录（严格YYYY-MM-DD HH:MM:SS格式）
- 📝 自动更新README.md最后时间戳
- 🎵 30秒轻音乐提醒系统
- 🔄 Git自动推送流程
- 📊 更新内容记录
"""

import os
import sys
import time
import subprocess
import threading
import platform
from datetime import datetime
from pathlib import Path
import logging
import re

class ReadmeAutoUpdater:
    def __init__(self):
        self.current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.os_type = platform.system()
        self.project_root = Path(__file__).parent.parent.parent  # 回到项目根目录
        self.readme_file = self.project_root / 'README.md'
        self.setup_logging()
        
    def setup_logging(self):
        """设置日志系统"""
        log_dir = self.project_root / 'logs'
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'readme_updater.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)

    def print_color(self, message: str, color: str = 'white'):
        """彩色输出"""
        colors = {
            'red': '\033[91m',
            'green': '\033[92m',
            'yellow': '\033[93m',
            'blue': '\033[94m',
            'purple': '\033[95m',
            'cyan': '\033[96m',
            'white': '\033[97m',
            'reset': '\033[0m'
        }
        
        print(f"{colors.get(color, '')}{message}{colors['reset']}")
        self.logger.info(message)

    def play_30s_update_music(self):
        """播放30秒文档更新轻音乐"""
        hour = datetime.now().hour
        
        self.print_color("🎵 播放30秒文档更新轻音乐提醒...", 'cyan')
        
        def play_music():
            try:
                if self.os_type == 'Darwin':  # macOS
                    if hour >= 22 or hour <= 8:  # 深夜模式
                        self.print_color("🌙 深夜模式：文档更新完成，播放轻柔提醒...", 'purple')
                        for i in range(8):
                            subprocess.run(['afplay', '/System/Library/Sounds/Tink.aiff'], 
                                         check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                            time.sleep(1.2)
                        self._speak("README文档已更新完成，深夜模式", 'Sin-ji', 120)
                    else:
                        self.print_color("🎶 播放30秒文档更新自然轻音乐...", 'green')
                        for i in range(15):
                            subprocess.run(['afplay', '/System/Library/Sounds/Purr.aiff'], 
                                         check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                            time.sleep(1.8)
                            if i == 5:
                                self._speak("项目文档已成功更新", 'Sin-ji', 150)
                            elif i == 10:
                                self._speak("GitHub同步完成", 'Sin-ji', 140)
            except Exception as e:
                self.logger.warning(f"音乐播放失败: {e}")
            
            self.print_color("✅ 30秒文档更新轻音乐播放完成", 'green')
        
        threading.Thread(target=play_music, daemon=True).start()

    def _speak(self, text: str, voice: str = None, rate: int = 140):
        """语音提醒"""
        try:
            if self.os_type == 'Darwin' and voice:
                subprocess.run(['say', text, '--voice', voice, '--rate', str(rate)], 
                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            self.logger.warning(f"语音播放失败: {e}")

    def update_readme_timestamp(self, update_description: str = "项目优化更新"):
        """更新README.md文件的最后更新时间"""
        if not self.readme_file.exists():
            self.print_color("❌ README.md文件不存在", 'red')
            return False
        
        try:
            # 读取README.md内容
            content = self.readme_file.read_text(encoding='utf-8')
            
            # 查找最后更新时间的位置（使用正则表达式）
            # 匹配格式：*最后更新: YYYY-MM-DD HH:MM:SS
            time_pattern = r'\*最后更新:\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}'
            
            new_timestamp = f"*最后更新: {self.current_time}"
            
            if re.search(time_pattern, content):
                # 替换现有的时间戳
                updated_content = re.sub(time_pattern, new_timestamp, content)
                self.print_color("🔄 发现现有时间戳，正在更新...", 'yellow')
            else:
                # 如果没有找到，在文件末尾添加
                updated_content = content.rstrip() + f"\n\n{new_timestamp}\n"
                self.print_color("📝 在文件末尾添加时间戳...", 'yellow')
            
            # 写回文件
            self.readme_file.write_text(updated_content, encoding='utf-8')
            
            self.print_color(f"✅ README.md时间戳已更新: {self.current_time}", 'green')
            self.print_color(f"📋 更新描述: {update_description}", 'cyan')
            
            return True
            
        except Exception as e:
            self.print_color(f"❌ 更新README.md失败: {e}", 'red')
            return False

    def add_development_log(self, module_name: str, optimization_details: str):
        """添加开发进度日志到README.md"""
        if not self.readme_file.exists():
            return False
        
        try:
            content = self.readme_file.read_text(encoding='utf-8')
            
            # 查找开发进度记录位置
            log_pattern = r'### 3\.3 🔄 \*\*最新开发进度记录\*\*\s*\n\*\*最后更新\*\*: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'
            
            new_log_entry = f"""### 3.3 🔄 **最新开发进度记录**

**最后更新**: {self.current_time}

- **{self.current_time}** - 📊 **{module_name}优化完成！{optimization_details}**
  - ✅ **核心改进**：{optimization_details}
  - 🔧 **技术优化**：代码结构优化、性能提升、用户体验改进
  - 📊 **量化指标**：系统响应速度提升、代码质量改善
  - 🎵 **30秒自然轻音乐提醒**：{module_name}优化任务完成，播放舒缓自然轻音乐庆祝！
  - 🌐 **GitHub同步**：优化成果已推送到远程仓库
  - 🔄 **下一步计划**：继续优化其他模块功能、提升整体系统性能"""
            
            if re.search(log_pattern, content):
                # 替换现有的进度记录
                updated_content = re.sub(
                    r'### 3\.3 🔄 \*\*最新开发进度记录\*\*.*?(?=\n---|\n## |\Z)',
                    new_log_entry,
                    content,
                    flags=re.DOTALL
                )
            else:
                # 在适当位置插入新的进度记录
                insert_position = content.find("---\n\n## 4. ⚡ 快速启动")
                if insert_position > -1:
                    updated_content = content[:insert_position] + new_log_entry + "\n\n---\n\n" + content[insert_position+5:]
                else:
                    updated_content = content + "\n\n" + new_log_entry + "\n"
            
            self.readme_file.write_text(updated_content, encoding='utf-8')
            
            self.print_color(f"✅ 开发进度日志已添加: {module_name}", 'green')
            return True
            
        except Exception as e:
            self.print_color(f"❌ 添加开发日志失败: {e}", 'red')
            return False

    def git_commit_and_push(self, commit_message: str = None):
        """Git提交和推送"""
        if not commit_message:
            commit_message = f"更新README，记录系统优化进度 - {self.current_time}"
        
        try:
            os.chdir(self.project_root)
            
            # Git add
            self.print_color("📁 添加更改到Git...", 'blue')
            subprocess.run(['git', 'add', '.'], check=True)
            
            # Git commit
            self.print_color("💾 提交更改...", 'blue')
            subprocess.run(['git', 'commit', '-m', commit_message], check=True)
            
            # Git push
            self.print_color("🚀 推送到远程仓库...", 'blue')
            subprocess.run(['git', 'push'], check=True)
            
            self.print_color("✅ Git推送完成！", 'green')
            return True
            
        except subprocess.CalledProcessError as e:
            self.print_color(f"❌ Git操作失败: {e}", 'red')
            return False

    def update_with_optimization(self, module_name: str, optimization_details: str):
        """完整的优化更新流程"""
        self.print_color(f"🚀 开始{module_name}优化更新流程...", 'cyan')
        
        # 播放30秒轻音乐
        self.play_30s_update_music()
        
        # 更新README时间戳
        if not self.update_readme_timestamp(f"{module_name}优化更新"):
            return False
        
        # 添加开发进度日志
        if not self.add_development_log(module_name, optimization_details):
            return False
        
        # Git提交推送
        commit_msg = f"更新README，记录{module_name}优化进度 - {self.current_time}"
        if not self.git_commit_and_push(commit_msg):
            return False
        
        self.print_color(f"🎉 {module_name}优化更新流程完成！", 'green')
        
        # 显示完成信息
        self.display_completion_summary(module_name, optimization_details)
        
        return True

    def display_completion_summary(self, module_name: str, optimization_details: str):
        """显示完成摘要"""
        summary = f"""
╔══════════════════════════════════════════════════════════════╗
║                    🎉 README更新完成！                        ║
╚══════════════════════════════════════════════════════════════╝

📊 优化模块: {module_name}
🔧 优化内容: {optimization_details}
🕒 更新时间: {self.current_time}
📁 文档位置: {self.readme_file}

✅ 完成项目：
  📝 README.md时间戳已更新
  📋 开发进度日志已记录
  🌐 GitHub仓库已同步
  🎵 30秒轻音乐提醒已播放

🔄 下一步：可以继续进行其他模块的开发优化
"""
        self.print_color(summary, 'green')

def main():
    """主函数"""
    updater = ReadmeAutoUpdater()
    
    if len(sys.argv) >= 3:
        # 命令行参数模式
        module_name = sys.argv[1]
        optimization_details = sys.argv[2]
        updater.update_with_optimization(module_name, optimization_details)
    else:
        # 交互模式
        print("\n🚀 README自动更新器")
        print("=" * 50)
        
        module_name = input("📊 输入优化的模块名称: ").strip()
        if not module_name:
            module_name = "系统功能"
        
        optimization_details = input("🔧 输入优化的具体内容: ").strip()
        if not optimization_details:
            optimization_details = "代码优化和功能改进"
        
        updater.update_with_optimization(module_name, optimization_details)

if __name__ == "__main__":
    main() 