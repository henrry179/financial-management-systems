#!/usr/bin/env python3
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
