#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
三模式财务管理系统启动器 v1.0
解决需求2：制定3个不同方式打开系统

启动模式：
- a模式）启用本地部署方式 - 无Docker依赖，纯Node.js本地开发
- b模式）启动Docker镜像模式 - 完整容器化部署，生产环境推荐
- c模式）启用混合模式 - 前端本地+后端Docker，开发调试最佳

Features:
- 🚀 智能模式选择
- 🎵 30秒轻音乐提醒系统
- 📊 实时系统监控
- 🔧 自动环境检测
- 🌐 跨平台支持
"""

import os
import sys
import time
import subprocess
import threading
import platform
import signal
from datetime import datetime
from pathlib import Path
import logging
import psutil

class ThreeModeSystemLauncher:
    def __init__(self):
        self.current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.os_type = platform.system()
        self.project_root = Path(__file__).parent.parent.parent  # 回到项目根目录
        self.scripts_dir = Path(__file__).parent
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
                logging.FileHandler(log_dir / 'three_mode_launcher.log'),
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

    def play_30s_mode_selection_music(self, mode_name: str):
        """播放30秒模式选择轻音乐"""
        hour = datetime.now().hour
        
        self.print_color(f"🎵 播放30秒{mode_name}模式启动轻音乐...", 'cyan')
        
        def play_music():
            try:
                if self.os_type == 'Darwin':  # macOS
                    if hour >= 22 or hour <= 8:  # 深夜模式
                        self.print_color("🌙 深夜模式：系统启动中，播放轻柔提醒...", 'purple')
                        for i in range(6):
                            subprocess.run(['afplay', '/System/Library/Sounds/Tink.aiff'], 
                                         check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                            time.sleep(2.0)
                        self._speak(f"{mode_name}模式系统启动完成，深夜模式", 'Sin-ji', 120)
                    else:
                        if mode_name == "本地开发":
                            self.print_color("🎼 播放30秒本地开发模式古典轻音乐...", 'green')
                            for i in range(10):
                                subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], 
                                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                                time.sleep(2.5)
                                if i == 3:
                                    self._speak("本地开发模式启动中", 'Ting-Ting', 160)
                                elif i == 7:
                                    self._speak("无Docker依赖，纯Node.js运行", 'Ting-Ting', 150)
                        elif mode_name == "Docker容器":
                            self.print_color("🎹 播放30秒Docker容器模式钢琴轻音乐...", 'blue')
                            for i in range(12):
                                subprocess.run(['afplay', '/System/Library/Sounds/Purr.aiff'], 
                                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                                time.sleep(2.0)
                                if i == 4:
                                    self._speak("Docker容器化部署启动", 'Mei-Jia', 150)
                                elif i == 8:
                                    self._speak("生产环境推荐模式", 'Mei-Jia', 140)
                        elif mode_name == "混合":
                            self.print_color("🎶 播放30秒混合模式自然轻音乐...", 'yellow')
                            for i in range(11):
                                subprocess.run(['afplay', '/System/Library/Sounds/Blow.aiff'], 
                                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                                time.sleep(2.2)
                                if i == 3:
                                    self._speak("混合模式启动中", 'Sin-ji', 150)
                                elif i == 7:
                                    self._speak("前端本地，后端容器化", 'Sin-ji', 140)
            except Exception as e:
                self.logger.warning(f"音乐播放失败: {e}")
            
            self.print_color(f"✅ 30秒{mode_name}模式轻音乐播放完成", 'green')
        
        threading.Thread(target=play_music, daemon=True).start()

    def _speak(self, text: str, voice: str = None, rate: int = 140):
        """语音提醒"""
        try:
            if self.os_type == 'Darwin' and voice:
                subprocess.run(['say', text, '--voice', voice, '--rate', str(rate)], 
                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            self.logger.warning(f"语音播放失败: {e}")

    def display_main_banner(self):
        """显示主横幅"""
        os.system('clear' if self.os_type != 'Windows' else 'cls')
        
        banner = f"""
╔══════════════════════════════════════════════════════════════╗
║              🚀 三模式财务管理系统启动器 v1.0                  ║
║                  Three-Mode System Launcher                  ║
║                      智能启动选择器                            ║
╚══════════════════════════════════════════════════════════════╝

