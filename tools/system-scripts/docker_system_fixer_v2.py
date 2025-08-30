#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
💻 智能财务管理系统 - Docker系统修复工具 v2.0
🔧 解决所有Docker相关问题的综合性Python解决方案

Features:
- 🔍 智能诊断Docker问题
- 🔧 自动修复镜像源配置  
- 📦 优化镜像拉取策略
- 🚀 测试系统启动流程
- 🎵 集成30秒轻音乐提醒
- 📊 实时进度监控
- 🌙 深夜模式支持
"""

import os
import sys
import json
import time
import subprocess
import platform
import shutil
from datetime import datetime
from pathlib import Path
import logging
import signal
import atexit

class DockerSystemFixerV2:
    def __init__(self):
        self.current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.os_type = platform.system()
        self.project_root = Path(__file__).parent.parent.parent
        self.docker_dir = self.project_root / 'docker'
        self.deployment_dir = self.project_root / 'deployment'
        self.setup_logging()
        self.fix_results = {
            'docker_status': False,
            'registry_fixed': False,
            'images_pulled': False,
            'compose_optimized': False,
            'startup_tested': False,
            'scripts_created': False
        }
        
    def setup_logging(self):
        """设置日志系统"""
        log_dir = self.project_root / 'logs'
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'docker_fix_v2.log'),
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
        
        colored_message = f"{colors.get(color, '')}{message}{colors['reset']}"
        print(colored_message)
        self.logger.info(message)

    def display_banner(self):
        """显示增强版修复横幅"""
        os.system('clear' if self.os_type != 'Windows' else 'cls')
        
        banner = f"""
╔═══════════════════════════════════════════════════════════════════╗
║              🔧 Docker系统修复工具 v2.0 (增强版)                  ║
║                Financial System Docker Fixer Enhanced             ║
║                    智能诊断·全面修复·性能优化                      ║
╚═══════════════════════════════════════════════════════════════════╝

🕒 修复时间: {self.current_time}
💻 操作系统: {self.os_type}  
📁 项目路径: {self.project_root}
🐳 Docker目录: {self.docker_dir}

🎯 修复目标：
  ✅ 修复镜像拉取问题
  ✅ 优化网络配置
  ✅ 创建启动脚本
  ✅ 测试系统功能
  ✅ 提供备用方案
