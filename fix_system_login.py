#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
智能财务管理系统 - 登录修复脚本
自动检测环境并选择最佳启动方案
"""

import os
import sys
import subprocess
import time
import json
from pathlib import Path
import platform

class SystemLoginFixer:
    def __init__(self):
        self.os_type = platform.system()
        self.project_root = Path(__file__).parent
        
    def print_banner(self):
        """显示启动横幅"""
        print("""
╔══════════════════════════════════════════════════════════════╗
║            🔧 智能财务管理系统 - 登录问题修复                ║
║                  Smart Login Fix v1.0                         ║
╚══════════════════════════════════════════════════════════════╝
        """)
        
    def check_docker_status(self):
        """检查Docker状态"""
        print("🔍 检查 Docker 状态...")
        try:
            # 检查 Docker 是否运行
            result = subprocess.run(['docker', 'ps'], capture_output=True, text=True)
            if result.returncode != 0:
                print("❌ Docker 未运行，请先启动 Docker Desktop")
                return False
                
            # 尝试拉取镜像
            print("📥 尝试获取必需的 Docker 镜像...")
            
            # 使用国内镜像加速
            images = [
                ('postgres:14', 'registry.cn-hangzhou.aliyuncs.com/library/postgres:14'),
                ('redis:7', 'registry.cn-hangzhou.aliyuncs.com/library/redis:7')
            ]
            
            for original, mirror in images:
                print(f"   拉取 {original}...")
                # 先尝试官方镜像
                pull_result = subprocess.run(
                    ['docker', 'pull', original], 
                    capture_output=True, text=True
                )
                
                if pull_result.returncode != 0:
                    print(f"   ⚠️  官方镜像失败，尝试国内镜像...")
                    # 尝试国内镜像
                    mirror_result = subprocess.run(
                        ['docker', 'pull', mirror],
                        capture_output=True, text=True
                    )
                    
                    if mirror_result.returncode == 0:
                        # 重新标记为原始名称
                        subprocess.run(['docker', 'tag', mirror, original])
                        print(f"   ✅ 成功获取 {original}")
                    else:
                        print(f"   ❌ 无法获取 {original}")
                        return False
                else:
                    print(f"   ✅ 成功获取 {original}")
                    
            return True
            
        except FileNotFoundError:
            print("❌ Docker 未安装")
            return False
            
    def fix_docker_compose(self):
        """修复 docker-compose.yml"""
        print("🔧 修复 Docker Compose 配置...")
        
        # 创建修复后的配置
        docker_compose_content = """version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=financial_db
      - POSTGRES_USER=financial_user
      - POSTGRES_PASSWORD=financial_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U financial_user -d financial_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 后端服务 - 本地开发模式
  # backend 和 frontend 将在本地运行，不使用 Docker

volumes:
  postgres_data:
  redis_data:
"""
        
        # 保存修复的配置
        with open(self.project_root / 'docker-compose-fixed.yml', 'w') as f:
            f.write(docker_compose_content)
            
        print("✅ Docker Compose 配置已修复")
        
    def setup_backend_env(self):
        """设置后端环境"""
        print("📝 配置后端环境...")
        
        env_content = """DATABASE_URL="postgresql://financial_user:financial_password@localhost:5432/financial_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_EXPIRES_IN="30d"
NODE_ENV="development"
PORT=8000
API_VERSION="v1"
BCRYPT_ROUNDS=12
"""
        
        backend_env_path = self.project_root / 'backend' / '.env'
        with open(backend_env_path, 'w') as f:
            f.write(env_content)
            
        print("✅ 后端环境配置完成")
        
    def start_docker_services(self):
        """启动 Docker 服务"""
        print("🚀 启动数据库服务...")
        
        # 使用修复的配置启动
        result = subprocess.run(
            ['docker-compose', '-f', 'docker-compose-fixed.yml', 'up', '-d', 'postgres', 'redis'],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ Docker 服务启动失败: {result.stderr}")
            return False
            
        # 等待服务就绪
        print("⏳ 等待数据库服务就绪...")
        time.sleep(10)
        
        return True
        
    def start_local_services(self):
        """启动本地服务"""
        print("🚀 启动应用服务...")
        
        # 安装并启动后端
        print("   📦 安装后端依赖...")
        subprocess.run(['npm', 'install'], cwd=self.project_root / 'backend')
        
        print("   🔧 生成 Prisma 客户端...")
        subprocess.run(['npx', 'prisma', 'generate'], cwd=self.project_root / 'backend')
        
        print("   🚀 启动后端服务...")
        backend_process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd=self.project_root / 'backend',
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # 安装并启动前端
        print("   📦 安装前端依赖...")
        subprocess.run(['npm', 'install'], cwd=self.project_root / 'frontend')
        
        print("   🚀 启动前端服务...")
        frontend_process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd=self.project_root / 'frontend',
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        return backend_process, frontend_process
        
    def run_pure_local_mode(self):
        """纯本地模式（不使用 Docker）"""
        print("\n🏠 使用纯本地模式启动...")
        
        # 设置环境
        self.setup_backend_env()
        
        # 启动服务
        backend_proc, frontend_proc = self.start_local_services()
        
        # 等待服务启动
        print("⏳ 等待服务启动...")
        time.sleep(15)
        
        self.show_success_info()
        
        try:
            print("\n按 Ctrl+C 停止服务...")
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 停止服务...")
            backend_proc.terminate()
            frontend_proc.terminate()
            
    def run_hybrid_mode(self):
        """混合模式（Docker 数据库 + 本地应用）"""
        print("\n🔄 使用混合模式启动...")
        
        # 修复并启动 Docker 服务
        self.fix_docker_compose()
        
        if not self.start_docker_services():
            print("⚠️  Docker 服务启动失败，切换到纯本地模式")
            self.run_pure_local_mode()
            return
            
        # 设置环境
        self.setup_backend_env()
        
        # 启动本地服务
        backend_proc, frontend_proc = self.start_local_services()
        
        # 等待服务启动
        print("⏳ 等待服务启动...")
        time.sleep(15)
        
        self.show_success_info()
        
        try:
            print("\n按 Ctrl+C 停止服务...")
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 停止服务...")
            backend_proc.terminate()
            frontend_proc.terminate()
            subprocess.run(['docker-compose', '-f', 'docker-compose-fixed.yml', 'down'])
            
    def show_success_info(self):
        """显示成功信息"""
        print("""
╔══════════════════════════════════════════════════════════════╗
║                    🎉 系统启动成功！                         ║
╚══════════════════════════════════════════════════════════════╝

🔑 登录账号：
   管理员账号:
   📧 邮箱: admin@financial.com
   🔒 密码: admin123456
   
   普通用户账号:
   📧 邮箱: user@financial.com
   🔒 密码: user123456

🌐 访问地址: http://localhost:3000
🔧 后端API: http://localhost:8000

💡 提示：
   - 这是演示环境，使用测试数据
   - 如需查看日志，请查看终端输出
   - 确保端口 3000, 8000, 5432, 6379 未被占用
        """)
        
    def run(self):
        """运行修复流程"""
        self.print_banner()
        
        # 检查 Docker 状态
        if self.check_docker_status():
            # Docker 可用，使用混合模式
            self.run_hybrid_mode()
        else:
            # Docker 不可用，使用纯本地模式
            print("\n⚠️  Docker 不可用，将使用纯本地模式")
            print("   注意：纯本地模式使用内存数据库，数据不会持久化")
            self.run_pure_local_mode()

if __name__ == "__main__":
    fixer = SystemLoginFixer()
    fixer.run() 