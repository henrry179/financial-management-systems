#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
本地财务管理系统启动器 - 无Docker版本
解决Docker镜像拉取问题的本地开发方案

Features:
- 🚀 本地Node.js服务启动
- 🎵 30秒轻音乐提醒系统
- 📊 实时系统监控
- 🔧 自动环境配置
- 🌐 跨平台支持
"""

import os
import sys
import time
import subprocess
import threading
import platform
import signal
import webbrowser
from datetime import datetime
from pathlib import Path
import logging
import psutil

class LocalFinancialSystemLauncher:
    def __init__(self):
        self.current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.os_type = platform.system()
        # 修复路径：脚本在 deployment/scripts/ 目录，需要向上两级到达项目根目录
        self.project_root = Path(__file__).parent.parent.parent
        self.processes = []
        self.setup_logging()
        
    def setup_logging(self):
        """设置日志系统"""
        log_dir = self.project_root / 'logs'
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'local_system.log'),
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

    def play_30s_startup_music(self):
        """播放30秒系统启动轻音乐"""
        hour = datetime.now().hour
        
        self.print_color("🎵 播放30秒本地系统启动轻音乐...", 'cyan')
        
        def play_music():
            try:
                if self.os_type == 'Darwin':  # macOS
                    if hour >= 22 or hour <= 8:  # 深夜模式
                        self.print_color("🌙 深夜模式：本地系统启动完成，播放轻柔提醒...", 'purple')
                        for i in range(5):
                            subprocess.run(['afplay', '/System/Library/Sounds/Tink.aiff'], 
                                         check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                            time.sleep(1.5)
                        self._speak("本地财务管理系统启动完成，深夜模式激活", 'Sin-ji', 120)
                    else:
                        self.print_color("🎼 播放30秒本地系统启动古典轻音乐...", 'green')
                        for i in range(12):
                            subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], 
                                         check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                            time.sleep(2.0)
                            if i == 3:
                                self._speak("本地Node.js服务正在启动", 'Ting-Ting', 160)
                            elif i == 8:
                                self._speak("财务管理系统现在完全运行", 'Ting-Ting', 150)
            except Exception as e:
                self.logger.warning(f"音乐播放失败: {e}")
            
            self.print_color("✅ 30秒本地系统启动轻音乐播放完成", 'green')
        
        threading.Thread(target=play_music, daemon=True).start()

    def _speak(self, text: str, voice: str = None, rate: int = 140):
        """语音提醒"""
        try:
            if self.os_type == 'Darwin' and voice:
                subprocess.run(['say', text, '--voice', voice, '--rate', str(rate)], 
                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            self.logger.warning(f"语音播放失败: {e}")

    def display_banner(self):
        """显示启动横幅"""
        os.system('clear' if self.os_type != 'Windows' else 'cls')
        
        banner = f"""
╔══════════════════════════════════════════════════════════════╗
║            🚀 本地财务管理系统启动器 v1.0                      ║
║                Local Financial System Launcher                ║
║                      无Docker本地开发版                        ║
╚══════════════════════════════════════════════════════════════╝

