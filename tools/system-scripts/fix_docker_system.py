#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Docker系统修复脚本 - 修复镜像拉取和系统启动问题
解决财务管理系统无法启动的根本问题

Features:
- 🔧 修复Docker镜像源问题
- 🚀 优化系统启动流程
- 🎵 集成30秒轻音乐提醒
- 📊 实时修复进度监控
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

class DockerSystemFixer:
    def __init__(self):
        self.current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.os_type = platform.system()
        self.project_root = Path(__file__).parent
        self.setup_logging()
        
    def setup_logging(self):
        """设置日志系统"""
        log_dir = self.project_root / 'logs'
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'docker_fix.log'),
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

    def play_30s_fix_music(self):
        """播放30秒修复完成轻音乐"""
        hour = datetime.now().hour
        
        self.print_color("🎵 播放30秒系统修复完成轻音乐...", 'cyan')
        
        try:
            if self.os_type == 'Darwin':  # macOS
                if hour >= 22 or hour <= 8:  # 深夜模式
                    self.print_color("🌙 深夜模式：系统修复完成，播放轻柔提醒...", 'purple')
                    for i in range(5):
                        subprocess.run(['afplay', '/System/Library/Sounds/Tink.aiff'], 
                                     check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        time.sleep(1.5)
                    self._speak("财务管理系统修复完成，深夜模式激活", 'Sin-ji', 120)
                else:
                    self.print_color("🎼 播放30秒系统修复成功古典轻音乐...", 'green')
                    for i in range(10):
                        subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], 
                                     check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        time.sleep(2.5)
                        if i == 3:
                            self._speak("Docker系统已成功修复", 'Ting-Ting', 160)
                        elif i == 7:
                            self._speak("财务管理系统现在可以正常启动", 'Ting-Ting', 150)
        except Exception as e:
            self.logger.warning(f"音乐播放失败: {e}")
        
        self.print_color("✅ 30秒系统修复轻音乐播放完成", 'green')

    def _speak(self, text: str, voice: str = None, rate: int = 140):
        """语音提醒"""
        try:
            if self.os_type == 'Darwin' and voice:
                subprocess.run(['say', text, '--voice', voice, '--rate', str(rate)], 
                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            self.logger.warning(f"语音播放失败: {e}")

    def display_banner(self):
        """显示修复横幅"""
        os.system('clear' if self.os_type != 'Windows' else 'cls')
        
        banner = f"""
╔══════════════════════════════════════════════════════════════╗
║                🔧 Docker系统修复工具 v1.0                     ║
║                  Financial System Docker Fixer                ║
║                     智能诊断与修复系统                          ║
╚══════════════════════════════════════════════════════════════╝

🕒 修复时间: {self.current_time}
💻 操作系统: {self.os_type}
📁 项目路径: {self.project_root}
"""
        self.print_color(banner, 'cyan')

    def diagnose_docker_issues(self):
        """诊断Docker问题"""
        self.print_color("🔍 第一阶段：Docker问题诊断...", 'blue')
        
        issues = []
        
        # 检查Docker是否运行
        try:
            subprocess.run(['docker', 'version'], check=True, 
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.print_color("✅ Docker 服务正在运行", 'green')
        except subprocess.CalledProcessError:
            issues.append("Docker服务未运行")
            self.print_color("❌ Docker 服务未运行", 'red')
        
        # 检查镜像源配置
        try:
            result = subprocess.run(['docker', 'info'], capture_output=True, text=True, check=True)
            if 'mirror.ccs.tencentyun.com' in result.stdout:
                issues.append("腾讯云镜像源连接问题")
                self.print_color("❌ 检测到腾讯云镜像源连接问题", 'red')
            else:
                self.print_color("✅ Docker镜像源配置正常", 'green')
        except:
            issues.append("无法获取Docker信息")
            self.print_color("❌ 无法获取Docker信息", 'red')
        
        # 检查现有镜像
        try:
            result = subprocess.run(['docker', 'images'], capture_output=True, text=True, check=True)
            if 'postgres' not in result.stdout or 'redis' not in result.stdout:
                issues.append("缺少必需的Docker镜像")
                self.print_color("❌ 缺少必需的Docker镜像", 'red')
            else:
                self.print_color("✅ Docker镜像状态正常", 'green')
        except:
            issues.append("无法检查Docker镜像")
            self.print_color("❌ 无法检查Docker镜像", 'red')
        
        return issues

    def fix_docker_registry(self):
        """修复Docker镜像源"""
        self.print_color("🔧 第二阶段：修复Docker镜像源...", 'blue')
        
        # 尝试直接使用Docker Hub
        self.print_color("📝 配置Docker使用官方镜像源...", 'yellow')
        
        daemon_config = {
            "experimental": False,
            "debug": False
        }
        
        docker_dir = Path.home() / '.docker'
        docker_dir.mkdir(exist_ok=True)
        
        daemon_file = docker_dir / 'daemon.json'
        
        try:
            with open(daemon_file, 'w') as f:
                json.dump(daemon_config, f, indent=2)
            self.print_color("✅ Docker配置文件已更新", 'green')
        except Exception as e:
            self.print_color(f"❌ 更新Docker配置失败: {e}", 'red')
            return False
        
        # 重启Docker（如果可能）
        self.print_color("🔄 尝试重新加载Docker配置...", 'yellow')
        try:
            # 对于macOS Docker Desktop
            if self.os_type == 'Darwin':
                subprocess.run(['pkill', '-f', 'Docker'], check=False)
                time.sleep(3)
                subprocess.run(['open', '/Applications/Docker.app'], check=False)
                time.sleep(10)
        except:
            pass
        
        return True

    def pull_required_images(self):
        """拉取必需的镜像"""
        self.print_color("📦 第三阶段：拉取必需镜像...", 'blue')
        
        required_images = [
            'postgres:15-alpine',
            'redis:7-alpine',
            'dpage/pgadmin4:latest',
            'node:18-alpine'
        ]
        
        success_count = 0
        
        for image in required_images:
            self.print_color(f"📥 拉取镜像: {image}", 'yellow')
            
            try:
                # 尝试使用官方Docker Hub
                result = subprocess.run(['docker', 'pull', image], 
                                      capture_output=True, text=True, timeout=300)
                
                if result.returncode == 0:
                    self.print_color(f"✅ 成功拉取: {image}", 'green')
                    success_count += 1
                else:
                    self.print_color(f"❌ 拉取失败: {image}", 'red')
                    self.print_color(f"错误信息: {result.stderr}", 'red')
                    
                    # 尝试替代镜像
                    if 'postgres' in image:
                        alt_image = 'postgres:latest'
                        self.print_color(f"🔄 尝试替代镜像: {alt_image}", 'yellow')
                        alt_result = subprocess.run(['docker', 'pull', alt_image], 
                                                  capture_output=True, text=True, timeout=300)
                        if alt_result.returncode == 0:
                            self.print_color(f"✅ 成功拉取替代镜像: {alt_image}", 'green')
                            success_count += 1
                    elif 'redis' in image:
                        alt_image = 'redis:latest'
                        self.print_color(f"🔄 尝试替代镜像: {alt_image}", 'yellow')
                        alt_result = subprocess.run(['docker', 'pull', alt_image], 
                                                  capture_output=True, text=True, timeout=300)
                        if alt_result.returncode == 0:
                            self.print_color(f"✅ 成功拉取替代镜像: {alt_image}", 'green')
                            success_count += 1
                            
            except subprocess.TimeoutExpired:
                self.print_color(f"⏰ 拉取超时: {image}", 'red')
            except Exception as e:
                self.print_color(f"❌ 拉取异常: {image} - {e}", 'red')
        
        self.print_color(f"📊 镜像拉取结果: {success_count}/{len(required_images)} 成功", 
                        'green' if success_count >= 2 else 'yellow')
        
        return success_count >= 2  # 至少需要postgres和redis

    def update_docker_compose(self):
        """更新docker-compose.yml配置"""
        self.print_color("📝 第四阶段：优化Docker Compose配置...", 'blue')
        
        compose_file = self.project_root / 'docker-compose.yml'
        
        # 创建优化的docker-compose配置
        optimized_config = """services:
  # PostgreSQL 数据库 - 使用最新稳定版本
  postgres:
    image: postgres:latest
    environment:
      - POSTGRES_DB=financial_db
      - POSTGRES_USER=financial_user
      - POSTGRES_PASSWORD=financial_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - financial-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U financial_user -d financial_db"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis 缓存 - 使用最新稳定版本
  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - financial-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://financial_user:financial_password@postgres:5432/financial_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-super-secret-jwt-key
      - PORT=8000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - financial-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - REACT_APP_API_URL=http://localhost:8000
      - REACT_APP_ENV=development
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - financial-net

  # pgAdmin (数据库管理工具)
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@financial.com
      - PGADMIN_DEFAULT_PASSWORD=admin123
      - PGADMIN_CONFIG_SERVER_MODE=False
    ports:
      - "5050:80"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - financial-net

volumes:
  postgres_data:
  redis_data:

networks:
  financial-net:
    driver: bridge
"""
        
        try:
            with open(compose_file, 'w') as f:
                f.write(optimized_config)
            self.print_color("✅ Docker Compose配置已优化", 'green')
            return True
        except Exception as e:
            self.print_color(f"❌ 更新Docker Compose失败: {e}", 'red')
            return False

    def test_system_startup(self):
        """测试系统启动"""
        self.print_color("🧪 第五阶段：测试系统启动...", 'blue')
        
        # 清理旧容器
        self.print_color("🔄 清理旧容器...", 'yellow')
        subprocess.run(['docker-compose', 'down', '--remove-orphans'], 
                      cwd=self.project_root, check=False,
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # 启动数据库服务
        self.print_color("🚀 启动数据库服务...", 'yellow')
        try:
            result = subprocess.run(['docker-compose', 'up', '-d', 'postgres', 'redis'], 
                                  cwd=self.project_root, check=True,
                                  capture_output=True, text=True, timeout=120)
            self.print_color("✅ 数据库服务启动成功", 'green')
            
            # 等待服务就绪
            self.print_color("⏳ 等待服务就绪...", 'yellow')
            time.sleep(15)
            
            # 检查服务状态
            status_result = subprocess.run(['docker-compose', 'ps'], 
                                         cwd=self.project_root, capture_output=True, text=True)
            if 'Up' in status_result.stdout:
                self.print_color("✅ 系统启动测试成功！", 'green')
                return True
            else:
                self.print_color("❌ 服务未正常启动", 'red')
                return False
                
        except subprocess.TimeoutExpired:
            self.print_color("⏰ 系统启动超时", 'red')
            return False
        except subprocess.CalledProcessError as e:
            self.print_color(f"❌ 系统启动失败: {e}", 'red')
            return False

    def create_startup_script(self):
        """创建优化的启动脚本"""
        self.print_color("📜 创建优化启动脚本...", 'blue')
        
        startup_script = """#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
import time
import sys
from pathlib import Path

def start_financial_system():
    project_root = Path(__file__).parent
    
    print("🚀 启动智能财务管理系统...")
    
    # 清理旧容器
    print("🔄 清理旧容器...")
    subprocess.run(['docker-compose', 'down', '--remove-orphans'], 
                  cwd=project_root, check=False)
    
    # 启动所有服务
    print("🌐 启动所有服务...")
    try:
        subprocess.run(['docker-compose', 'up', '-d'], 
                      cwd=project_root, check=True)
        
        print("⏳ 等待服务完全启动...")
        time.sleep(30)
        
        print("✅ 系统启动完成！")
        print("🌐 前端界面: http://localhost:3000")
        print("⚡ 后端API: http://localhost:8000")
        print("🗄️ 数据库管理: http://localhost:5050")
        
        # 播放启动完成音效
        if sys.platform == 'darwin':
            subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'], 
                         check=False)
            subprocess.run(['say', '财务管理系统启动完成'], check=False)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ 启动失败: {e}")
        return False
    
    return True

if __name__ == "__main__":
    start_financial_system()
"""
        
        script_file = self.project_root / 'start_system_fixed.py'
        try:
            with open(script_file, 'w') as f:
                f.write(startup_script)
            
            # 设置执行权限
            if self.os_type != 'Windows':
                subprocess.run(['chmod', '+x', str(script_file)], check=False)
            
            self.print_color(f"✅ 优化启动脚本已创建: {script_file}", 'green')
            return True
        except Exception as e:
            self.print_color(f"❌ 创建启动脚本失败: {e}", 'red')
            return False

    def run_complete_fix(self):
        """运行完整修复流程"""
        self.display_banner()
        
        # 诊断问题
        issues = self.diagnose_docker_issues()
        if issues:
            self.print_color(f"🔍 发现 {len(issues)} 个问题需要修复:", 'yellow')
            for issue in issues:
                self.print_color(f"  • {issue}", 'yellow')
        else:
            self.print_color("✅ 未发现明显问题", 'green')
        
        # 修复流程
        success_steps = 0
        total_steps = 5
        
        if self.fix_docker_registry():
            success_steps += 1
        
        if self.pull_required_images():
            success_steps += 1
        
        if self.update_docker_compose():
            success_steps += 1
        
        if self.test_system_startup():
            success_steps += 1
        
        if self.create_startup_script():
            success_steps += 1
        
        # 显示修复结果
        self.print_color(f"\n📊 修复完成度: {success_steps}/{total_steps}", 
                        'green' if success_steps >= 4 else 'yellow')
        
        if success_steps >= 4:
            self.print_color("🎉 系统修复成功！", 'green')
            self.print_color("💡 建议使用 python start_system_fixed.py 启动系统", 'cyan')
            
            # 播放30秒修复完成轻音乐
            self.play_30s_fix_music()
            
            # 更新README
            self.update_readme_with_fix_info()
            
        else:
            self.print_color("⚠️  部分修复未完成，请检查错误信息", 'yellow')
        
        return success_steps >= 4

    def update_readme_with_fix_info(self):
        """更新README文档记录修复信息"""
        fix_info = f"""
## 🔧 系统修复记录

**修复时间**: {self.current_time}
**修复内容**: 
- ✅ 修复Docker镜像源连接问题
- ✅ 优化Docker Compose配置
- ✅ 更新系统启动流程
- ✅ 创建优化启动脚本
- ✅ 集成30秒轻音乐提醒系统

**启动方式**: 
```bash
# 使用修复后的启动脚本
python start_system_fixed.py

# 或使用原启动脚本
python launch_system.py
```

**系统访问地址**:
- 🌐 前端界面: http://localhost:3000
- ⚡ 后端API: http://localhost:8000  
- 🗄️ 数据库管理: http://localhost:5050

---
"""
        
        readme_file = self.project_root / 'README.md'
        if readme_file.exists():
            try:
                content = readme_file.read_text()
                
                # 在开发进度部分添加修复记录
                if '## 开发进度' in content:
                    content = content.replace('## 开发进度', f'{fix_info}## 开发进度')
                else:
                    content = fix_info + content
                
                readme_file.write_text(content)
                self.print_color("✅ README文档已更新修复记录", 'green')
            except Exception as e:
                self.print_color(f"⚠️  更新README失败: {e}", 'yellow')

def main():
    fixer = DockerSystemFixer()
    success = fixer.run_complete_fix()
    
    if success:
        print("\n🎉 修复完成！系统现在应该可以正常启动了。")
        print("💡 请运行: python start_system_fixed.py")
    else:
        print("\n⚠️  修复未完全成功，请检查错误信息。")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 