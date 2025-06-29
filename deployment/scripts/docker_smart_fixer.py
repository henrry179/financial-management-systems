#!/usr/bin/env python3
"""
智能Docker镜像拉取修复工具 v3.0
解决Docker镜像拉取重复失败的问题
作者: Financial Management System Team
最后更新: 2025-01-20 18:55:00
"""

import os
import sys
import json
import time
import subprocess
import platform
import threading
import socket
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import concurrent.futures

# ANSI颜色代码
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class DockerSmartFixer:
    """智能Docker修复工具"""
    
    def __init__(self):
        self.system = platform.system()
        self.docker_config_path = self._get_docker_config_path()
        self.report_data = {
            "start_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "system": self.system,
            "issues_found": [],
            "fixes_applied": [],
            "results": {}
        }
        
        # 镜像源配置
        self.mirror_sources = {
            "ustc": {
                "url": "https://docker.mirrors.ustc.edu.cn",
                "name": "中科大镜像源",
                "priority": 1
            },
            "163": {
                "url": "https://hub-mirror.c.163.com", 
                "name": "网易云镜像源",
                "priority": 2
            },
            "baidu": {
                "url": "https://mirror.baidubce.com",
                "name": "百度云镜像源", 
                "priority": 3
            },
            "aliyun": {
                "url": "https://registry.cn-hangzhou.aliyuncs.com",
                "name": "阿里云镜像源",
                "priority": 4
            },
            "tencent": {
                "url": "https://mirror.ccs.tencentyun.com",
                "name": "腾讯云镜像源",
                "priority": 5
            }
        }
        
        # 核心镜像列表
        self.core_images = {
            "node:18-alpine": "Node.js运行时",
            "postgres:13-alpine": "PostgreSQL数据库",
            "redis:6-alpine": "Redis缓存",
            "nginx:alpine": "Nginx Web服务器"
        }
        
        self.available_mirrors = []
        self.pull_progress = {}
        
    def _get_docker_config_path(self) -> Path:
        """获取Docker配置文件路径"""
        if self.system == "Darwin":  # macOS
            return Path.home() / ".docker" / "daemon.json"
        elif self.system == "Linux":
            return Path("/etc/docker/daemon.json")
        elif self.system == "Windows":
            return Path.home() / ".docker" / "daemon.json"
        else:
            return Path.home() / ".docker" / "daemon.json"
    
    def print_banner(self):
        """打印横幅"""
        print(f"{Colors.CYAN}{Colors.BOLD}")
        print("=" * 50)
        print("  智能Docker镜像修复工具 v3.0")
        print("  解决镜像拉取重复失败问题")
        print("=" * 50)
        print(f"{Colors.RESET}\n")
    
    def log_info(self, message: str):
        """信息日志"""
        print(f"{Colors.BLUE}[INFO]{Colors.RESET} {message}")
    
    def log_success(self, message: str):
        """成功日志"""
        print(f"{Colors.GREEN}[SUCCESS]{Colors.RESET} {message}")
        
    def log_warning(self, message: str):
        """警告日志"""
        print(f"{Colors.YELLOW}[WARNING]{Colors.RESET} {message}")
        
    def log_error(self, message: str):
        """错误日志"""
        print(f"{Colors.RED}[ERROR]{Colors.RESET} {message}")
        self.report_data["issues_found"].append(message)
    
    def log_debug(self, message: str):
        """调试日志"""
        print(f"{Colors.PURPLE}[DEBUG]{Colors.RESET} {message}")
    
    def run_command(self, cmd: List[str], timeout: int = 30) -> Tuple[bool, str, str]:
        """运行命令并返回结果"""
        try:
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return process.returncode == 0, process.stdout, process.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Command timeout"
        except Exception as e:
            return False, "", str(e)
    
    def check_docker_installed(self) -> bool:
        """检查Docker是否安装"""
        self.log_info("检查Docker安装状态...")
        success, stdout, _ = self.run_command(["docker", "--version"])
        
        if success:
            self.log_success(f"Docker已安装: {stdout.strip()}")
            return True
        else:
            self.log_error("Docker未安装，请先安装Docker Desktop")
            return False
    
    def check_docker_running(self) -> bool:
        """检查Docker服务是否运行"""
        self.log_info("检查Docker服务状态...")
        success, _, _ = self.run_command(["docker", "info"], timeout=10)
        
        if success:
            self.log_success("Docker服务运行正常")
            return True
        else:
            self.log_warning("Docker服务未运行")
            return False
    
    def start_docker_service(self) -> bool:
        """启动Docker服务"""
        self.log_info("尝试启动Docker服务...")
        
        if self.system == "Darwin":  # macOS
            # 尝试通过AppleScript启动Docker Desktop
            script = '''
            tell application "Docker"
                if not running then
                    activate
                    delay 5
                end if
            end tell
            '''
            success, _, _ = self.run_command(["osascript", "-e", script])
            
            if not success:
                # 备用方案：使用open命令
                success, _, _ = self.run_command(["open", "-a", "Docker"])
            
            if success:
                self.log_info("等待Docker Desktop启动...")
                for i in range(30):
                    if self.check_docker_running():
                        self.log_success("Docker服务已启动")
                        return True
                    time.sleep(2)
                    print(".", end="", flush=True)
                print()
                
        elif self.system == "Linux":
            success, _, _ = self.run_command(["sudo", "systemctl", "start", "docker"])
            if success:
                self.log_success("Docker服务已启动")
                return True
                
        self.log_error("无法启动Docker服务，请手动启动")
        return False
    
    def test_network_connectivity(self) -> bool:
        """测试网络连接"""
        self.log_info("测试网络连接...")
        
        # 测试基本网络
        try:
            socket.create_connection(("8.8.8.8", 53), timeout=3)
            self.log_success("✓ 基本网络连接正常")
        except:
            self.log_error("✗ 基本网络连接失败")
            return False
        
        # 测试DNS解析
        try:
            socket.gethostbyname("docker.com")
            self.log_success("✓ DNS解析正常")
        except:
            self.log_error("✗ DNS解析失败")
            return False
            
        return True
    
    def test_mirror_sources(self) -> List[str]:
        """测试镜像源可用性"""
        self.log_info("测试镜像源连接状态...")
        available_mirrors = []
        
        def test_mirror(mirror_id: str, mirror_info: Dict) -> Optional[str]:
            """测试单个镜像源"""
            try:
                url = mirror_info["url"]
                name = mirror_info["name"]
                
                # 尝试连接镜像源
                req = urllib.request.Request(
                    url,
                    headers={'User-Agent': 'Docker-Client'}
                )
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    if response.status == 200:
                        self.log_success(f"✓ {name} ({url}) - 可用")
                        return mirror_id
            except:
                self.log_warning(f"✗ {mirror_info['name']} ({mirror_info['url']}) - 不可用")
            
            return None
        
        # 并发测试所有镜像源
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_mirror = {
                executor.submit(test_mirror, mirror_id, mirror_info): mirror_id 
                for mirror_id, mirror_info in self.mirror_sources.items()
            }
            
            for future in concurrent.futures.as_completed(future_to_mirror):
                result = future.result()
                if result:
                    available_mirrors.append(result)
        
        # 按优先级排序
        available_mirrors.sort(key=lambda x: self.mirror_sources[x]["priority"])
        
        if available_mirrors:
            self.log_success(f"可用镜像源: {', '.join(available_mirrors)}")
        else:
            self.log_error("所有镜像源都不可用")
            
        self.available_mirrors = available_mirrors
        return available_mirrors
    
    def configure_docker_mirrors(self) -> bool:
        """配置Docker镜像源"""
        if not self.available_mirrors:
            self.log_error("没有可用的镜像源")
            return False
            
        self.log_info("配置Docker镜像源...")
        
        # 生成镜像源URL列表
        mirror_urls = [
            self.mirror_sources[mirror_id]["url"] 
            for mirror_id in self.available_mirrors
        ]
        
        # 创建daemon.json配置
        config = {
            "registry-mirrors": mirror_urls,
            "max-concurrent-downloads": 10,
            "max-concurrent-uploads": 5,
            "log-driver": "json-file",
            "log-opts": {
                "max-size": "10m",
                "max-file": "3"
            },
            "storage-driver": "overlay2",
            "dns": ["8.8.8.8", "8.8.4.4", "114.114.114.114"]
        }
        
        # 备份现有配置
        config_path = self.docker_config_path
        if config_path.exists():
            backup_path = config_path.with_suffix('.json.bak')
            try:
                import shutil
                shutil.copy2(config_path, backup_path)
                self.log_info(f"已备份原配置到: {backup_path}")
            except:
                pass
        
        # 确保目录存在
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 写入新配置
        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            self.log_success("Docker镜像源配置已更新")
            self.report_data["fixes_applied"].append("更新Docker镜像源配置")
            return True
        except Exception as e:
            self.log_error(f"写入配置失败: {e}")
            return False
    
    def restart_docker_service(self) -> bool:
        """重启Docker服务使配置生效"""
        self.log_info("重启Docker服务...")
        
        if self.system == "Darwin":  # macOS
            # 退出Docker
            self.run_command(["osascript", "-e", 'quit app "Docker"'])
            time.sleep(3)
            
            # 重新启动
            return self.start_docker_service()
            
        elif self.system == "Linux":
            success, _, _ = self.run_command(["sudo", "systemctl", "restart", "docker"])
            if success:
                self.log_success("Docker服务已重启")
                return True
                
        return False
    
    def smart_pull_image(self, image: str, description: str) -> bool:
        """智能拉取镜像"""
        self.log_info(f"拉取镜像: {image} ({description})")
        
        # 检查镜像是否已存在
        success, stdout, _ = self.run_command(["docker", "images", "--format", "{{.Repository}}:{{.Tag}}"])
        if success and image in stdout:
            self.log_warning(f"镜像已存在，跳过: {image}")
            return True
        
        # 尝试从多个镜像源拉取
        max_retries = 3
        
        for mirror_id in self.available_mirrors:
            mirror_name = self.mirror_sources[mirror_id]["name"]
            
            for retry in range(max_retries):
                self.log_info(f"尝试从 {mirror_name} 拉取 (尝试 {retry + 1}/{max_retries})...")
                
                # 构建拉取命令
                if mirror_id in ["aliyun", "tencent"]:
                    # 某些镜像源需要特殊处理
                    if mirror_id == "aliyun":
                        full_image = f"registry.cn-hangzhou.aliyuncs.com/google_containers/{image.split(':')[0]}:{image.split(':')[1]}"
                    else:
                        full_image = f"ccr.ccs.tencentyun.com/mirrors/{image.split(':')[0]}:{image.split(':')[1]}"
                else:
                    full_image = image
                
                # 拉取镜像
                success, stdout, stderr = self.run_command(
                    ["docker", "pull", full_image],
                    timeout=120
                )
                
                if success:
                    # 如果使用了替代镜像名，重新标记
                    if full_image != image:
                        self.run_command(["docker", "tag", full_image, image])
                        self.run_command(["docker", "rmi", full_image])
                    
                    self.log_success(f"✓ 成功从 {mirror_name} 拉取 {image}")
                    return True
                else:
                    self.log_warning(f"从 {mirror_name} 拉取失败")
                    if retry < max_retries - 1:
                        time.sleep(5)
        
        self.log_error(f"✗ 从所有镜像源拉取 {image} 失败")
        return False
    
    def pull_all_images(self) -> Dict[str, bool]:
        """拉取所有核心镜像"""
        self.log_info(f"开始拉取 {len(self.core_images)} 个核心镜像...")
        
        results = {}
        for image, description in self.core_images.items():
            results[image] = self.smart_pull_image(image, description)
            
        return results
    
    def create_offline_backup(self):
        """创建离线镜像备份"""
        self.log_info("创建离线镜像备份...")
        
        # 检查是否有镜像可以备份
        success, stdout, _ = self.run_command(["docker", "images", "--format", "{{.Repository}}:{{.Tag}}"])
        if not success or not stdout:
            self.log_warning("没有镜像可以备份")
            return
        
        # 创建备份目录
        backup_dir = Path("docker/offline-backup-" + datetime.now().strftime("%Y%m%d_%H%M%S"))
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存镜像
        saved_count = 0
        for image in self.core_images:
            if image in stdout:
                filename = image.replace("/", "_").replace(":", "_") + ".tar"
                filepath = backup_dir / filename
                
                self.log_info(f"保存镜像: {image}")
                success, _, _ = self.run_command(
                    ["docker", "save", "-o", str(filepath), image],
                    timeout=300
                )
                
                if success:
                    saved_count += 1
                    self.log_success(f"✓ 已保存: {image}")
        
        if saved_count > 0:
            self.log_success(f"离线备份完成: {backup_dir}")
            self.report_data["fixes_applied"].append(f"创建离线镜像备份 ({saved_count}个镜像)")
    
    def generate_report(self):
        """生成修复报告"""
        self.report_data["end_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        report_file = f"docker/smart-fix-report-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # 保存JSON报告
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.report_data, f, indent=2, ensure_ascii=False)
        
        # 生成文本报告
        txt_report = report_file.replace('.json', '.txt')
        with open(txt_report, 'w', encoding='utf-8') as f:
            f.write("Docker智能修复报告\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"开始时间: {self.report_data['start_time']}\n")
            f.write(f"结束时间: {self.report_data['end_time']}\n")
            f.write(f"系统平台: {self.report_data['system']}\n\n")
            
            f.write("发现的问题:\n")
            for issue in self.report_data['issues_found']:
                f.write(f"- {issue}\n")
            
            f.write("\n应用的修复:\n")
            for fix in self.report_data['fixes_applied']:
                f.write(f"- {fix}\n")
            
            f.write("\n镜像拉取结果:\n")
            for image, result in self.report_data['results'].items():
                status = "✓ 成功" if result else "✗ 失败"
                f.write(f"- {image}: {status}\n")
        
        self.log_success(f"报告已生成: {txt_report}")
    
    def play_completion_sound(self):
        """播放完成提示音"""
        if self.system == "Darwin":  # macOS
            # 播放30秒轻音乐
            def play_sound():
                for _ in range(10):
                    subprocess.run(["afplay", "/System/Library/Sounds/Glass.aiff"])
                    time.sleep(3)
            
            thread = threading.Thread(target=play_sound)
            thread.daemon = True
            thread.start()
    
    def run(self):
        """运行智能修复流程"""
        self.print_banner()
        
        # 1. 检查Docker安装
        if not self.check_docker_installed():
            return
        
        # 2. 检查并启动Docker服务
        if not self.check_docker_running():
            if not self.start_docker_service():
                return
        
        # 3. 测试网络连接
        if not self.test_network_connectivity():
            self.log_error("网络连接异常，请检查网络设置")
            return
        
        # 4. 测试镜像源
        if not self.test_mirror_sources():
            self.log_error("没有可用的镜像源")
            return
        
        # 5. 配置Docker镜像源
        if self.configure_docker_mirrors():
            # 重启Docker服务
            self.restart_docker_service()
            time.sleep(5)
        
        # 6. 拉取核心镜像
        results = self.pull_all_images()
        self.report_data["results"] = results
        
        # 7. 创建离线备份
        self.create_offline_backup()
        
        # 8. 生成报告
        self.generate_report()
        
        # 9. 显示结果
        print(f"\n{Colors.GREEN}{'=' * 50}")
        print("  修复完成")
        print('=' * 50 + Colors.RESET)
        
        success_count = sum(1 for r in results.values() if r)
        failed_count = len(results) - success_count
        
        print(f"镜像拉取结果:")
        print(f"  成功: {Colors.GREEN}{success_count}{Colors.RESET}")
        print(f"  失败: {Colors.RED}{failed_count}{Colors.RESET}")
        
        if failed_count > 0:
            print(f"\n{Colors.YELLOW}部分镜像拉取失败，建议:")
            print("1. 检查网络连接和代理设置")
            print("2. 使用离线镜像包部署")
            print("3. 联系网络管理员" + Colors.RESET)
        else:
            print(f"\n{Colors.GREEN}🎉 所有镜像拉取成功！系统已准备就绪{Colors.RESET}")
        
        # 播放完成提示音
        self.play_completion_sound()


def main():
    """主函数"""
    try:
        fixer = DockerSmartFixer()
        fixer.run()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}用户中断操作{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}发生错误: {e}{Colors.RESET}")
        sys.exit(1)


if __name__ == "__main__":
    main() 