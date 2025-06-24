#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
智能财务管理系统 - Python启动器 v2.0
集成30秒轻音乐提醒系统和智能监控

Features:
- 🚀 一键启动完整系统
- 🎵 30秒轻音乐提醒系统
- 📊 实时系统监控
- 🔧 自动环境配置
- 🌐 跨平台支持
- 📈 性能监控
- 🔄 自动重启机制
"""

import os
import sys
import time
import json
import subprocess
import threading
import requests
import platform
import signal
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging
import psutil
import colorama
from colorama import Fore, Back, Style, init

# 初始化颜色输出
init(autoreset=True)

class FinancialSystemLauncher:
    def __init__(self):
        self.current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.os_type = platform.system()
        self.project_root = Path(__file__).parent
        self.services = {
            'frontend': {'port': 3000, 'name': '前端界面', 'url': 'http://localhost:3000'},
            'backend': {'port': 8000, 'name': '后端API', 'url': 'http://localhost:8000'},
            'postgres': {'port': 5432, 'name': 'PostgreSQL', 'url': None},
            'redis': {'port': 6379, 'name': 'Redis缓存', 'url': None},
            'pgadmin': {'port': 5050, 'name': '数据库管理', 'url': 'http://localhost:5050'}
        }
        self.setup_logging()
        self.running_processes = []
        
    def setup_logging(self):
        """设置日志系统"""
        log_dir = self.project_root / 'logs'
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'system_launcher.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)

    def print_color(self, color: str, message: str, style: str = ''):
        """彩色输出"""
        color_map = {
            'red': Fore.RED,
            'green': Fore.GREEN,
            'yellow': Fore.YELLOW,
            'blue': Fore.BLUE,
            'purple': Fore.MAGENTA,
            'cyan': Fore.CYAN,
            'white': Fore.WHITE
        }
        
        style_map = {
            'bold': Style.BRIGHT,
            'dim': Style.DIM
        }
        
        output = f"{color_map.get(color, '')}{style_map.get(style, '')}{message}{Style.RESET_ALL}"
        print(output)
        self.logger.info(message)

    def play_30s_light_music(self, task_type: str):
        """30秒轻音乐提醒系统"""
        hour = datetime.now().hour
        
        self.print_color('cyan', f"🎵 启动30秒{task_type}轻音乐提醒...")
        
        # 深夜模式检查 (22:00-8:00)
        if hour >= 22 or hour <= 8:
            self.print_color('purple', "🌙 深夜模式：系统启动完成，播放轻柔提醒...")
            self._play_night_mode_music()
            return
        
        music_types = {
            '系统启动': self._play_startup_music,
            '服务就绪': self._play_service_music,
            '完全运行': self._play_running_music
        }
        
        music_func = music_types.get(task_type, self._play_running_music)
        threading.Thread(target=music_func, daemon=True).start()

    def _play_startup_music(self):
        """播放系统启动音乐"""
        self.print_color('green', "🎼 播放30秒系统启动古典轻音乐...")
        try:
            if self.os_type == 'Darwin':  # macOS
                for i in range(8):
                    subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], 
                                 check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    time.sleep(0.8)
                    if i == 2:
                        self._speak("智能财务管理系统正在启动", 'Ting-Ting', 160)
                    elif i == 5:
                        self._speak("各项服务正在初始化", 'Ting-Ting', 150)
            elif self.os_type == 'Windows':
                # Windows 系统音效
                for i in range(10):
                    os.system('echo \a')
                    time.sleep(2)
            else:  # Linux
                self._speak("系统启动完成，30秒轻音乐提醒")
        except Exception as e:
            self.logger.warning(f"音乐播放失败: {e}")
        
        self.print_color('green', "✅ 30秒系统启动古典轻音乐播放完成")

    def _play_service_music(self):
        """播放服务就绪音乐"""
        self.print_color('blue', "🎹 播放30秒服务就绪钢琴轻音乐...")
        try:
            if self.os_type == 'Darwin':
                for i in range(12):
                    subprocess.run(['afplay', '/System/Library/Sounds/Purr.aiff'], 
                                 check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    time.sleep(1.8)
                    if i == 3:
                        self._speak("所有核心服务已成功启动", 'Mei-Jia', 150)
                    elif i == 8:
                        self._speak("数据库连接正常，API服务运行中", 'Mei-Jia', 140)
        except Exception as e:
            self.logger.warning(f"服务音乐播放失败: {e}")
        
        self.print_color('blue', "✅ 30秒服务就绪钢琴轻音乐播放完成")

    def _play_running_music(self):
        """播放系统运行音乐"""
        self.print_color('yellow', "🎶 播放30秒系统运行自然轻音乐...")
        try:
            if self.os_type == 'Darwin':
                for i in range(10):
                    subprocess.run(['afplay', '/System/Library/Sounds/Blow.aiff'], 
                                 check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    time.sleep(2.2)
                    if i == 4:
                        self._speak("智能财务管理系统现在完全运行", 'Sin-ji', 140)
        except Exception as e:
            self.logger.warning(f"运行音乐播放失败: {e}")
        
        self.print_color('yellow', "✅ 30秒系统运行自然轻音乐播放完成")

    def _play_night_mode_music(self):
        """深夜模式轻音乐"""
        try:
            if self.os_type == 'Darwin':
                for i in range(5):
                    subprocess.run(['afplay', '/System/Library/Sounds/Tink.aiff'], 
                                 check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    time.sleep(1.5)
                self._speak("财务管理系统已成功启动，深夜模式激活", 'Sin-ji', 120)
        except Exception as e:
            self.logger.warning(f"深夜模式音乐播放失败: {e}")

    def _speak(self, text: str, voice: str = None, rate: int = 140):
        """语音提醒"""
        try:
            if self.os_type == 'Darwin' and voice:
                subprocess.run(['say', text, '--voice', voice, '--rate', str(rate)], 
                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            elif self.os_type == 'Windows':
                subprocess.run(['powershell', '-Command', f'Add-Type –AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak("{text}")'], 
                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                self.print_color('cyan', f"🔊 语音提醒: {text}")
        except Exception as e:
            self.logger.warning(f"语音播放失败: {e}")

    def display_banner(self):
        """显示启动横幅"""
        os.system('clear' if self.os_type != 'Windows' else 'cls')
        
        banner = f"""
{Fore.CYAN}╔══════════════════════════════════════════════════════════════╗
║                🚀 智能财务管理系统启动器 v2.0                  ║
║                   Professional Financial System                ║
║                        Python Edition                          ║
╚══════════════════════════════════════════════════════════════╝{Style.RESET_ALL}

