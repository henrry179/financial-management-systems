# Docker镜像拉取问题排查指南

## 🚨 常见镜像拉取错误

### 1. 网络连接超时
```bash
Error response from daemon: Get https://registry-1.docker.io/v2/: net/http: request canceled while waiting for connection
```

**解决方案:**
1. 配置镜像加速器：
   ```bash
   sudo ./scripts/setup-docker.sh
   ```

2. 手动配置加速器：
   ```bash
   sudo mkdir -p /etc/docker
   sudo tee /etc/docker/daemon.json <<-'EOF'
   {
     "registry-mirrors": [
       "https://docker.mirrors.ustc.edu.cn",
       "https://hub-mirror.c.163.com",
       "https://mirror.baidubce.com"
     ]
   }
   EOF
   sudo systemctl restart docker
   ```

### 2. 镜像不存在错误
```bash
Error response from daemon: pull access denied for xxx, repository does not exist
```

**解决方案:**
1. 检查镜像名称拼写
2. 使用替代镜像源：
   ```bash
   # 使用阿里云镜像
   docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine
   docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine node:18-alpine
   ```

### 3. 权限拒绝错误
```bash
Error response from daemon: denied: requested access to the resource is denied
```

**解决方案:**
1. 检查Docker守护进程是否运行：
   ```bash
   sudo systemctl status docker
   sudo systemctl start docker
   ```

2. 添加用户到docker组：
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

### 4. TLS握手失败
```bash
Error response from daemon: Get https://registry-1.docker.io/v2/: x509: certificate signed by unknown authority
```

**解决方案:**
1. 更新系统证书：
   ```bash
   # Ubuntu/Debian
   sudo apt-get update && sudo apt-get install ca-certificates
   
   # CentOS/RHEL
   sudo yum update ca-certificates
   
   # macOS
   brew install ca-certificates
   ```

2. 重启Docker服务：
   ```bash
   sudo systemctl restart docker
   ```

## 🔧 国内镜像源配置

### 推荐的镜像加速器
1. **中科大镜像源** (推荐)
   ```
   https://docker.mirrors.ustc.edu.cn
   ```

2. **网易镜像源**
   ```
   https://hub-mirror.c.163.com
   ```

3. **百度云镜像源**
   ```
   https://mirror.baidubce.com
   ```

4. **阿里云镜像源**
   ```
   https://registry.cn-hangzhou.aliyuncs.com
   ```

### 完整配置示例
```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://dockerproxy.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "dns": ["8.8.8.8", "8.8.4.4"],
  "max-concurrent-downloads": 10
}
```

## 🛠 手动镜像拉取步骤

### 1. 项目核心镜像
```bash
# Node.js 运行时
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine node:18-alpine

# PostgreSQL 数据库
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/postgres:13-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/postgres:13-alpine postgres:13-alpine

# Redis 缓存
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/redis:6-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/redis:6-alpine redis:6-alpine

# Nginx 服务器
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/nginx:alpine
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/nginx:alpine nginx:alpine
```

### 2. 验证镜像
```bash
# 检查镜像是否存在
docker images

# 测试镜像运行
docker run --rm node:18-alpine node --version
docker run --rm postgres:13-alpine postgres --version
docker run --rm redis:6-alpine redis-server --version
docker run --rm nginx:alpine nginx -v
```

## 🌐 网络问题排查

### 1. 检查网络连接
```bash
# 测试Docker Hub连接
curl -I https://registry-1.docker.io/v2/

# 测试镜像加速器连接
curl -I https://docker.mirrors.ustc.edu.cn/v2/

# 检查DNS解析
nslookup registry-1.docker.io
nslookup docker.mirrors.ustc.edu.cn
```

### 2. 代理配置
如果在公司网络环境下，可能需要配置代理：

```bash
# 设置Docker代理
sudo mkdir -p /etc/systemd/system/docker.service.d

sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf <<-'EOF'
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080"
Environment="HTTPS_PROXY=http://proxy.example.com:8080"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 🔍 诊断命令

### 1. Docker信息检查
```bash
# 查看Docker版本和配置
docker version
docker info

# 查看镜像加速器状态
docker info | grep -A 10 "Registry Mirrors"

# 查看存储驱动
docker info | grep "Storage Driver"
```

### 2. 网络诊断
```bash
# 检查Docker网络
docker network ls
docker network inspect bridge

# 检查端口占用
netstat -tuln | grep docker
ss -tuln | grep docker
```

### 3. 日志检查
```bash
# 查看Docker守护进程日志
sudo journalctl -u docker.service -f

# 查看容器日志
docker logs <container-name>

# 查看系统日志
sudo tail -f /var/log/docker.log
```

## 🚀 自动化解决方案

### 1. 一键修复脚本
```bash
#!/bin/bash
# 自动修复镜像拉取问题

echo "🔧 自动修复Docker镜像拉取问题..."

# 1. 配置镜像加速器
sudo ./scripts/setup-docker.sh

# 2. 预拉取项目镜像
./scripts/pull-images.sh

# 3. 验证修复结果
./scripts/health-check.sh

echo "✅ 修复完成！"
```

### 2. 备用镜像源
当主要镜像源不可用时，自动切换到备用源：

```bash
#!/bin/bash
# 智能镜像拉取脚本

MIRRORS=(
    "registry.cn-hangzhou.aliyuncs.com/google_containers"
    "registry.cn-shenzhen.aliyuncs.com/google_containers"
    "ccr.ccs.tencentyun.com/library"
    "hub.docker.com"
)

pull_image() {
    local image=$1
    
    for mirror in "${MIRRORS[@]}"; do
        echo "尝试从 $mirror 拉取 $image..."
        
        if [[ "$mirror" == "hub.docker.com" ]]; then
            full_image="$image"
        else
            full_image="$mirror/$image"
        fi
        
        if docker pull "$full_image"; then
            if [[ "$mirror" != "hub.docker.com" ]]; then
                docker tag "$full_image" "$image"
            fi
            echo "✅ 成功从 $mirror 拉取 $image"
            return 0
        else
            echo "❌ 从 $mirror 拉取失败"
        fi
    done
    
    echo "❌ 所有镜像源都失败了"
    return 1
}

# 使用示例
pull_image "node:18-alpine"
```

## 📞 获取帮助

如果以上方法都无法解决问题，请：

1. 运行完整诊断：
   ```bash
   ./scripts/health-check.sh > diagnosis.txt 2>&1
   ```

2. 收集错误信息：
   ```bash
   docker version > docker-info.txt
   docker info >> docker-info.txt
   sudo journalctl -u docker.service --since "1 hour ago" > docker-logs.txt
   ```

3. 查看项目Issues或联系技术支持

## 📚 参考资料

- [Docker官方文档](https://docs.docker.com/)
- [Docker镜像加速器配置](https://yeasy.gitbook.io/docker_practice/install/mirror)
- [Docker网络配置](https://docs.docker.com/network/)
- [Docker故障排除](https://docs.docker.com/config/daemon/troubleshoot/)

---
**最后更新**: 2025-09-05 10:49:44  
**适用版本**: Docker >= 20.10.0 