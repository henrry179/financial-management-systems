#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
财务管理系统快速启动器
提供多种启动方案解决系统无法运行的问题

启动选项:
1. 本地开发模式 (推荐) - 无Docker依赖
2. Docker模式 - 使用容器化部署
3. 混合模式 - 前端本地，后端Docker
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def print_banner():
    """显示启动横幅"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║               🚀 财务管理系统快速启动器                        ║
║                 Financial System Quick Starter                ║
╚══════════════════════════════════════════════════════════════╝

选择启动模式:
1. 🏠 本地开发模式 (推荐) - 无Docker依赖，快速启动
2. 🐳 Docker容器模式 - 完整容器化部署
3. 🔧 系统修复模式 - 诊断和修复系统问题
4. 📊 系统状态检查 - 查看当前运行状态
5. ❌ 退出
"""
    print(banner)

def check_requirements():
    """检查基本要求"""
    print("🔍 检查系统要求...")
    
    # 检查Python
    python_version = sys.version_info
    if python_version.major >= 3 and python_version.minor >= 8:
        print(f"✅ Python {python_version.major}.{python_version.minor} 已安装")
    else:
        print("❌ 需要Python 3.8或更高版本")
        return False
    
    # 检查Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js 已安装: {result.stdout.strip()}")
        else:
            print("❌ Node.js 未安装")
            return False
    except FileNotFoundError:
        print("❌ Node.js 未安装")
        return False
    
    return True

def start_local_mode():
    """启动本地开发模式"""
    print("\n🏠 启动本地开发模式...")
    
    project_root = Path(__file__).parent
    
    # 检查启动脚本
    local_script = project_root / 'start_local_system.py'
    if local_script.exists():
        print("🚀 使用本地系统启动器...")
        os.system(f'python "{local_script}"')
    else:
        print("📦 使用简化启动流程...")
        
        # 启动前端
        frontend_dir = project_root / 'frontend'
        if frontend_dir.exists():
            print("🎨 启动前端服务...")
            subprocess.Popen(['npm', 'run', 'dev'], cwd=frontend_dir)
        
        # 启动后端
        backend_dir = project_root / 'backend'
        if backend_dir.exists():
            print("⚡ 启动后端服务...")
            subprocess.Popen(['npm', 'run', 'dev'], cwd=backend_dir)
        
        print("✅ 服务启动中...")
        print("🌐 前端: http://localhost:3000")
        print("⚡ 后端: http://localhost:8000")

def start_docker_mode():
    """启动Docker模式"""
    print("\n🐳 启动Docker容器模式...")
    
    project_root = Path(__file__).parent
    
    # 检查Docker
    try:
        subprocess.run(['docker', '--version'], check=True, capture_output=True)
        print("✅ Docker 已安装")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Docker 未安装或未运行")
        return
    
    # 尝试启动Docker Compose
    try:
        print("🚀 启动Docker服务...")
        subprocess.run(['docker-compose', 'up', '-d'], cwd=project_root, check=True)
        print("✅ Docker服务启动成功")
        print("🌐 前端: http://localhost:3000")
        print("⚡ 后端: http://localhost:8000")
        print("🗄️ 数据库管理: http://localhost:5050")
    except subprocess.CalledProcessError:
        print("❌ Docker启动失败，建议使用本地模式")

def run_system_fix():
    """运行系统修复"""
    print("\n🔧 运行系统修复模式...")
    
    project_root = Path(__file__).parent
    fix_script = project_root / 'fix_docker_system.py'
    
    if fix_script.exists():
        print("🚀 运行Docker系统修复...")
        os.system(f'python "{fix_script}"')
    else:
        print("⚠️  修复脚本不存在，手动检查问题...")
        
        # 基本诊断
        print("🔍 基本系统诊断:")
        
        # 检查端口占用
        try:
            import psutil
            ports = [3000, 8000, 5432, 6379, 5050]
            for port in ports:
                connections = [conn for conn in psutil.net_connections() if conn.laddr.port == port]
                if connections:
                    print(f"⚠️  端口 {port} 被占用")
                else:
                    print(f"✅ 端口 {port} 可用")
        except ImportError:
            print("⚠️  无法检查端口状态 (需要安装psutil)")
        
        # 检查Docker状态
        try:
            result = subprocess.run(['docker', 'ps'], capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Docker 运行正常")
                if result.stdout.strip():
                    print("🐳 当前运行的容器:")
                    print(result.stdout)
                else:
                    print("📭 没有运行中的容器")
            else:
                print("❌ Docker 未运行")
        except FileNotFoundError:
            print("❌ Docker 未安装")

def check_system_status():
    """检查系统状态"""
    print("\n📊 检查系统状态...")
    
    services = {
        '前端服务': 'http://localhost:3000',
        '后端API': 'http://localhost:8000',
        '数据库管理': 'http://localhost:5050'
    }
    
    for service_name, url in services.items():
        try:
            import urllib.request
            with urllib.request.urlopen(url, timeout=3) as response:
                if response.status == 200:
                    print(f"✅ {service_name} 运行正常 - {url}")
                else:
                    print(f"⚠️  {service_name} 响应异常 - {url}")
        except Exception:
            print(f"❌ {service_name} 无法访问 - {url}")
    
    # 检查进程
    try:
        import psutil
        node_processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if proc.info['name'] and 'node' in proc.info['name'].lower():
                    node_processes.append(proc)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        if node_processes:
            print(f"\n🔄 发现 {len(node_processes)} 个Node.js进程正在运行")
        else:
            print("\n📭 没有发现Node.js进程")
    except ImportError:
        print("\n⚠️  无法检查进程状态")

def play_success_sound():
    """播放成功音效"""
    try:
        import platform
        if platform.system() == 'Darwin':  # macOS
            subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], 
                         check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(['say', '财务管理系统启动选择完成'], 
                         check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except:
        pass

def main():
    """主函数"""
    if not check_requirements():
        print("\n❌ 系统要求检查失败，请安装必需的软件")
        return 1
    
    while True:
        print_banner()
        
        try:
            choice = input("请选择启动模式 (1-5): ").strip()
            
            if choice == '1':
                start_local_mode()
                play_success_sound()
                break
            elif choice == '2':
                start_docker_mode()
                play_success_sound()
                break
            elif choice == '3':
                run_system_fix()
                input("\n按Enter键继续...")
            elif choice == '4':
                check_system_status()
                input("\n按Enter键继续...")
            elif choice == '5':
                print("👋 退出启动器")
                return 0
            else:
                print("❌ 无效选择，请输入1-5")
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n👋 退出启动器")
            return 0
        except Exception as e:
            print(f"❌ 发生错误: {e}")
            time.sleep(1)
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 