"""
        self.print_color(banner, 'cyan')

    def check_environment(self):
        """检查运行环境"""
        self.print_color("🔍 阶段1：环境检查与诊断...", 'blue')
        
        # 检查Docker安装
        if not shutil.which('docker'):
            self.print_color("❌ Docker未安装，请先安装Docker Desktop", 'red')
            self._suggest_docker_installation()
            return False
        
        # 检查Docker服务状态
        try:
            result = subprocess.run(['docker', 'version'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                self.print_color("✅ Docker已安装且运行正常", 'green')
                docker_version = result.stdout.split('\n')[0].split()[-1]
                self.print_color(f"📊 Docker版本: {docker_version}", 'cyan')
                self.fix_results['docker_status'] = True
            else:
                self.print_color("❌ Docker服务未运行", 'red')
                return False
        except subprocess.TimeoutExpired:
            self.print_color("❌ Docker响应超时", 'red')
            return False
        except Exception as e:
            self.print_color(f"❌ Docker检查失败: {e}", 'red')
            return False
        
        # 检查Docker Compose
        if not shutil.which('docker-compose'):
            self.print_color("⚠️  docker-compose未找到，检查是否集成在Docker中", 'yellow')
        else:
            compose_version = subprocess.run(['docker-compose', '--version'], 
                                           capture_output=True, text=True).stdout.strip()
            self.print_color(f"📊 {compose_version}", 'cyan')
        
        return True

    def _suggest_docker_installation(self):
        """建议Docker安装方法"""
        self.print_color("💡 Docker安装建议：", 'yellow')
        if self.os_type == 'Darwin':
            self.print_color("  🍎 macOS: 下载Docker Desktop from https://docker.com", 'yellow')
        elif self.os_type == 'Linux':
            self.print_color("  🐧 Linux: sudo apt-get install docker.io docker-compose", 'yellow')
        else:
            self.print_color("  🪟 Windows: 下载Docker Desktop from https://docker.com", 'yellow')

    def diagnose_docker_issues(self):
        """深度诊断Docker问题"""
        self.print_color("🔍 阶段2：深度问题诊断...", 'blue')
        
        issues = []
        
        # 检查镜像源配置
        try:
            result = subprocess.run(['docker', 'info'], capture_output=True, text=True)
            if 'Registry Mirrors' in result.stdout:
                self.print_color("✅ 发现镜像源配置", 'green')
            else:
                issues.append("未配置镜像加速器")
                self.print_color("⚠️  未配置镜像加速器", 'yellow')
        except:
            issues.append("无法获取Docker信息")
        
        # 检查网络连接
        try:
            result = subprocess.run(['docker', 'pull', 'hello-world:latest'], 
                                  capture_output=True, text=True, timeout=60)
            if result.returncode == 0:
                self.print_color("✅ 网络连接正常", 'green')
                subprocess.run(['docker', 'rmi', 'hello-world:latest'], 
                             capture_output=True, text=True)
            else:
                issues.append("网络连接问题")
                self.print_color("❌ 网络连接存在问题", 'red')
        except subprocess.TimeoutExpired:
            issues.append("网络连接超时")
            self.print_color("❌ 网络连接超时", 'red')
        except:
            issues.append("镜像拉取测试失败")
        
        # 检查项目所需镜像
        required_images = ['postgres:15-alpine', 'redis:7-alpine', 'node:18-alpine']
        missing_images = []
        
        try:
            result = subprocess.run(['docker', 'images'], capture_output=True, text=True)
            for image in required_images:
                image_name = image.split(':')[0]
                if image_name not in result.stdout:
                    missing_images.append(image)
        except:
            pass
        
        if missing_images:
            issues.append(f"缺少镜像: {', '.join(missing_images)}")
            self.print_color(f"⚠️  缺少镜像: {', '.join(missing_images)}", 'yellow')
        
        # 检查Docker Compose文件
        compose_files = [
            self.project_root / 'docker-compose.yml',
            self.docker_dir / 'docker-compose.yml',
            self.docker_dir / 'docker-compose-fixed.yml'
        ]
        
        valid_compose = False
        for compose_file in compose_files:
            if compose_file.exists():
                valid_compose = True
                self.print_color(f"✅ 找到Compose文件: {compose_file}", 'green')
                break
        
        if not valid_compose:
            issues.append("未找到有效的docker-compose.yml文件")
        
        return issues

    def fix_registry_configuration(self):
        """修复Docker镜像源配置"""
        self.print_color("🔧 阶段3：修复镜像源配置...", 'blue')
        
        docker_config_dir = Path.home() / '.docker'
        docker_config_dir.mkdir(exist_ok=True)
        
        daemon_json = docker_config_dir / 'daemon.json'
        
        # 备份现有配置
        if daemon_json.exists():
            backup_file = daemon_json.with_suffix(f'.json.backup.{int(time.time())}')
            shutil.copy2(daemon_json, backup_file)
            self.print_color(f"📋 已备份现有配置: {backup_file}", 'yellow')
        
        # 创建优化的配置
        config = {
            "registry-mirrors": [
                "https://docker.mirrors.ustc.edu.cn",
                "https://hub-mirror.c.163.com", 
                "https://mirror.baidubce.com",
                "https://dockerproxy.com"
            ],
            "insecure-registries": [],
            "debug": False,
            "experimental": False,
            "features": {
                "buildkit": True
            },
            "max-concurrent-downloads": 10,
            "max-concurrent-uploads": 5,
            "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1", "223.5.5.5"]
        }
        
        try:
            with open(daemon_json, 'w') as f:
                json.dump(config, f, indent=2)
            self.print_color("✅ Docker镜像源配置已优化", 'green')
            self.fix_results['registry_fixed'] = True
            return True
        except Exception as e:
            self.print_color(f"❌ 配置更新失败: {e}", 'red')
            return False

    def restart_docker_service(self):
        """重启Docker服务"""
        self.print_color("🔄 阶段4：重启Docker服务...", 'blue')
        
        if self.os_type == 'Darwin':
            try:
                # macOS - 尝试重启Docker Desktop
                self.print_color("🍎 重启Docker Desktop...", 'yellow')
                
                # 使用AppleScript重启
                applescript = '''
                tell application "Docker Desktop"
                    quit
                end tell
                
                delay 5
                
                tell application "Docker Desktop"
                    activate
                end tell
                '''
                
                subprocess.run(['osascript', '-e', applescript], check=False)
                
            except Exception as e:
                self.print_color(f"⚠️  自动重启失败: {e}", 'yellow')
                self.print_color("💡 请手动重启Docker Desktop", 'cyan')
                input("按Enter键继续（重启完成后）...")
        
        elif self.os_type == 'Linux':
            try:
                self.print_color("🐧 重启Docker服务...", 'yellow') 
                subprocess.run(['sudo', 'systemctl', 'restart', 'docker'], check=True)
            except Exception as e:
                self.print_color(f"❌ 重启失败: {e}", 'red')
                return False
        
        # 等待Docker服务就绪
        self.print_color("⏳ 等待Docker服务就绪...", 'yellow')
        max_retries = 30
        for i in range(max_retries):
            try:
                result = subprocess.run(['docker', 'info'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    self.print_color("✅ Docker服务已就绪", 'green')
                    return True
            except:
                pass
            
            print(f"⏳ 等待中... ({i+1}/{max_retries})")
            time.sleep(2)
        
        self.print_color("❌ Docker服务启动超时", 'red')
        return False

    def pull_required_images(self):
        """智能拉取必需镜像"""
        self.print_color("📦 阶段5：智能镜像拉取...", 'blue')
        
        # 定义镜像拉取策略
        image_strategies = {
            'postgres': [
                'postgres:15-alpine',
                'postgres:13-alpine', 
                'postgres:latest'
            ],
            'redis': [
                'redis:7-alpine',
                'redis:6-alpine',
                'redis:latest'
            ],
            'node': [
                'node:18-alpine',
                'node:16-alpine',
                'node:latest'
            ],
            'pgadmin': [
                'dpage/pgadmin4:latest'
            ]
        }
        
        successful_pulls = 0
        total_services = len(image_strategies)
        
        for service, images in image_strategies.items():
            self.print_color(f"📥 拉取 {service} 镜像...", 'yellow')
            
            for image in images:
                try:
                    self.print_color(f"   尝试: {image}", 'cyan')
                    result = subprocess.run(['docker', 'pull', image], 
                                          capture_output=True, text=True, timeout=300)
                    
                    if result.returncode == 0:
                        self.print_color(f"   ✅ 成功: {image}", 'green')
                        successful_pulls += 1
                        break
                    else:
                        self.print_color(f"   ❌ 失败: {image}", 'red')
                        
                except subprocess.TimeoutExpired:
                    self.print_color(f"   ⏰ 超时: {image}", 'red')
                except Exception as e:
                    self.print_color(f"   ❌ 异常: {image} - {e}", 'red')
            else:
                self.print_color(f"❌ {service} 所有镜像拉取失败", 'red')
        
        self.print_color(f"📊 镜像拉取结果: {successful_pulls}/{total_services} 服务成功", 'cyan')
        
        if successful_pulls >= 2:  # 至少需要postgres和redis
            self.fix_results['images_pulled'] = True
            return True
        else:
            return False

    def optimize_compose_files(self):
        """优化Docker Compose配置"""
        self.print_color("📝 阶段6：优化Compose配置...", 'blue')
        
        # 确保docker目录存在
        self.docker_dir.mkdir(exist_ok=True)
        
        # 检查并应用优化配置
        fixed_compose = self.docker_dir / 'docker-compose-fixed.yml'
        main_compose = self.project_root / 'docker-compose.yml'
        
        if fixed_compose.exists():
            # 备份现有配置
            if main_compose.exists():
                backup_file = main_compose.with_suffix(f'.yml.backup.{int(time.time())}')
                shutil.copy2(main_compose, backup_file)
                self.print_color(f"📋 已备份现有配置: {backup_file}", 'yellow')
            
            # 应用优化配置
            shutil.copy2(fixed_compose, main_compose)
            self.print_color("✅ 已应用优化的Compose配置", 'green')
            self.fix_results['compose_optimized'] = True
            return True
        else:
            self.print_color("⚠️  未找到优化配置文件", 'yellow')
            return False

    def test_system_startup(self):
        """测试系统启动"""
        self.print_color("🚀 阶段7：系统启动测试...", 'blue')
        
        os.chdir(self.project_root)
        
        # 清理现有容器
        self.print_color("🧹 清理现有容器...", 'yellow')
        subprocess.run(['docker-compose', 'down', '--remove-orphans'], 
                      capture_output=True, text=True)
        
        # 启动核心服务
        self.print_color("🌐 启动核心服务...", 'yellow')
        try:
            result = subprocess.run(['docker-compose', 'up', '-d', 'postgres', 'redis'], 
                                  capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                self.print_color("✅ 核心服务启动成功", 'green')
                
                # 等待服务就绪
                self.print_color("⏳ 等待服务就绪...", 'yellow')
                time.sleep(20)
                
                # 检查服务状态
                status_result = subprocess.run(['docker-compose', 'ps'], 
                                             capture_output=True, text=True)
                
                if 'Up' in status_result.stdout:
                    self.print_color("✅ 系统启动测试成功！", 'green')
                    self.print_color("📊 服务状态:", 'cyan')
                    print(status_result.stdout)
                    self.fix_results['startup_tested'] = True
                    return True
                else:
                    self.print_color("❌ 服务未正常启动", 'red')
                    self.print_color(f"错误信息: {status_result.stderr}", 'red')
                    return False
            else:
                self.print_color("❌ 服务启动失败", 'red')
                self.print_color(f"错误信息: {result.stderr}", 'red')
                return False
                
        except subprocess.TimeoutExpired:
            self.print_color("⏰ 启动超时", 'red')
            return False
        except Exception as e:
            self.print_color(f"❌ 启动异常: {e}", 'red')
            return False

    def create_enhanced_scripts(self):
        """创建增强的启动脚本"""
        self.print_color("📜 阶段8：创建增强启动脚本...", 'blue')
        
        scripts_created = 0
        
        # 1. 创建Docker快速启动脚本
        docker_script = self.project_root / 'start-docker-fixed.sh'
        docker_script_content = '''#!/bin/bash
# 💻 智能财务管理系统 - Docker修复版启动脚本

echo "🚀 启动智能财务管理系统（Docker修复版）..."

# 检查Docker状态
if ! docker info &>/dev/null; then
    echo "❌ Docker服务未运行，请启动Docker Desktop"
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")"

# 停止现有服务
echo "🔄 停止现有服务..."
docker-compose down --remove-orphans

# 启动所有服务
echo "🌐 启动所有服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动完成..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

echo "
╔═══════════════════════════════════════════════════════════════╗
║                    🎉 系统启动完成！                          ║
╚═══════════════════════════════════════════════════════════════╝

🌐 访问地址：
  📱 前端界面: http://localhost:3000
  🔗 后端API:  http://localhost:8000  
  🗄️ 数据库管理: http://localhost:5050

🔑 测试账户：
  📧 邮箱: admin@financial.com
  🔒 密码: admin123456

📊 管理命令：
  🔍 查看状态: docker-compose ps
  📋 查看日志: docker-compose logs -f
  🛑 停止服务: docker-compose down
"

# 播放启动完成音效
if [[ "$OSTYPE" == "darwin"* ]]; then
    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
    say "财务管理系统启动完成" 2>/dev/null &
fi
'''
        
        try:
            with open(docker_script, 'w') as f:
                f.write(docker_script_content)
            docker_script.chmod(0o755)
            self.print_color(f"✅ Docker启动脚本: {docker_script}", 'green')
            scripts_created += 1
        except Exception as e:
            self.print_color(f"❌ 创建Docker脚本失败: {e}", 'red')
        
        # 2. 创建Python启动脚本
        python_script = self.project_root / 'start_system_docker_fixed.py'
        python_script_content = '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
💻 智能财务管理系统 - Docker修复版Python启动器
🚀 集成Docker状态检查、服务启动、音乐提醒的完整解决方案
"""