🕒 启动时间: {self.current_time}
💻 操作系统: {self.os_type}
📁 项目路径: {self.project_root}
🌐 运行模式: 本地开发模式 (无Docker依赖)
"""
        self.print_color(banner, 'cyan')

    def check_local_environment(self):
        """检查本地环境"""
        self.print_color("🔍 检查本地开发环境...", 'blue')
        
        # 检查Node.js
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True, check=True)
            version = result.stdout.strip()
            self.print_color(f"✅ Node.js 已安装: {version}", 'green')
        except subprocess.CalledProcessError:
            self.print_color("❌ Node.js 未安装", 'red')
            return False
        
        # 检查npm
        try:
            result = subprocess.run(['npm', '--version'], capture_output=True, text=True, check=True)
            version = result.stdout.strip()
            self.print_color(f"✅ NPM 已安装: {version}", 'green')
        except subprocess.CalledProcessError:
            self.print_color("❌ NPM 未安装", 'red')
            return False
        
        # 检查端口占用
        ports_to_check = [3000, 8000]
        for port in ports_to_check:
            if self._is_port_in_use(port):
                self.print_color(f"⚠️  端口 {port} 已被占用，尝试释放...", 'yellow')
                self._kill_port_process(port)
                time.sleep(1)
                if not self._is_port_in_use(port):
                    self.print_color(f"✅ 端口 {port} 已释放", 'green')
                else:
                    self.print_color(f"⚠️  端口 {port} 仍被占用", 'yellow')
            else:
                self.print_color(f"✅ 端口 {port} 可用", 'green')
        
        return True

    def _is_port_in_use(self, port: int) -> bool:
        """检查端口是否被占用"""
        try:
            for conn in psutil.net_connections():
                if conn.laddr.port == port:
                    return True
            return False
        except:
            return False

    def _kill_port_process(self, port: int) -> bool:
        """终止占用端口的进程"""
        try:
            for conn in psutil.net_connections():
                if conn.laddr.port == port and conn.pid:
                    process = psutil.Process(conn.pid)
                    process.terminate()
                    time.sleep(1)
                    if process.is_running():
                        process.kill()
                    return True
            return False
        except:
            return False

    def install_dependencies(self):
        """安装依赖"""
        self.print_color("📦 安装项目依赖...", 'blue')
        
        # 安装前端依赖
        frontend_dir = self.project_root / 'frontend'
        if frontend_dir.exists() and (frontend_dir / 'package.json').exists():
            self.print_color("🎨 安装前端依赖...", 'yellow')
            try:
                subprocess.run(['npm', 'install'], cwd=frontend_dir, check=True,
                             stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                self.print_color("✅ 前端依赖安装完成", 'green')
            except subprocess.CalledProcessError as e:
                self.print_color(f"❌ 前端依赖安装失败: {e}", 'red')
                return False
        
        # 安装后端依赖
        backend_dir = self.project_root / 'backend'
        if backend_dir.exists() and (backend_dir / 'package.json').exists():
            self.print_color("⚡ 安装后端依赖...", 'yellow')
            try:
                subprocess.run(['npm', 'install'], cwd=backend_dir, check=True,
                             stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                self.print_color("✅ 后端依赖安装完成", 'green')
            except subprocess.CalledProcessError as e:
                self.print_color(f"❌ 后端依赖安装失败: {e}", 'red')
                return False
        
        return True

    def setup_database_alternative(self):
        """设置数据库替代方案"""
        self.print_color("🗄️ 配置数据库替代方案...", 'blue')
        
        # 创建SQLite数据库配置
        backend_dir = self.project_root / 'backend'
        
        # 确保backend目录存在
        if not backend_dir.exists():
            self.print_color(f"❌ 后端目录不存在: {backend_dir}", 'red')
            return False
        
        env_file = backend_dir / '.env'
        
        # 如果有env.example文件，先从它复制
        env_example = backend_dir / 'env.example'
        
        if env_file.exists():
            content = env_file.read_text()
            
            # 替换PostgreSQL连接为SQLite
            new_content = content.replace(
                'DATABASE_URL=postgresql://financial_user:financial_password@postgres:5432/financial_db',
                'DATABASE_URL=file:./dev.db'
            ).replace(
                'REDIS_URL=redis://redis:6379',
                'REDIS_URL=redis://localhost:6379'
            )
            
            env_file.write_text(new_content)
            self.print_color("✅ 数据库配置已更新为SQLite", 'green')
        elif env_example.exists():
            # 从example文件复制并修改
            content = env_example.read_text()
            new_content = content.replace(
                'DATABASE_URL=postgresql://financial_user:financial_password@postgres:5432/financial_db',
                'DATABASE_URL=file:./dev.db'
            ).replace(
                'REDIS_URL=redis://redis:6379',
                'REDIS_URL=redis://localhost:6379'
            )
            env_file.write_text(new_content)
            self.print_color("✅ 从env.example创建本地开发环境配置", 'green')
        else:
            # 创建新的环境文件
            env_content = """NODE_ENV=development
