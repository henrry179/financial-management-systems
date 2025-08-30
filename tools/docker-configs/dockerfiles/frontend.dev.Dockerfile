# 前端开发环境Dockerfile - 支持热重载
# 基于Node.js 18 Alpine版本 - 从国内镜像源拉取
FROM registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=development
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# 安装系统依赖
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

# 安装依赖
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 设置权限
RUN chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# 启动开发服务器
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"] 