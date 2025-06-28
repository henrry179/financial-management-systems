# 后端开发环境Dockerfile - 支持热重载
# 基于Node.js 18 Alpine版本 - 从国内镜像源拉取
FROM registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=development
ENV PORT=8000
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# 安装系统依赖和开发工具
RUN apk update && apk add --no-cache \
    curl \
    bash \
    git \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# 配置npm使用国内镜像源
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set disturl https://npmmirror.com/dist && \
    npm config set electron_mirror https://npmmirror.com/mirrors/electron/ && \
    npm config set sass_binary_site https://npmmirror.com/mirrors/node-sass/

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# 复制Prisma schema
COPY prisma/ ./prisma/

# 生成Prisma客户端
RUN npx prisma generate

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 创建必要的目录并设置权限
RUN mkdir -p /app/logs /app/uploads /app/temp /app/node_modules && \
    chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动开发服务器
CMD ["npm", "run", "dev"] 