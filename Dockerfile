# ==============================================================================
# EggCMS Docker 多阶段构建配置
# 基于 Node.js 18 Alpine 镜像，优化生产环境部署
# ==============================================================================

# ============ 构建阶段 ============
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@9

# 复制依赖配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY server/package.json ./server/

# 安装依赖（包括 egg-mongoose，忽略脚本）
RUN pnpm install --ignore-scripts

# ============ 生产运行阶段 ============
FROM node:18-alpine AS production

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# 创建应用用户（安全最佳实践）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S eggcms -u 1001

# 安装必要的系统包（移除数据库客户端工具，减少镜像体积）
RUN apk add --no-cache \
    dumb-init \
    curl \
    bash

# 设置工作目录
WORKDIR /app

# 从构建阶段复制依赖
COPY --from=builder --chown=eggcms:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=eggcms:nodejs /app/server/node_modules ./server/node_modules

# 复制应用代码
COPY --chown=eggcms:nodejs server/ ./server/

# 复制启动脚本（移除初始化脚本）
COPY --chown=eggcms:nodejs docker/entrypoint.sh ./docker/entrypoint.sh
COPY --chown=eggcms:nodejs docker/wait-for-it.sh ./docker/wait-for-it.sh

# 创建必要的目录
RUN mkdir -p /app/server/logs /app/server/run && \
    chown -R eggcms:nodejs /app

# 设置执行权限
RUN chmod +x ./docker/entrypoint.sh ./docker/wait-for-it.sh

# 切换到应用用户
USER eggcms

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# 使用 dumb-init 作为 PID 1，处理信号
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# 默认启动命令
CMD ["./docker/entrypoint.sh"] 