🕒 当前时间: {self.current_time}
💻 操作系统: {self.os_type}
📁 项目路径: {self.project_root}

🎯 请选择系统启动模式：

┌─────────────────────────────────────────────────────────────┐
│  a模式 🏠 本地部署方式                                        │
│  ├─ 特点: 无Docker依赖，纯Node.js本地开发                     │
│  ├─ 优势: 启动快速，调试方便，资源占用少                       │
│  ├─ 适用: 日常开发、快速测试、Debug调试                        │
│  └─ 技术: Node.js + SQLite + 本地Redis                       │
├─────────────────────────────────────────────────────────────┤
│  b模式 🐳 Docker镜像模式                                      │
│  ├─ 特点: 完整容器化部署，生产环境一致性                       │
│  ├─ 优势: 环境隔离，部署可靠，扩展性强                         │
│  ├─ 适用: 生产部署、团队协作、CI/CD流程                        │
│  └─ 技术: Docker + PostgreSQL + Redis + 容器编排              │
├─────────────────────────────────────────────────────────────┤
│  c模式 ⚡ 混合模式                                            │
│  ├─ 特点: 前端本地开发 + 后端容器化运行                        │
│  ├─ 优势: 开发体验佳，数据一致性，调试灵活                     │
│  ├─ 适用: 高级开发、性能调优、接口联调                         │
│  └─ 技术: 本地Vite + Docker后端 + 共享数据库                  │
└─────────────────────────────────────────────────────────────┘
"""
        self.print_color(banner, 'cyan')

    def check_environment_for_mode(self, mode: str) -> bool:
        """检查特定模式的环境要求"""
        self.print_color(f"🔍 检查{mode}模式环境要求...", 'blue')
        
        if mode == "a":
            return self._check_local_mode_env()
        elif mode == "b":
            return self._check_docker_mode_env()
        elif mode == "c":
            return self._check_hybrid_mode_env()
        
        return False

    def _check_local_mode_env(self) -> bool:
        """检查本地模式环境"""
        required_tools = ['node', 'npm']
        missing_tools = []
        
        for tool in required_tools:
            if not self._check_command(tool):
                missing_tools.append(tool)
                self.print_color(f"❌ {tool} 未安装", 'red')
            else:
                version = self._get_tool_version(tool)
                self.print_color(f"✅ {tool} 已安装: {version}", 'green')
        
        if missing_tools:
            self.print_color(f"❌ 本地模式需要安装: {', '.join(missing_tools)}", 'red')
            return False
        
        return True

    def _check_docker_mode_env(self) -> bool:
        """检查Docker模式环境"""
        required_tools = ['docker', 'docker-compose', 'node', 'npm']
        missing_tools = []
        
        for tool in required_tools:
            if not self._check_command(tool):
                missing_tools.append(tool)
                self.print_color(f"❌ {tool} 未安装", 'red')
            else:
                version = self._get_tool_version(tool)
                self.print_color(f"✅ {tool} 已安装: {version}", 'green')
        
        if missing_tools:
            self.print_color(f"❌ Docker模式需要安装: {', '.join(missing_tools)}", 'red')
            return False
        
        # 检查Docker服务是否运行
        try:
            subprocess.run(['docker', 'ps'], check=True, 
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.print_color("✅ Docker服务正在运行", 'green')
        except subprocess.CalledProcessError:
            self.print_color("❌ Docker服务未运行，请启动Docker Desktop", 'red')
            return False
        
        return True

    def _check_hybrid_mode_env(self) -> bool:
        """检查混合模式环境"""
        # 混合模式需要本地和Docker的组合
        return self._check_local_mode_env() and self._check_docker_mode_env()

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

    def launch_mode_a(self):
        """启动a模式 - 本地部署方式"""
        self.print_color("🏠 启动a模式：本地部署方式", 'green')
        self.play_30s_mode_selection_music("本地开发")
        
        # 调用现有的本地启动脚本
        local_script = self.scripts_dir / 'start_local_system.py'
        
        if not local_script.exists():
            self.print_color("❌ 本地启动脚本不存在", 'red')
            return False
        
        try:
            self.print_color("🚀 正在调用本地系统启动器...", 'blue')
            process = subprocess.Popen([sys.executable, str(local_script)])
            self.running_processes.append(('local_system', process))
            
            self.print_color("✅ a模式（本地部署）启动成功！", 'green')
            self.display_mode_info("a", "本地部署方式", "http://localhost:3000", "http://localhost:8000")
            
            return True
            
        except Exception as e:
            self.print_color(f"❌ a模式启动失败: {e}", 'red')
            return False

    def launch_mode_b(self):
        """启动b模式 - Docker镜像模式"""
        self.print_color("🐳 启动b模式：Docker镜像模式", 'blue')
        self.play_30s_mode_selection_music("Docker容器")
        
        # 调用现有的Docker启动脚本
        docker_script = self.scripts_dir / 'launch_system.py'
        
        if not docker_script.exists():
            self.print_color("❌ Docker启动脚本不存在", 'red')
            return False
        
        try:
            self.print_color("🚀 正在调用Docker系统启动器...", 'blue')
            process = subprocess.Popen([sys.executable, str(docker_script)])
            self.running_processes.append(('docker_system', process))
            
            self.print_color("✅ b模式（Docker镜像）启动成功！", 'green')
            self.display_mode_info("b", "Docker镜像模式", "http://localhost:3000", "http://localhost:8000")
            
            return True
            
        except Exception as e:
            self.print_color(f"❌ b模式启动失败: {e}", 'red')
            return False

    def launch_mode_c(self):
        """启动c模式 - 混合模式"""
        self.print_color("⚡ 启动c模式：混合模式", 'yellow')
        self.play_30s_mode_selection_music("混合")
        
        try:
            # 第一步：启动Docker后端服务
            self.print_color("🐳 第一步：启动Docker后端服务...", 'blue')
            if not self._start_docker_backend():
                return False
            
            # 第二步：启动本地前端服务
            self.print_color("🎨 第二步：启动本地前端服务...", 'blue')
            if not self._start_local_frontend():
                return False
            
            self.print_color("✅ c模式（混合模式）启动成功！", 'green')
            self.display_mode_info("c", "混合模式", "http://localhost:3001", "http://localhost:8000")
            
            return True
            
        except Exception as e:
            self.print_color(f"❌ c模式启动失败: {e}", 'red')
            return False

    def _start_docker_backend(self) -> bool:
        """启动Docker后端服务"""
        try:
            os.chdir(self.project_root)
            
            # 停止现有容器
            subprocess.run(['docker-compose', 'down'], 
                         check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # 启动后端相关服务
            self.print_color("🗄️ 启动数据库和后端API容器...", 'cyan')
            result = subprocess.run(['docker-compose', 'up', '-d', 'postgres', 'redis', 'backend'], 
                                  check=True, capture_output=True, text=True)
            
            # 等待服务就绪
            self.print_color("⏳ 等待后端服务就绪...", 'yellow')
            time.sleep(15)
            
            return True
            
        except subprocess.CalledProcessError as e:
            self.print_color(f"❌ Docker后端启动失败: {e}", 'red')
            return False

    def _start_local_frontend(self) -> bool:
        """启动本地前端服务"""
        try:
            frontend_dir = self.project_root / 'frontend'
            
            if not frontend_dir.exists():
                self.print_color("❌ 前端目录不存在", 'red')
                return False
            
            # 安装依赖
            self.print_color("📦 安装前端依赖...", 'cyan')
            subprocess.run(['npm', 'install'], cwd=frontend_dir, 
                         check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # 修改前端配置以使用3001端口
            self._configure_frontend_for_hybrid()
            
            # 启动前端开发服务器
            self.print_color("🚀 启动前端开发服务器...", 'cyan')
            frontend_process = subprocess.Popen(
                ['npm', 'run', 'dev', '--', '--port', '3001'],
                cwd=frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            self.running_processes.append(('frontend', frontend_process))
            
            # 等待前端服务启动
            time.sleep(8)
            
            return True
            
        except subprocess.CalledProcessError as e:
            self.print_color(f"❌ 本地前端启动失败: {e}", 'red')
            return False

    def _configure_frontend_for_hybrid(self):
        """配置前端用于混合模式"""
        try:
            # 创建或更新前端环境配置
            frontend_env = self.project_root / 'frontend' / '.env.local'
            env_content = """# 混合模式配置
