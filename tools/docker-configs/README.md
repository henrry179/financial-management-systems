# Financial Management System - Docker 完整使用指南

## 📋 目录结构
```
docker/
├── README.md                    # 本文件 - Docker完整使用指南
├── docker-compose.yml          # 生产环境Docker编排
├── docker-compose.dev.yml      # 开发环境Docker编排
├── docker-compose.local.yml    # 本地测试环境Docker编排
├── dockerfiles/                # Docker镜像文件目录
│   ├── backend.Dockerfile      # 后端优化Dockerfile
│   ├── frontend.Dockerfile     # 前端优化Dockerfile
│   └── nginx.Dockerfile        # Nginx反向代理
├── config/                     # Docker配置文件
│   ├── daemon.json             # Docker守护进程配置
│   ├── registry-mirrors.json   # 镜像源配置
│   └── network-config.json     # 网络配置
├── scripts/                    # Docker脚本工具
│   ├── setup-docker.sh         # Docker环境设置脚本
│   ├── pull-images.sh          # 镜像拉取脚本  
│   ├── cleanup.sh              # 清理脚本
│   └── health-check.sh         # 健康检查脚本
├── troubleshooting/            # 问题排查指南
│   ├── image-pull-issues.md    # 镜像拉取问题解决
│   ├── network-issues.md       # 网络问题解决
│   └── common-errors.md        # 常见错误解决
└── monitoring/                 # 监控配置
    ├── docker-compose.monitoring.yml
    └── prometheus.yml
```

## 🚀 快速开始

### 1. 一键解决Docker镜像拉取问题
```bash
# 运行Docker环境设置脚本
cd docker
chmod +x scripts/setup-docker.sh
./scripts/setup-docker.sh

# 拉取所有镜像
chmod +x scripts/pull-images.sh  
./scripts/pull-images.sh
```

### 2. 启动服务
```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up -d

# 生产环境
docker-compose -f docker-compose.yml up -d

# 本地测试
docker-compose -f docker-compose.local.yml up -d
```

## 🔧 Docker镜像拉取问题解决方案

### 方案1: 配置国内镜像加速器（推荐）
```bash
# 创建或编辑Docker配置文件
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
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
  }
}
EOF

# 重启Docker服务
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 方案2: 使用国内镜像源
我们已经优化了所有Dockerfile，使用国内稳定的镜像源：
- Node.js: `registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine`
- PostgreSQL: `registry.cn-hangzhou.aliyuncs.com/google_containers/postgres:13-alpine`
- Redis: `registry.cn-hangzhou.aliyuncs.com/google_containers/redis:6-alpine`
- Nginx: `registry.cn-hangzhou.aliyuncs.com/google_containers/nginx:alpine`

### 方案3: 手动拉取镜像
```bash
# 拉取基础镜像
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/postgres:13-alpine
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/redis:6-alpine
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/nginx:alpine

# 重新标记镜像
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine node:18-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/postgres:13-alpine postgres:13-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/redis:6-alpine redis:6-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/nginx:alpine nginx:alpine
```

## 🛠 Docker环境配置

### 系统要求
- Docker >= 20.10.0
- Docker Compose >= 2.0.0
- 内存 >= 4GB
- 磁盘空间 >= 10GB

### 环境变量配置
```bash
# 复制环境变量模板
cp ../backend/env.example docker/.env

# 编辑环境变量
nano docker/.env
```

### 网络配置
```bash
# 创建自定义网络
docker network create financial-network --driver bridge

# 查看网络状态
docker network ls
docker network inspect financial-network
```

## 📊 服务监控

### 健康检查
```bash
# 检查所有服务状态
docker-compose ps

# 查看服务健康状态
docker-compose -f docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# 运行健康检查脚本
./scripts/health-check.sh
```

### 日志查看
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# 查看最近的错误日志
docker-compose logs --tail=50 backend | grep -i error
```

## 🚨 问题排查

### 常见问题及解决方案

#### 1. 镜像拉取失败
```bash
# 错误: failed to pull image
# 解决方案: 
./scripts/setup-docker.sh  # 配置镜像加速器
./scripts/pull-images.sh   # 重新拉取镜像
```

#### 2. 端口占用
```bash
# 错误: port already in use
# 解决方案:
netstat -tulpn | grep :3000
sudo kill -9 $(lsof -t -i:3000)
```

#### 3. 容器启动失败
```bash
# 查看详细错误信息
docker-compose logs backend
docker-compose logs frontend

# 重启服务
docker-compose restart backend
```

#### 4. 数据库连接失败
```bash
# 检查数据库容器状态
docker-compose exec postgres pg_isready -U financial_user -d financial_db

# 重置数据库
docker-compose down -v
docker-compose up -d postgres
```

## 🔐 安全配置

### 生产环境安全设置
```yaml
# docker-compose.yml 安全配置示例
services:
  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    user: "1001:1001"
```

### 网络安全
```bash
# 配置防火墙规则
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # 禁止直接访问前端端口
sudo ufw deny 8000/tcp  # 禁止直接访问后端端口
```

## 📈 性能优化

### Docker配置优化
```json
{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "name": "nofile",
      "hard": 65536,
      "soft": 1024
    }
  }
}
```

### 资源限制
```yaml
# 在docker-compose.yml中设置资源限制
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 🚀 部署指南

### 开发环境部署
```bash
# 1. 克隆项目
git clone <repository-url>
cd Financialmanagementsystems/docker

# 2. 设置Docker环境
./scripts/setup-docker.sh

# 3. 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 4. 访问应用
echo "前端地址: http://localhost:3000"
echo "后端API: http://localhost:8000"
echo "数据库: localhost:5432"
```

### 生产环境部署
```bash
# 1. 配置环境变量
cp ../backend/env.example .env
nano .env

# 2. 启动生产环境
docker-compose -f docker-compose.yml up -d

# 3. 设置SSL证书（如果需要）
./scripts/setup-ssl.sh

# 4. 配置反向代理
nginx -t && nginx -s reload
```

## 📋 维护指南

### 定期维护任务
```bash
# 每周执行
./scripts/cleanup.sh     # 清理未使用的镜像和容器
docker system prune -f   # 清理系统资源

# 每月执行  
docker-compose pull      # 更新镜像
docker-compose up -d     # 重启服务

# 备份数据
docker-compose exec postgres pg_dump -U financial_user financial_db > backup.sql
```

### 更新指南
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建镜像
docker-compose build --no-cache

# 3. 停止旧服务
docker-compose down

# 4. 启动新服务
docker-compose up -d

# 5. 验证服务状态
./scripts/health-check.sh
```

## 📞 技术支持

### 获取帮助
- 查看 `troubleshooting/` 目录下的详细问题解决指南
- 运行 `./scripts/health-check.sh` 进行系统诊断
- 查看日志: `docker-compose logs -f`

### 联系方式
- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 技术文档: `docs/` 目录
- 快速启动: `docs/QUICK_START.md`

---
**最后更新时间**: 2025-09-05 11:37:47
**文档版本**: v1.0
**Docker版本要求**: >= 20.10.0 