DATABASE_URL=file:./dev.db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-for-local-dev
PORT=8000
"""
            try:
                env_file.write_text(env_content)
                self.print_color("✅ 已创建本地开发环境配置", 'green')
            except Exception as e:
                self.print_color(f"❌ 创建环境配置文件失败: {e}", 'red')
                return False
        
        return True

    def start_backend_service(self):
        """启动后端服务"""
        self.print_color("⚡ 启动后端服务...", 'blue')
        
        backend_dir = self.project_root / 'backend'
        if not backend_dir.exists():
            self.print_color("❌ 后端目录不存在", 'red')
            return False
        
        try:
            # 生成Prisma客户端
            self.print_color("🔧 生成数据库客户端...", 'yellow')
            subprocess.run(['npx', 'prisma', 'generate'], cwd=backend_dir, check=True,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # 运行数据库迁移
            self.print_color("🔄 运行数据库迁移...", 'yellow')
            subprocess.run(['npx', 'prisma', 'db', 'push'], cwd=backend_dir, check=False,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # 启动后端服务
            self.print_color("🚀 启动后端API服务...", 'yellow')
            backend_process = subprocess.Popen(
                ['npm', 'run', 'dev'],
                cwd=backend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            self.processes.append(('backend', backend_process))
            self.print_color("✅ 后端服务启动中...", 'green')
            
            # 等待服务启动
            time.sleep(5)
            
            return True
            
        except subprocess.CalledProcessError as e:
            self.print_color(f"❌ 后端服务启动失败: {e}", 'red')
            return False

    def start_frontend_service(self):
        """启动前端服务"""
        self.print_color("🎨 启动前端服务...", 'blue')
        
        frontend_dir = self.project_root / 'frontend'
        if not frontend_dir.exists():
            self.print_color("❌ 前端目录不存在", 'red')
            return False
        
        try:
            # 启动前端服务
            self.print_color("🚀 启动前端开发服务器...", 'yellow')
            frontend_process = subprocess.Popen(
                ['npm', 'run', 'dev'],
                cwd=frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            self.processes.append(('frontend', frontend_process))
            self.print_color("✅ 前端服务启动中...", 'green')
            
            # 等待服务启动
            time.sleep(8)
            
            return True
            
        except subprocess.CalledProcessError as e:
            self.print_color(f"❌ 前端服务启动失败: {e}", 'red')
            return False

    def health_check(self):
        """健康检查"""
        self.print_color("💊 系统健康检查...", 'blue')
        
        services = {
            'frontend': 'http://localhost:3000',
            'backend': 'http://localhost:8000'
        }
        
        healthy_services = 0
        
        for service_name, url in services.items():
            try:
                import urllib.request
                with urllib.request.urlopen(url, timeout=5) as response:
                    if response.status == 200:
                        self.print_color(f"✅ {service_name} 服务健康", 'green')
                        healthy_services += 1
                    else:
                        self.print_color(f"⚠️  {service_name} 服务响应异常", 'yellow')
            except Exception:
                self.print_color(f"⚠️  {service_name} 服务启动中...", 'yellow')
        
        health_percentage = (healthy_services / len(services)) * 100
        self.print_color(f"📊 系统健康度: {health_percentage:.0f}% ({healthy_services}/{len(services)})", 
                        'green' if health_percentage >= 50 else 'yellow')
        
        return health_percentage >= 50

    def open_browser(self):
        """打开浏览器"""
        self.print_color("🌐 打开浏览器...", 'blue')
        
        try:
            webbrowser.open('http://localhost:3000')
            self.print_color("✅ 浏览器已打开", 'green')
        except Exception as e:
            self.print_color(f"⚠️  无法自动打开浏览器: {e}", 'yellow')

    def display_success_info(self):
        """显示成功信息"""
        success_banner = f"""
╔══════════════════════════════════════════════════════════════╗
║                    🎉 系统启动成功！                          ║
╚══════════════════════════════════════════════════════════════╝

🌐 前端界面: http://localhost:3000
⚡ 后端API: http://localhost:8000
📊 系统状态: 运行中
🕒 启动时间: {self.current_time}

💡 提示:
- 前端界面已在浏览器中打开
- 后端API服务正在运行
- 使用 Ctrl+C 停止所有服务

🎵 正在播放30秒启动成功轻音乐...
"""
        self.print_color(success_banner, 'green')

    def cleanup(self):
        """清理进程"""
        self.print_color("🔄 正在停止所有服务...", 'yellow')
        
        for service_name, process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
                self.print_color(f"✅ {service_name} 服务已停止", 'green')
            except subprocess.TimeoutExpired:
                process.kill()
                self.print_color(f"⚠️  强制停止 {service_name} 服务", 'yellow')
            except Exception as e:
                self.print_color(f"❌ 停止 {service_name} 服务失败: {e}", 'red')

    def run_system(self):
        """运行完整系统"""
        self.display_banner()
        
        # 播放启动音乐
        self.play_30s_startup_music()
        
        # 环境检查
        if not self.check_local_environment():
            self.print_color("❌ 环境检查失败", 'red')
            return False
        
        # 安装依赖
        if not self.install_dependencies():
            self.print_color("❌ 依赖安装失败", 'red')
            return False
        
        # 设置数据库
        if not self.setup_database_alternative():
            self.print_color("❌ 数据库设置失败", 'red')
            return False
        
        # 启动服务
        if not self.start_backend_service():
            self.print_color("❌ 后端服务启动失败", 'red')
            return False
        
        if not self.start_frontend_service():
            self.print_color("❌ 前端服务启动失败", 'red')
            return False
        
        # 健康检查
        time.sleep(10)  # 等待服务完全启动
        if not self.health_check():
            self.print_color("⚠️  部分服务可能未正常启动", 'yellow')
        
        # 打开浏览器
        self.open_browser()
        
        # 显示成功信息
        self.display_success_info()
        
        # 等待用户中断
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.print_color("\n👋 收到停止信号...", 'yellow')
            self.cleanup()
            self.print_color("✅ 系统已停止", 'green')
        
        return True

def main():
    launcher = LocalFinancialSystemLauncher()
    
    def signal_handler(signum, frame):
        launcher.cleanup()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    success = launcher.run_system()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 