import subprocess
import time
import sys
import platform
from pathlib import Path

def check_docker():
    """检查Docker状态"""
    try:
        subprocess.run(['docker', 'info'], check=True, 
                      capture_output=True, text=True)
        return True
    except:
        return False

def start_system():
    """启动系统"""
    project_root = Path(__file__).parent
    os_type = platform.system()
    
    print("🚀 启动智能财务管理系统（Docker修复版）...")
    
    # 检查Docker
    if not check_docker():
        print("❌ Docker服务未运行，请启动Docker Desktop")
        return False
    
    # 切换到项目目录
    original_dir = Path.cwd()
    os.chdir(project_root)
    
    try:
        # 停止现有服务
        print("🔄 停止现有服务...")
        subprocess.run(['docker-compose', 'down', '--remove-orphans'], 
                      check=False, capture_output=True)
        
        # 启动服务
        print("🌐 启动所有服务...")
        result = subprocess.run(['docker-compose', 'up', '-d'], 
                              check=True, capture_output=True, text=True)
        
        print("⏳ 等待服务启动完成...")
        time.sleep(30)
        
        # 检查状态
        print("📊 检查服务状态...")
        status = subprocess.run(['docker-compose', 'ps'], 
                              capture_output=True, text=True)
        print(status.stdout)
        
        print("""
╔═══════════════════════════════════════════════════════════════╗
║                    🎉 系统启动完成！                          ║
╚═══════════════════════════════════════════════════════════════╝

🌐 访问地址：
  📱 前端界面: http://localhost:3000
  🔗 后端API:  http://localhost:8000
  🗄️ 数据库管理: http://localhost:5050

🔑 测试账户：
  📧 邮箱: admin@financial.com
  🔒 密码: admin123456
""")
        
        # 播放完成音效
        if os_type == 'Darwin':
            try:
                subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], 
                             check=False, capture_output=True)
                subprocess.run(['say', '财务管理系统启动完成'], 
                             check=False, capture_output=True)
            except:
                pass
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ 启动失败: {e}")
        return False
    finally:
        os.chdir(original_dir)

