# 财务管理系统生产环境部署指南

## 概述

本指南将帮助您将财务管理系统部署到生产环境。系统使用Docker容器化部署，包含前端、后端、数据库、缓存和监控服务。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    Frontend     │    │    Backend      │
│   (反向代理)     │────│   (React App)   │────│  (Node.js API)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │    │     Redis       │    │   PostgreSQL    │
│   (监控收集)     │    │    (缓存)       │    │   (数据库)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
┌─────────────────┐
│    Grafana      │
│   (监控面板)     │
└─────────────────┘
```

## 部署前准备

### 1. 系统要求

- **操作系统**: Linux (Ubuntu 20.04+ 推荐) 或 Windows Server 2019+
- **内存**: 最少 4GB，推荐 8GB+
- **存储**: 最少 20GB 可用空间
- **网络**: 稳定的互联网连接

### 2. 软件依赖

- Docker 20.10+
- Docker Compose 2.0+
- Git

### 3. 域名和SSL证书

- 准备域名 (如: financial.yourcompany.com)
- 获取SSL证书 (推荐使用 Let's Encrypt)

## 部署步骤

### 1. 克隆项目

```bash
git clone <your-repository-url>
cd financial-management-systems
```

### 2. 配置环境变量

```bash
cd tools/docker-configs
cp env.prod.example .env.prod
```

编辑 `.env.prod` 文件，设置以下关键配置：

```bash
# 数据库配置
POSTGRES_PASSWORD=your_secure_postgres_password_here
REDIS_PASSWORD=your_secure_redis_password_here

# JWT密钥 (必须至少32个字符)
JWT_SECRET=your_super_secure_jwt_secret_key_here_at_least_32_characters
JWT_REFRESH_SECRET=your_super_secure_jwt_refresh_secret_key_here_at_least_32_characters

# 域名配置
CORS_ORIGIN=https://your-domain.com
VITE_API_URL=https://your-domain.com

# 监控密码
GRAFANA_PASSWORD=your_secure_grafana_password_here
```

### 3. 执行部署

#### Windows (PowerShell)
```powershell
.\deploy-prod.ps1
```

#### Windows (命令提示符)
```cmd
deploy-prod.bat
```

#### Linux/macOS
```bash
chmod +x deploy-prod.sh
./deploy-prod.sh
```

### 4. 验证部署

部署完成后，访问以下URL验证服务：

- **前端应用**: http://your-domain.com
- **后端API**: http://your-domain.com/api
- **监控面板**: http://your-domain.com:3001 (Grafana)
- **指标收集**: http://your-domain.com:9090 (Prometheus)

## 服务配置

### 1. Nginx配置

Nginx作为反向代理，处理以下功能：
- SSL终止
- 静态文件服务
- API路由转发
- 限流保护
- 安全头设置

### 2. 数据库配置

PostgreSQL配置：
- 数据持久化存储
- 自动备份策略
- 连接池优化
- 健康检查

### 3. 缓存配置

Redis配置：
- 会话存储
- API响应缓存
- 限流计数器
- 密码保护

### 4. 监控配置

Prometheus + Grafana监控：
- 系统资源监控
- 应用性能监控
- 业务指标监控
- 告警通知

## 安全配置

### 1. 防火墙设置

```bash
# 只开放必要端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH
ufw enable
```

### 2. SSL证书配置

使用Let's Encrypt获取免费SSL证书：

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 数据库安全

- 使用强密码
- 限制网络访问
- 定期备份
- 启用SSL连接

## 备份策略

### 1. 数据库备份

```bash
# 创建备份脚本
cat > backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec postgres pg_dump -U financial_user financial_db > backup_$DATE.sql
gzip backup_$DATE.sql
EOF

chmod +x backup-db.sh

# 设置定时备份
crontab -e
# 添加: 0 2 * * * /path/to/backup-db.sh
```

### 2. 应用数据备份

```bash
# 备份Docker卷
docker run --rm -v financial_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz -C /data .
```

## 监控和维护

### 1. 日志管理

```bash
# 查看服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 2. 性能监控

- 访问Grafana监控面板
- 设置关键指标告警
- 定期检查系统资源使用情况

### 3. 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 故障排除

### 1. 服务无法启动

```bash
# 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看错误日志
docker-compose -f docker-compose.prod.yml logs [service-name]
```

### 2. 数据库连接问题

```bash
# 检查数据库状态
docker exec postgres pg_isready -U financial_user

# 检查网络连接
docker network ls
docker network inspect financial-net
```

### 3. 性能问题

```bash
# 检查资源使用
docker stats

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

## 扩展部署

### 1. 水平扩展

```yaml
# 在docker-compose.prod.yml中添加
backend:
  deploy:
    replicas: 3
    resources:
      limits:
        memory: 512M
      reservations:
        memory: 256M
```

### 2. 负载均衡

使用Nginx upstream配置多个后端实例：

```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

## 联系支持

如果在部署过程中遇到问题，请：

1. 检查本文档的故障排除部分
2. 查看项目的GitHub Issues
3. 联系技术支持团队

---

**注意**: 请确保在生产环境中使用强密码和安全的配置。定期更新系统和依赖包以保持安全性。
