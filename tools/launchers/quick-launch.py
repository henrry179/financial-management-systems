#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
财务管理系统 - 快速启动器
Quick Launcher for Financial Management System

整合两大核心功能：
1. README自动更新器 - 自动更新文档时间戳和开发进度
2. 三模式启动系统 - a模式（本地）、b模式（Docker）、c模式（混合）

🎯 快速入口，一键开始！
"""

import os
import sys
import subprocess
from pathlib import Path

def clear_screen():
    """清屏"""
    os.system('clear' if os.name != 'nt' else 'cls')

def print_banner():
    """显示主横幅"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║           🚀 智能财务管理系统 - 快速启动器 v1.0              ║
║              Financial System Quick Launcher                 ║
╚══════════════════════════════════════════════════════════════╝

🎯 请选择操作：

┌─────────────────────────────────────────────────────────────┐
│  1️⃣  启动系统 - 三模式选择器                                │
│     ├─ a模式 🏠 本地部署方式（快速开发）                    │
│     ├─ b模式 🐳 Docker镜像模式（生产环境）                  │
│     └─ c模式 ⚡ 混合模式（高级开发）                        │
├─────────────────────────────────────────────────────────────┤
│  2️⃣  更新文档 - README自动更新器                            │
│     ├─ 📝 自动更新最后时间戳                                │
│     ├─ 📊 记录开发进度日志                                  │
│     └─ 🔄 Git自动推送到GitHub                               │
├─────────────────────────────────────────────────────────────┤
│  3️⃣  查看指南 - 系统使用文档                                │
│     └─ 📋 详细使用说明和故障排除                            │
├─────────────────────────────────────────────────────────────┤
│  q   退出程序                                                │
└─────────────────────────────────────────────────────────────┘
"""
    print(banner)

def launch_three_mode_system():
    """启动三模式系统"""
    print("\n🚀 启动三模式系统选择器...")
    script_path = Path(__file__).parent / 'deployment' / 'scripts' / 'three_mode_launcher.py'
    
    if not script_path.exists():
        print("❌ 三模式启动脚本不存在")
        return False
    
    try:
        subprocess.run([sys.executable, str(script_path)], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 启动失败: {e}")
        return False
    except KeyboardInterrupt:
        print("\n👋 用户取消启动")
        return True

def update_readme():
    """更新README文档"""
    print("\n📝 README自动更新器")
    print("=" * 50)
    
    # 获取用户输入
    module_name = input("📊 输入优化的模块名称（回车使用默认）: ").strip()
    if not module_name:
        module_name = "系统功能"
    
    optimization_details = input("🔧 输入优化的具体内容（回车使用默认）: ").strip()
    if not optimization_details:
        optimization_details = "代码优化和功能改进"
    
    # 调用README更新器
    script_path = Path(__file__).parent / 'deployment' / 'scripts' / 'auto_update_readme.py'
    
    if not script_path.exists():
        print("❌ README更新脚本不存在")
        return False
    
    try:
        subprocess.run([sys.executable, str(script_path), module_name, optimization_details], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 更新失败: {e}")
        return False
    except KeyboardInterrupt:
        print("\n👋 用户取消更新")
        return True

def show_guide():
    """显示使用指南"""
    guide_path = Path(__file__).parent / 'docs' / 'SYSTEM_LAUNCH_GUIDE.md'
    
    if guide_path.exists():
        print("\n📋 正在打开系统启动与文档更新指南...")
        try:
            # 尝试使用系统默认程序打开文档
            if sys.platform == 'darwin':  # macOS
                subprocess.run(['open', str(guide_path)])
            elif sys.platform == 'win32':  # Windows
                subprocess.run(['start', str(guide_path)], shell=True)
            else:  # Linux
                subprocess.run(['xdg-open', str(guide_path)])
            
            print("✅ 指南文档已在默认程序中打开")
        except Exception as e:
            print(f"⚠️  无法自动打开，请手动查看: {guide_path}")
            print(f"错误: {e}")
    else:
        print("❌ 指南文档不存在")
        
    print("\n🔗 在线文档地址:")
    print("📖 项目文档: docs/SYSTEM_LAUNCH_GUIDE.md")
    print("📊 项目README: README.md")
    
    input("\n按回车键返回主菜单...")

def main():
    """主程序"""
    while True:
        clear_screen()
        print_banner()
        
        try:
            choice = input("请选择操作 (1/2/3/q): ").strip().lower()
            
            if choice == '1':
                launch_three_mode_system()
                input("\n按回车键返回主菜单...")
                
            elif choice == '2':
                update_readme()
                input("\n按回车键返回主菜单...")
                
            elif choice == '3':
                show_guide()
                
            elif choice == 'q':
                print("\n👋 谢谢使用！")
                break
                
            else:
                print("❌ 无效选择，请输入 1、2、3 或 q")
                input("按回车键继续...")
                
        except KeyboardInterrupt:
            print("\n\n👋 程序已退出")
            break
        except Exception as e:
            print(f"\n❌ 发生错误: {e}")
            input("按回车键继续...")

if __name__ == "__main__":
    main() 