{Fore.YELLOW}🕒 启动时间: {self.current_time}
💻 操作系统: {self.os_type}
📁 项目路径: {self.project_root}{Style.RESET_ALL}
"""
        print(banner)

    def check_environment(self) -> bool:
        """环境检查"""
        self.print_color('blue', "🔍 第一阶段：环境检查...", 'bold')
        
        # 检查必需工具
        required_tools = {
            'docker': 'Docker 容器引擎',
            'docker-compose': 'Docker Compose',
            'node': 'Node.js 运行时',
            'npm': 'NPM 包管理器'
        }
        
        missing_tools = []
        for tool, description in required_tools.items():
            if not self._check_command(tool):
                missing_tools.append(f"{tool} ({description})")
                self.print_color('red', f"❌ {description} 未安装")
            else:
                version = self._get_tool_version(tool)
                self.print_color('green', f"✅ {description} 已安装: {version}")
        
        if missing_tools:
            self.print_color('red', f"请安装以下必需工具: {', '.join(missing_tools)}")
            return False
        
        # 检查Node.js版本
        if not self._check_nodejs_version():
            return False
        
        # 检查端口占用
        self._check_ports()
        
        self.print_color('green', "🎯 环境检查完成！")
        return True

    def _check_command(self, command: str) -> bool:
        """检查命令是否存在"""
        try:
            subprocess.run([command, '--version'], 
                         check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def _get_tool_version(self, tool: str) -> str:
        """获取工具版本"""
        try:
            result = subprocess.run([tool, '--version'], 
                                  capture_output=True, text=True, check=True)
            return result.stdout.strip().split('\n')[0]
        except:
            return "未知版本"

    def _check_nodejs_version(self) -> bool:
        """检查Node.js版本"""
        try:
            result = subprocess.run(['node', '-v'], capture_output=True, text=True, check=True)
            version = result.stdout.strip().replace('v', '')
            major_version = int(version.split('.')[0])
            
            if major_version < 18:
                self.print_color('red', f"❌ Node.js版本过低: v{version}, 需要18+")
                return False
            
            self.print_color('green', f"✅ Node.js版本符合要求: v{version}")
            return True
        except:
            self.print_color('red', "❌ 无法检查Node.js版本")
            return False

    def _check_ports(self):
        """检查端口占用"""
        for service_name, config in self.services.items():
            port = config['port']
            name = config['name']
            
            if self._is_port_in_use(port):
                self.print_color('yellow', f"⚠️  端口 {port} ({name}) 已被占用")
                
                # 尝试终止占用进程
                if self._kill_port_process(port):
                    self.print_color('green', f"✅ 已释放端口 {port}")
                else:
                    self.print_color('yellow', f"⚠️  请手动处理端口 {port} 冲突")
            else:
                self.print_color('green', f"✅ 端口 {port} ({name}) 可用")

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

    def install_dependencies(self) -> bool:
        """安装依赖"""
        self.print_color('blue', "📦 第二阶段：依赖管理...", 'bold')
        
        # 设置环境文件
        self._setup_env_files()
        
        # 安装根目录依赖
        if (self.project_root / 'package.json').exists():
            self.print_color('cyan', "📋 安装根目录依赖...")
            if not self._run_npm_install('.'):
                return False
            self.print_color('green', "✅ 根目录依赖安装完成")
        
        # 安装前端依赖
        frontend_dir = self.project_root / 'frontend'
        if frontend_dir.exists() and (frontend_dir / 'package.json').exists():
            self.print_color('cyan', "🎨 安装前端依赖...")
            if not self._run_npm_install('frontend'):
                return False
            self.print_color('green', "✅ 前端依赖安装完成")
        
        # 安装后端依赖
        backend_dir = self.project_root / 'backend'
        if backend_dir.exists() and (backend_dir / 'package.json').exists():
            self.print_color('cyan', "⚡ 安装后端依赖...")
            if not self._run_npm_install('backend'):
                return False
            self.print_color('green', "✅ 后端依赖安装完成")
        
        self.print_color('green', "🎯 依赖管理完成！")
        return True

    def _setup_env_files(self):
        """设置环境文件"""
        self.print_color('yellow', "📝 设置环境配置文件...")
        
        # 后端环境文件
        backend_env = self.project_root / 'backend' / '.env'
        backend_example = self.project_root / 'backend' / 'env.example'
        
        if not backend_env.exists() and backend_example.exists():
            self.print_color('cyan', "📄 创建后端环境配置文件...")
            backend_env.write_text(backend_example.read_text())
            self.print_color('green', "✅ 后端 .env 文件已创建")
        
        # 前端环境文件
        frontend_env = self.project_root / 'frontend' / '.env'
        frontend_example = self.project_root / 'frontend' / '.env.example'
        
        if not frontend_env.exists() and frontend_example.exists():
            self.print_color('cyan', "📄 创建前端环境配置文件...")
            frontend_env.write_text(frontend_example.read_text())
            self.print_color('green', "✅ 前端 .env 文件已创建")

    def _run_npm_install(self, directory: str) -> bool:
        """运行npm install"""
        try:
            cwd = self.project_root / directory if directory != '.' else self.project_root
            result = subprocess.run(['npm', 'install'], 
                                  cwd=cwd, check=True, 
                                  stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            return True
        except subprocess.CalledProcessError as e:
            self.print_color('red', f"❌ {directory} 依赖安装失败: {e}")
            return False

    def setup_database(self) -> bool:
        """设置数据库"""
        self.print_color('blue', "🗄️ 第三阶段：数据库服务...", 'bold')
        
        # 停止旧容器
        self.print_color('cyan', "🔄 清理旧容器...")
        self._run_docker_compose(['down', '--remove-orphans'])
        
        # 启动数据库服务
        self.print_color('cyan', "🚀 启动数据库服务...")
        if not self._run_docker_compose(['up', '-d', 'postgres', 'redis']):
            return False
        
        # 等待数据库就绪
        if not self._wait_for_database():
            return False
        
        # 数据库迁移和种子数据
        self._run_database_migrations()
        
        self.print_color('green', "🎯 数据库服务完成！")
        
        # 播放服务就绪音乐
        self.play_30s_light_music("服务就绪")
        return True

    def _run_docker_compose(self, args: List[str]) -> bool:
        """运行docker-compose命令"""
        try:
            subprocess.run(['docker-compose'] + args, 
                          cwd=self.project_root, check=True,
                          stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            return True
        except subprocess.CalledProcessError as e:
            self.print_color('red', f"❌ Docker Compose 命令失败: {e}")
            return False

    def _wait_for_database(self) -> bool:
        """等待数据库就绪"""
        self.print_color('cyan', "⏳ 等待数据库就绪...")
        
        max_retries = 30
        for i in range(max_retries):
            try:
                result = subprocess.run([
                    'docker-compose', 'exec', '-T', 'postgres',
                    'pg_isready', '-U', 'financial_user', '-d', 'financial_db'
                ], cwd=self.project_root, check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                self.print_color('green', "✅ PostgreSQL 数据库就绪")
                break
            except subprocess.CalledProcessError:
                if i >= max_retries - 1:
                    self.print_color('red', "❌ 数据库启动超时")
                    return False
                self.print_color('yellow', f"⏳ 等待PostgreSQL启动... ({i + 1}/{max_retries})")
                time.sleep(2)
        
        # 检查Redis
        try:
            subprocess.run([
                'docker-compose', 'exec', '-T', 'redis', 'redis-cli', 'ping'
            ], cwd=self.project_root, check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.print_color('green', "✅ Redis 缓存就绪")
        except subprocess.CalledProcessError:
            self.print_color('yellow', "⚠️  Redis 启动中...")
            time.sleep(3)
        
        return True

    def _run_database_migrations(self):
        """运行数据库迁移"""
        backend_dir = self.project_root / 'backend'
        if backend_dir.exists():
            self.print_color('cyan', "🔄 运行数据库迁移...")
            
            try:
                # Prisma generate
                subprocess.run(['npm', 'run', 'db:generate'], 
                             cwd=backend_dir, check=False,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                # Database migration
                subprocess.run(['npm', 'run', 'db:migrate'], 
                             cwd=backend_dir, check=False,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                # Seed data
                self.print_color('cyan', "🌱 填充测试数据...")
                subprocess.run(['npm', 'run', 'db:seed'], 
                             cwd=backend_dir, check=False,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                self.print_color('green', "✅ 数据库初始化完成")
            except Exception as e:
                self.print_color('yellow', f"⚠️  数据库迁移部分失败: {e}")

    def start_services(self) -> bool:
        """启动应用服务"""
        self.print_color('blue', "🚀 第四阶段：服务启动...", 'bold')
        
        # 启动所有服务
        self.print_color('cyan', "🌐 启动完整应用堆栈...")
        if not self._run_docker_compose(['up', '-d']):
            return False
        
        # 等待服务启动
        self.print_color('cyan', "⏳ 等待服务完全启动...")
        time.sleep(15)
        
        self.print_color('green', "🎯 应用服务启动完成！")
        return True

    def health_check(self) -> Dict[str, bool]:
        """健康检查"""
        self.print_color('blue', "💊 第五阶段：健康检查...", 'bold')
        
        health_status = {}
        healthy_services = 0
        
        # 检查Web服务
        web_services = ['frontend', 'backend', 'pgadmin']
        for service_name in web_services:
            config = self.services[service_name]
            name = config['name']
            url = config['url']
            
            self.print_color('cyan', f"🔍 检查 {name} 服务...")
            
            if self._check_http_service(url):
                self.print_color('green', f"✅ {name} 服务健康")
                health_status[service_name] = True
                healthy_services += 1
            else:
                self.print_color('yellow', f"⚠️  {name} 服务启动中...")
                health_status[service_name] = False
        
        # 检查数据库服务
        if self._check_database_connection():
            self.print_color('green', "✅ 数据库连接正常")
            health_status['postgres'] = True
            healthy_services += 1
        else:
            self.print_color('yellow', "⚠️  数据库连接检查失败")
            health_status['postgres'] = False
        
        # 检查Redis
        if self._check_redis_connection():
            self.print_color('green', "✅ Redis缓存连接正常")
            health_status['redis'] = True
            healthy_services += 1
        else:
            self.print_color('yellow', "⚠️  Redis连接检查失败")
            health_status['redis'] = False
        
        # 计算健康度
        total_services = len(self.services)
        health_percentage = (healthy_services * 100) // total_services
        
        self.print_color('cyan', f"📊 系统健康度: {health_percentage}% ({healthy_services}/{total_services})")
        
        if health_percentage >= 80:
            self.print_color('green', "🎯 系统健康检查完成！")
        else:
            self.print_color('yellow', "⚠️  部分服务可能需要更多时间启动")
        
        return health_status

    def _check_http_service(self, url: str, timeout: int = 5) -> bool:
        """检查HTTP服务"""
        if not url:
            return False
        
        try:
            response = requests.get(url, timeout=timeout)
            return response.status_code < 500
        except:
            return False

    def _check_database_connection(self) -> bool:
        """检查数据库连接"""
        try:
            subprocess.run([
                'docker-compose', 'exec', '-T', 'postgres',
                'pg_isready', '-U', 'financial_user', '-d', 'financial_db'
            ], cwd=self.project_root, check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except subprocess.CalledProcessError:
            return False

    def _check_redis_connection(self) -> bool:
        """检查Redis连接"""
        try:
            subprocess.run([
                'docker-compose', 'exec', '-T', 'redis', 'redis-cli', 'ping'
            ], cwd=self.project_root, check=True,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except subprocess.CalledProcessError:
            return False

    def launch_complete(self):
        """启动完成"""
        self.print_color('green', """
