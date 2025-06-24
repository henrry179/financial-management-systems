# 快速启动指南

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0  
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

## 1. 项目克隆和安装

```bash
# 克隆项目
git clone <repository-url>
cd financial-management-system

# 安装依赖
npm install

# 安装前端依赖
cd frontend && npm install && cd ..

# 安装后端依赖
cd backend && npm install && cd ..
```

## 2. 环境配置

### 后端环境配置

```bash
# 复制环境变量文件
cd backend
cp env.example .env

# 编辑环境变量（根据实际情况修改）
# DATABASE_URL, REDIS_URL, JWT_SECRET 等
```

### 前端环境配置

```bash
# 创建前端环境变量文件
cd frontend
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
EOF
```

## 3. 数据库设置

### 使用Docker（推荐）

```bash
# 启动数据库服务
docker-compose up -d postgres redis

# 等待数据库启动（约10秒）
sleep 10

# 运行数据库迁移
cd backend
npm run db:migrate

# 生成Prisma客户端
npm run db:generate

# 填充初始数据（可选）
npm run db:seed
```

### 手动设置

如果不使用Docker，请确保PostgreSQL和Redis已安装并运行：

```bash
# 创建数据库
createdb financial_db

# 运行迁移
cd backend
npm run db:migrate
npm run db:generate
npm run db:seed
```

## 4. 启动开发服务器

### 方式一：使用npm scripts（推荐）

```bash
# 在项目根目录，同时启动前后端
npm run dev
```

### 方式二：分别启动

```bash
# 终端1 - 启动后端
cd backend
npm run dev

# 终端2 - 启动前端
cd frontend  
npm run dev
```

### 方式三：使用Docker

```bash
# 启动所有服务
docker-compose up

# 后台运行
docker-compose up -d
```

## 5. 访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **数据库管理**: http://localhost:5050 (pgAdmin)
  - 邮箱: admin@financial.com
  - 密码: admin123

## 6. 默认账号

开发环境默认创建的测试账号：

- **邮箱**: admin@financial.com
- **密码**: admin123456

## 7. 开发工具

### 数据库管理

```bash
# 打开Prisma Studio
cd backend
npm run db:studio
```

### 代码质量检查

```bash
# 前端代码检查
cd frontend
npm run lint

# 后端代码检查  
cd backend
npm run lint
```

### 运行测试

```bash
# 运行所有测试
npm run test

# 运行前端测试
npm run test:frontend

# 运行后端测试
npm run test:backend
```

## 8. 常见问题

### Q: 数据库连接失败
A: 检查PostgreSQL是否运行，DATABASE_URL是否正确

### Q: Redis连接失败  
A: 检查Redis是否运行，REDIS_URL是否正确

### Q: 端口占用
A: 修改docker-compose.yml或.env文件中的端口配置

### Q: 权限问题
A: 确保Docker有足够权限，或使用sudo运行

## 9. 下一步

- 查看 [API文档](./api/README.md)
- 阅读 [开发指南](./DEVELOPMENT.md)
- 了解 [部署方案](./deployment/README.md)
- 参考 [设计文档](./design/README.md)

## 10. 获取帮助

如遇到问题，请：

1. 查看日志文件
2. 检查环境配置
3. 参考常见问题
4. 联系开发团队 