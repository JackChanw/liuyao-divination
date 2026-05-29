# ============ 阶段 1：构建 ============
FROM node:20-alpine AS builder

WORKDIR /app

# 利用层缓存：先装依赖
COPY package.json ./
# 若存在 lock 文件则一并复制（首次构建可能没有）
COPY package-lock.json* ./

# 优先 npm ci，回退 npm install
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

# 复制源码并构建
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src

RUN npm run build

# ============ 阶段 2：nginx 提供静态资源 ============
FROM nginx:1.27-alpine AS runner

# 替换默认站点配置
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