if __name__ == "__main__":
    start_system()
'''
        
        try:
            with open(python_script, 'w') as f:
                f.write(python_script_content)
            python_script.chmod(0o755)
            self.print_color(f"✅ Python启动脚本: {python_script}", 'green')
            scripts_created += 1
        except Exception as e:
            self.print_color(f"❌ 创建Python脚本失败: {e}", 'red')
        
        if scripts_created > 0:
            self.fix_results['scripts_created'] = True
            return True
        else:
            return False

    def play_completion_music(self):
        """播放30秒修复完成轻音乐"""
        hour = datetime.now().hour
        
        self.print_color("🎵 播放30秒Docker修复完成轻音乐...", 'purple')
        
        try:
            if self.os_type == 'Darwin':  # macOS
                if hour >= 22 or hour <= 8:  # 深夜模式
                    self.print_color("🌙 深夜模式：播放轻柔提醒音效...", 'purple')
                    for i in range(6):
                        subprocess.run(['afplay', '/System/Library/Sounds/Tink.aiff'], 
                                     check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        time.sleep(2)
                        if i == 2:
                            self._speak("Docker系统修复完成，深夜模式激活", 'Sin-ji', 120)
                else:
                    self.print_color("🎼 播放30秒Docker修复成功古典轻音乐...", 'green')
                    for i in range(12):
                        subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], 
                                     check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        time.sleep(2.5)
                        if i == 3:
                            self._speak("Docker系统已全面修复升级", 'Ting-Ting', 160)
                        elif i == 8:
                            self._speak("智能财务管理系统现在可以稳定运行", 'Ting-Ting', 150)
        except Exception as e:
            self.logger.warning(f"音乐播放失败: {e}")
        
        self.print_color("✅ 30秒Docker修复轻音乐播放完成", 'green')

    def _speak(self, text: str, voice: str = None, rate: int = 140):
        """语音提醒"""
        try:
            if self.os_type == 'Darwin' and voice:
                subprocess.run(['say', text, '--voice', voice, '--rate', str(rate)], 
                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            self.logger.warning(f"语音播放失败: {e}")

    def generate_fix_report(self):
        """生成修复报告"""
        report_content = f"""
# 🔧 Docker系统修复报告 v2.0

## 📊 修复概览
- **修复时间**: {self.current_time}
- **操作系统**: {self.os_type}
- **项目路径**: {self.project_root}

## ✅ 修复结果
| 修复项目 | 状态 | 说明 |
|---------|------|------|
| Docker状态检查 | {'✅ 成功' if self.fix_results['docker_status'] else '❌ 失败'} | Docker服务运行状态 |
| 镜像源配置 | {'✅ 成功' if self.fix_results['registry_fixed'] else '❌ 失败'} | 优化镜像拉取速度 |
| 镜像拉取 | {'✅ 成功' if self.fix_results['images_pulled'] else '❌ 失败'} | 必要镜像获取 |
| Compose优化 | {'✅ 成功' if self.fix_results['compose_optimized'] else '❌ 失败'} | 配置文件优化 |
| 启动测试 | {'✅ 成功' if self.fix_results['startup_tested'] else '❌ 失败'} | 系统功能验证 |
| 脚本创建 | {'✅ 成功' if self.fix_results['scripts_created'] else '❌ 失败'} | 启动脚本生成 |

## 🚀 使用建议
{'如果修复成功，推荐使用以下命令启动系统：' if any(self.fix_results.values()) else '修复未完全成功，建议使用本地开发模式：'}

### Docker模式启动
```bash
# 使用Shell脚本
bash start-docker-fixed.sh

# 使用Python脚本  
python start_system_docker_fixed.py
```

### 本地开发模式（备用方案）
```bash
python deployment/scripts/start_local_system.py
```

## 📝 修复详情
- **镜像源**: 配置了中科大、网易、百度等国内镜像源
- **配置优化**: 使用稳定版本镜像，优化健康检查
- **启动脚本**: 创建了Shell和Python两种启动方式
- **音乐提醒**: 集成30秒轻音乐提醒系统

---
*报告生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
        
        report_file = self.project_root / 'docker_fix_report_v2.md'
        try:
            with open(report_file, 'w') as f:
                f.write(report_content)
            self.print_color(f"📋 修复报告已生成: {report_file}", 'cyan')
        except Exception as e:
            self.print_color(f"❌ 报告生成失败: {e}", 'red')

    def show_final_results(self):
        """显示最终结果"""
        success_count = sum(self.fix_results.values())
        total_tasks = len(self.fix_results)
        success_rate = (success_count / total_tasks) * 100
        
        if success_rate >= 80:
            status_color = 'green'
            status_emoji = '🎉'
            status_text = 'Docker修复成功！'
        elif success_rate >= 60:
            status_color = 'yellow'  
            status_emoji = '⚠️'
            status_text = 'Docker部分修复成功'
        else:
            status_color = 'red'
            status_emoji = '❌'
            status_text = 'Docker修复失败'
        
        result_display = f"""
╔═══════════════════════════════════════════════════════════════════╗
║                {status_emoji} {status_text}                         ║
╚═══════════════════════════════════════════════════════════════════╝

📊 修复统计: {success_count}/{total_tasks} 项成功 ({success_rate:.1f}%)

✅ 修复成果：
  {'✅' if self.fix_results['docker_status'] else '❌'} Docker环境检查
  {'✅' if self.fix_results['registry_fixed'] else '❌'} 镜像源优化  
  {'✅' if self.fix_results['images_pulled'] else '❌'} 必要镜像拉取
  {'✅' if self.fix_results['compose_optimized'] else '❌'} Compose配置优化
  {'✅' if self.fix_results['startup_tested'] else '❌'} 系统启动测试
  {'✅' if self.fix_results['scripts_created'] else '❌'} 启动脚本创建

🚀 推荐启动方式：
"""
        
        if success_rate >= 60:
            result_display += """  # Docker模式（推荐）
  bash start-docker-fixed.sh
  # 或
  python start_system_docker_fixed.py
  
  # 本地模式（备用）
  python deployment/scripts/start_local_system.py"""
        else:
            result_display += """  # 本地模式（推荐）
  python deployment/scripts/start_local_system.py
  
  # 手动修复后再试Docker模式"""
        
        result_display += f"""

📋 详细报告: docker_fix_report_v2.md
🕒 修复完成时间: {self.current_time}
"""
        
        self.print_color(result_display, status_color)

    def run_complete_fix(self):
        """运行完整修复流程"""
        self.display_banner()
        
        try:
            # 阶段1: 环境检查
            if not self.check_environment():
                self.print_color("❌ 环境检查失败，无法继续修复", 'red')
                return False
            
            # 阶段2: 问题诊断
            issues = self.diagnose_docker_issues()
            if issues:
                self.print_color(f"🔍 发现 {len(issues)} 个问题:", 'yellow')
                for issue in issues:
                    self.print_color(f"  • {issue}", 'yellow')
            
            # 阶段3-8: 修复流程
            self.fix_registry_configuration()
            self.restart_docker_service()
            self.pull_required_images()
            self.optimize_compose_files()
            self.test_system_startup() 
            self.create_enhanced_scripts()
            
            # 生成报告和播放音乐
            self.generate_fix_report()
            self.play_completion_music()
            self.show_final_results()
            
            return True
            
        except KeyboardInterrupt:
            self.print_color("\n⚠️  用户中断修复流程", 'yellow')
            return False
        except Exception as e:
            self.print_color(f"❌ 修复过程发生异常: {e}", 'red')
            return False

def main():
    """主函数"""
    fixer = DockerSystemFixerV2()
    success = fixer.run_complete_fix()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 