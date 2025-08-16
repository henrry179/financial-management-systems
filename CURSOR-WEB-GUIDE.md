# 🌐 Cursor 网页端开发指南

## 📖 概述

本指南专门为在 **Cursor Background 网页端** 开发和运行财务管理系统而设计。您可以直接在浏览器中的 Cursor 环境里开发项目，无需安装本地客户端。

## 🚀 快速启动

### 方法一：一键启动 (推荐)

```bash
./start-cursor-web.sh
```

这个脚本会自动：
- ✅ 检查环境依赖
- ✅ 安装项目依赖
- ✅ 配置网页端专用设置
- ✅ 初始化SQLite数据库
- ✅ 启动后端和前端服务

### 方法二：完整启动脚本

```bash
./scripts/start-web-dev.sh
```

这是更详细的启动脚本，包含完整的环境检查和配置。

## 🌍 网页端特殊配置

### 前端配置 (`vite.config.web.ts`)
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',  // 重要：允许外部访问
    port: 3000,
    strictPort: true,
  }
})
```

### 后端配置 (`.env.web`)
```env
NODE_ENV=development
PORT=8000
HOST=0.0.0.0           # 允许外部访问
DATABASE_URL="file:./dev.db"  # 使用SQLite简化配置
CORS_ORIGIN=*          # 允许跨域访问
REDIS_ENABLED=false    # 禁用Redis以简化环境
```

## 📊 数据库配置

网页端使用 **SQLite** 数据库，无需安装PostgreSQL：

```prisma
// prisma/schema.web.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### 测试账号
- **邮箱**: `demo@example.com`
- **密码**: `123456`

## 🔧 服务访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 🎨 前端界面 | http://localhost:3000 | React开发服务器 |
| ⚡ 后端API | http://localhost:8000 | Express.js API服务 |
| 🏥 健康检查 | http://localhost:8000/health | 服务状态检查 |
| 📚 API文档 | http://localhost:8000/api/docs | Swagger文档 |

## 🛠️ 开发命令

### 前端开发
```bash
cd frontend
npm run dev:web     # 网页端专用启动
npm run build       # 构建生产版本
npm run test        # 运行测试
```

### 后端开发
```bash
cd backend
npm run dev:web     # 网页端专用启动
npm run build       # 构建TypeScript
npm run test        # 运行测试
```

### 数据库操作
```bash
cd backend
npx prisma generate --schema=prisma/schema.web.prisma  # 生成客户端
npx prisma db push --schema=prisma/schema.web.prisma   # 推送Schema
npx prisma studio --schema=prisma/schema.web.prisma    # 数据库管理界面
```

## 🔍 故障排除

### 1. 端口被占用
```bash
# 查看端口占用
netstat -tuln | grep 3000
netstat -tuln | grep 8000

# 杀死占用进程
pkill -f "vite"
pkill -f "tsx"
```

### 2. 依赖安装失败
```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

### 3. 数据库问题
```bash
# 重置数据库
cd backend
rm -f prisma/dev.db
npx prisma db push --schema=prisma/schema.web.prisma
```

### 4. 查看日志
```bash
# 后端日志
tail -f logs/backend.log

# 检查后端进程
ps aux | grep tsx
```

## 🎯 Cursor 网页端特色功能

### 1. 零配置启动
- 无需Docker或复杂环境配置
- 自动检测和安装依赖
- 一键启动完整系统

### 2. 轻量级数据库
- 使用SQLite，无需安装数据库服务
- 数据文件简单易管理
- 支持完整的CRUD操作

### 3. 热重载开发
- 前端代码修改实时刷新
- 后端代码修改自动重启
- 支持TypeScript类型检查

### 4. 网络访问优化
- 配置了CORS允许跨域
- 设置了proper的host绑定
- 优化了代理配置

## 🔒 安全注意事项

### 开发环境专用配置
- JWT密钥使用开发专用值
- CORS设置为允许所有来源
- 数据库使用本地文件
- 禁用了生产环境安全特性

**⚠️ 警告**: 这些配置仅适用于开发环境，生产部署请使用正式配置。

## 📱 移动端测试

项目支持PWA和移动端适配，您可以在浏览器中测试：

1. 打开开发者工具
2. 切换到移动设备模拟器
3. 测试响应式布局和PWA功能

## 🔄 版本控制

### Git提交建议
```bash
# 提交开发代码
git add .
git commit -m "feat: 在Cursor网页端完成XXX功能开发"

# 创建功能分支
git checkout -b feature/cursor-web-development
```

## 📞 技术支持

如果在Cursor网页端遇到问题：

1. 📋 检查浏览器控制台错误
2. 📝 查看后端日志 `logs/backend.log`
3. 🔍 确认端口没有被占用
4. 🔄 尝试重启服务

## 🎉 快速验证

启动成功后，可以通过以下步骤验证：

1. ✅ 访问 http://localhost:3000 看到登录页面
2. ✅ 使用测试账号 `demo@example.com / 123456` 登录
3. ✅ 查看仪表板数据正常显示
4. ✅ 尝试添加一笔交易记录
5. ✅ 检查数据是否保存成功

---

**🎯 现在您可以在 Cursor 网页端愉快地开发财务管理系统了！**