VITE_API_BASE_URL=http://localhost:8000
VITE_MODE=hybrid
"""
            frontend_env.write_text(env_content)
            self.print_color("✅ 前端混合模式配置已更新", 'green')
            
        except Exception as e:
            self.print_color(f"⚠️  前端配置更新失败: {e}", 'yellow')

    def display_mode_info(self, mode: str, mode_name: str, frontend_url: str, backend_url: str):
        """显示模式信息"""
        info = f"""
╔══════════════════════════════════════════════════════════════╗
║                    🎉 {mode}模式启动成功！                     ║
╚══════════════════════════════════════════════════════════════╝

🎯 启动模式: {mode_name}
🌐 前端界面: {frontend_url}
⚡ 后端API: {backend_url}
🕒 启动时间: {self.current_time}

💡 系统特性:
"""
        if mode == "a":
            info += """  🏠 本地开发模式 - 轻量级，无Docker依赖
  🚀 启动速度快，调试方便
  🗄️ 使用SQLite数据库，适合开发测试"""
        elif mode == "b":
            info += """  🐳 Docker容器模式 - 生产环境一致性
  🛡️ 环境隔离，部署可靠
  🗄️ 使用PostgreSQL数据库，适合生产部署"""
        elif mode == "c":
            info += """  ⚡ 混合模式 - 开发体验与生产一致性并重
  🎨 前端本地热重载，开发效率高
  🐳 后端容器化，数据一致性强"""

        info += f"""