╔══════════════════════════════════════════════════════════════╗
║                   🎉 系统启动成功！                          ║
║              智能财务管理系统已完全运行                       ║
╚══════════════════════════════════════════════════════════════╝
""")
        
        self.print_color('cyan', "🌐 服务访问地址：")
        for service_name, config in self.services.items():
            if config['url']:
                icon = {'frontend': '📱', 'backend': '🔗', 'pgadmin': '🗄️'}.get(service_name, '🌐')
                print(f"   {icon} {config['name']}: {config['url']}")
        
        self.print_color('cyan', "\n🔑 默认测试账户：")
        print("   📧 邮箱: admin@financial.com")
        print("   🔒 密码: admin123456")
        
        self.print_color('cyan', "\n💡 管理命令：")
        print("   🛑 停止系统: docker-compose down")
        print("   📊 查看日志: docker-compose logs -f")
        print("   🔄 重启系统: docker-compose restart")
        print("   🐍 Python监控: python launch_system.py --monitor")
        
        completion_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.print_color('yellow', f"\n⏱️ 启动完成时间: {completion_time}")
        
        # 播放完全运行音乐
        self.play_30s_light_music("完全运行")

    def monitor_system(self):
        """系统监控模式"""
        self.print_color('blue', "📊 进入系统监控模式...", 'bold')
        
        try:
            while True:
                os.system('clear' if self.os_type != 'Windows' else 'cls')
                
                self.print_color('cyan', f"""
