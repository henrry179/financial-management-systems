# 前端生产环境Dockerfile - 多阶段构建
# 构建阶段 - 使用国内镜像源
FROM registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

# 安装构建依赖
RUN apk update && apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
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

# 复制源代码
COPY . .

# 构建应用
ARG VITE_API_URL=http://localhost:8000
ARG VITE_API_VERSION=v1
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_VERSION=$VITE_API_VERSION

RUN npm run build

# 生产阶段 - 使用Nginx
FROM registry.cn-hangzhou.aliyuncs.com/google_containers/nginx:alpine

# 安装curl用于健康检查
RUN apk add --no-cache curl

# 从构建阶段复制构建好的文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建自定义nginx配置
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index index.html index.htm;' >> /etc/nginx/conf.d/default.conf && \
    echo '    try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    location /api/ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_pass http://backend:8000/;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-Proto $scheme;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '    location /health {' >> /etc/nginx/conf.d/default.conf && \
    echo '        access_log off;' >> /etc/nginx/conf.d/default.conf && \
    echo '        return 200 "healthy\n";' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Content-Type text/plain;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# 创建非root用户
RUN addgroup -g 1001 -S nginx_user && \
    adduser -S nginx_user -u 1001 -G nginx_user

# 设置权限
RUN chown -R nginx_user:nginx_user /usr/share/nginx/html && \
    chown -R nginx_user:nginx_user /var/cache/nginx && \
    chown -R nginx_user:nginx_user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx_user:nginx_user /var/run/nginx.pid

# 切换到非root用户
USER nginx_user

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"] 