🎵 30秒{mode_name}轻音乐正在播放...
📊 使用 Ctrl+C 停止所有服务

🔄 如需切换模式，请重新运行启动器"""

        self.print_color(info, 'green')

    def cleanup(self):
        """清理进程"""
        self.print_color("🔄 正在停止所有服务...", 'yellow')
        
        # 停止Python进程
        for service_name, process in self.running_processes:
            try:
                process.terminate()
                process.wait(timeout=5)
                self.print_color(f"✅ {service_name} 服务已停止", 'green')
            except subprocess.TimeoutExpired:
                process.kill()
                self.print_color(f"⚠️  强制停止 {service_name} 服务", 'yellow')
            except Exception as e:
                self.print_color(f"❌ 停止 {service_name} 服务失败: {e}", 'red')
        
        # 停止Docker容器（如果有的话）
        try:
            os.chdir(self.project_root)
            subprocess.run(['docker-compose', 'down'], 
                         check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.print_color("🐳 Docker容器已停止", 'green')
        except:
            pass

    def run_interactive_launcher(self):
        """运行交互式启动器"""
        self.display_main_banner()
        
        while True:
            try:
                choice = input("\n🎯 请选择启动模式 (a/b/c) 或 'q' 退出: ").strip().lower()
                
                if choice == 'q':
                    self.print_color("👋 退出启动器", 'yellow')
                    break
                elif choice == 'a':
                    if self.check_environment_for_mode('a'):
                        self.launch_mode_a()
                        break
                elif choice == 'b':
                    if self.check_environment_for_mode('b'):
                        self.launch_mode_b()
                        break
                elif choice == 'c':
                    if self.check_environment_for_mode('c'):
                        self.launch_mode_c()
                        break
                else:
                    self.print_color("❌ 无效选择，请输入 a、b、c 或 q", 'red')
                    continue
                    
            except KeyboardInterrupt:
                self.print_color("\n👋 收到中断信号...", 'yellow')
                break
        
        # 等待服务运行（如果启动了）
        if self.running_processes:
            try:
                self.print_color("\n🔄 系统正在运行中，按 Ctrl+C 停止服务", 'cyan')
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                self.print_color("\n👋 收到停止信号...", 'yellow')
                self.cleanup()

def main():
    """主函数"""
    launcher = ThreeModeSystemLauncher()
    
    def signal_handler(signum, frame):
        launcher.cleanup()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    if len(sys.argv) > 1:
        # 命令行模式
        mode = sys.argv[1].lower()
        if mode in ['a', 'b', 'c']:
            if launcher.check_environment_for_mode(mode):
                if mode == 'a':
                    launcher.launch_mode_a()
                elif mode == 'b':
                    launcher.launch_mode_b()
                elif mode == 'c':
                    launcher.launch_mode_c()
        else:
            print("❌ 无效模式，请使用 a、b 或 c")
            sys.exit(1)
    else:
        # 交互模式
        launcher.run_interactive_launcher()

if __name__ == "__main__":
    main() 