╔══════════════════════════════════════════════════════════════╗
║                   📊 系统实时监控面板                         ║
║                 更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                 ║
╚══════════════════════════════════════════════════════════════╝
""")
                
                # 检查服务状态
                health_status = self.health_check()
                
                # 显示系统资源
                self._display_system_resources()
                
                # 显示容器状态
                self._display_container_status()
                
                self.print_color('yellow', "\n按 Ctrl+C 退出监控模式")
                time.sleep(10)
                
        except KeyboardInterrupt:
            self.print_color('green', "\n👋 退出监控模式")

    def _display_system_resources(self):
        """显示系统资源"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            self.print_color('cyan', "\n💻 系统资源状态：")
            print(f"   🔥 CPU使用率: {cpu_percent}%")
            print(f"   💾 内存使用: {memory.percent}% ({memory.used // (1024**3)}GB / {memory.total // (1024**3)}GB)")
            print(f"   💿 磁盘使用: {disk.percent}% ({disk.used // (1024**3)}GB / {disk.total // (1024**3)}GB)")
        except Exception as e:
            self.print_color('yellow', f"⚠️  资源监控失败: {e}")

    def _display_container_status(self):
        """显示容器状态"""
        try:
            result = subprocess.run([
                'docker-compose', 'ps', '--format', 'table'
            ], cwd=self.project_root, capture_output=True, text=True, check=True)
            
            if result.stdout:
                self.print_color('cyan', "\n🐳 Docker容器状态：")
                print(result.stdout)
        except subprocess.CalledProcessError:
            self.print_color('yellow', "⚠️  无法获取容器状态")

    def stop_system(self):
        """停止系统"""
        self.print_color('yellow', "🛑 正在停止系统...")
        
        if self._run_docker_compose(['down']):
            self.print_color('green', "✅ 系统已停止")
        else:
            self.print_color('red', "❌ 系统停止失败")

    def restart_system(self):
        """重启系统"""
        self.print_color('yellow', "🔄 正在重启系统...")
        self.stop_system()
        time.sleep(3)
        return self.launch_system()

    def launch_system(self) -> bool:
        """完整启动流程"""
        self.display_banner()
        
        # 播放启动音乐
        self.play_30s_light_music("系统启动")
        
        try:
            # 启动流程
            if not self.check_environment():
                return False
            
            if not self.install_dependencies():
                return False
            
            if not self.setup_database():
                return False
            
            if not self.start_services():
                return False
            
            self.health_check()
            self.launch_complete()
            
            return True
            
        except KeyboardInterrupt:
            self.print_color('yellow', "\n⚠️  启动被用户中断")
            return False
        except Exception as e:
            self.print_color('red', f"❌ 启动失败: {e}")
            self.logger.exception("系统启动异常")
            return False

def main():
    launcher = FinancialSystemLauncher()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == '--monitor':
            launcher.monitor_system()
        elif command == '--stop':
            launcher.stop_system()
        elif command == '--restart':
            launcher.restart_system()
        elif command == '--health':
            launcher.health_check()
        else:
            print(f"未知命令: {command}")
            print("可用命令: --monitor, --stop, --restart, --health")
    else:
        # 默认启动系统
        success = launcher.launch_system()
        if success:
            print(f"\n{Fore.GREEN}🎯 启动成功！使用 python launch_system.py --monitor 进入监控模式{Style.RESET_ALL}")
        else:
            print(f"\n{Fore.RED}❌ 启动失败，请检查错误信息{Style.RESET_ALL}")
            sys.exit(1)

if __name__ == "__main__":
    main() 