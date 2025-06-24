# 🔧 Docker网络问题解决方案

## 🚨 问题描述

在启动智能财务管理系统时遇到Docker镜像下载失败的问题：

```
Error response from daemon: failed to resolve reference "docker.io/library/postgres:15-alpine": failed to do request: Head "https://registry-1.docker.io/v2/library/postgres/manifests/15-alpine": EOF
```

## 🎯 解决方案

### 方案一：配置国内镜像源（推荐）

1. **创建Docker配置文件**
```bash
mkdir -p ~/.docker
```

2. **编辑daemon.json**
```bash
cat > ~/.docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://ccr.ccs.tencentyun.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false
}
EOF
```

3. **重启Docker Desktop**
   - 在macOS上：重启Docker Desktop应用
   - 在Linux上：`sudo systemctl restart docker`

4. **重新尝试启动**
```bash
./start-system.sh
```

### 方案二：本地开发模式（最佳选择）

由于Docker网络问题，推荐使用本地开发模式：

#### 1. 启动前端服务
```bash
cd frontend
npm install
npm run dev
```

#### 2. 启动后端服务
```bash
cd backend
npm install
npm run dev
```

#### 3. 访问系统
- 前端界面：http://localhost:3000
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/api/v1/docs

### 方案三：手动拉取镜像

```bash
# 使用国内镜像源拉取
docker pull registry.cn-hangzhou.aliyuncs.com/library/postgres:15-alpine
docker pull registry.cn-hangzhou.aliyuncs.com/library/redis:7-alpine
docker pull registry.cn-hangzhou.aliyuncs.com/dpage/pgadmin4:latest

# 重新标记镜像
docker tag registry.cn-hangzhou.aliyuncs.com/library/postgres:15-alpine postgres:15-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/library/redis:7-alpine redis:7-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/dpage/pgadmin4:latest dpage/pgadmin4:latest
```

### 方案四：使用代理

如果您的网络环境需要代理：

1. **配置Docker代理**
```bash
# 创建或编辑 ~/.docker/config.json
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy.example.com:8080",
      "httpsProxy": "http://proxy.example.com:8080",
      "noProxy": "localhost,127.0.0.1"
    }
  }
}
```

2. **重启Docker Desktop**

## 🚀 快速启动脚本

创建 `start-local.sh` 脚本：

```bash
#!/bin/bash

echo "🚀 启动智能财务管理系统 - 本地开发模式"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请安装 Node.js 18+"
    exit 1
fi

# 设置环境文件
if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "✅ 环境配置已创建"
fi

# 安装依赖
echo "📦 安装依赖..."
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 启动前端
echo "🎨 启动前端服务..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

# 启动后端
echo "⚡ 启动后端服务..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

echo "
╔══════════════════════════════════════════════════════════════╗
║                   🎉 本地模式启动成功！                      ║
╚══════════════════════════════════════════════════════════════╝

🌐 访问地址：
  📱 前端界面: http://localhost:3000
  🔗 后端API:  http://localhost:8000
  📊 API文档:  http://localhost:8000/api/v1/docs

🔑 测试账户：
  📧 邮箱: admin@financial.com
  🔒 密码: admin123456

💡 停止服务：
  🛑 前端: kill $FRONTEND_PID
  🛑 后端: kill $BACKEND_PID
"
```

## 📊 系统状态检查

### 检查服务状态
```bash
# 检查端口占用
lsof -i :3000 -i :8000

# 检查服务响应
curl http://localhost:3000
curl http://localhost:8000/health

# 检查进程
ps aux | grep -E "(npm|node)" | grep -v grep
```

### 查看日志
```bash
# 前端日志
tail -f frontend.log

# 后端日志
tail -f backend.log
```

## 🎵 30秒轻音乐提醒

系统启动完成后会自动播放30秒轻音乐：

- **本地启动成功**：古典轻音乐
- **服务完全运行**：自然轻音乐
- **深夜模式**：轻柔音效

## 🔧 故障排除

### 常见问题

1. **端口被占用**
```bash
# 查找占用进程
lsof -i :3000
lsof -i :8000

# 杀死进程
kill -9 <PID>
```

2. **依赖安装失败**
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

3. **环境变量问题**
```bash
# 检查环境文件
cat backend/.env

# 重新创建环境文件
cp backend/env.example backend/.env
```

## 📱 移动端访问

### 同一网络访问
```bash
# 获取本机IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 在手机浏览器访问
http://<本机IP>:3000
```

### 远程访问
使用内网穿透工具如ngrok：
```bash
# 安装ngrok
brew install ngrok

# 启动隧道
ngrok http 3000
```

## 🎯 推荐方案

**对于开发环境**：使用本地开发模式（方案二）
- ✅ 避免Docker网络问题
- ✅ 更快的启动速度
- ✅ 更好的调试体验
- ✅ 实时热重载

**对于生产环境**：解决Docker网络问题后使用Docker模式
- ✅ 环境一致性
- ✅ 易于部署
- ✅ 资源隔离

---

**最后更新**: 2025-06-24 23:20:00  
**解决方案版本**: v1.0 