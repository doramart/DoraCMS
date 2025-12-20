# EggCMS Docker 部署指南

本指南介绍如何使用 Docker 和 Docker Compose 部署 EggCMS 系统，支持 MongoDB 和 MariaDB 两种数据库。

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [部署选项](#部署选项)
  - [使用 MongoDB（默认）](#使用-mongodb默认)
  - [使用 MariaDB](#使用-mariadb)
  - [Redis 缓存（必选）](#redis-缓存必选)
  - [启用 Nginx 反向代理](#启用-nginx-反向代理)
- [环境配置](#环境配置)
- [数据持久化](#数据持久化)
- [健康检查](#健康检查)
- [日志管理](#日志管理)
- [备份与恢复](#备份与恢复)
- [故障排除](#故障排除)
- [生产环境建议](#生产环境建议)

## 系统要求

- Docker >= 20.10
- Docker Compose >= 2.0
- 至少 2GB 可用内存
- 至少 10GB 可用磁盘空间

### 验证安装

```bash
docker --version
docker compose version
```

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd egg-cms
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp docker.env.example .env

# 编辑环境变量（重要：修改安全相关配置）
vim .env
```

**数据库模式选择：**

- `DATABASE_TYPE` 控制运行时使用 MongoDB 还是 MariaDB
- `COMPOSE_PROFILES` 控制 docker compose 启动的服务集（`mongodb` 或 `mariadb`，可追加 `redis`,`nginx`）
  - 示例：`COMPOSE_PROFILES=mongodb`（默认）、`COMPOSE_PROFILES=mariadb,redis`

**⚠️ 生产环境必须修改的配置项：**

- `APP_KEYS` - 应用密钥
- `SESSION_SECRET` - 会话密钥
- `MONGODB_PASSWORD` / `MARIADB_PASSWORD` - 数据库密码
- `MONGODB_ROOT_PASSWORD` / `MARIADB_ROOT_PASSWORD` - 数据库 root 密码
- `CORS_ORIGINS` - 允许的域名

### 3. 生成安全密钥

```bash
# 使用 Node.js 生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 32
```

### 4. 启动服务

```bash
# 启动 MongoDB 模式（默认）
docker compose up -d

# 查看日志
docker compose logs -f eggcms-app
```

### 5. 访问应用

- **应用首页**: http://localhost:8080
- **管理后台**: http://localhost:8080/admin
- **API 文档**: http://localhost:8080/api

## 部署选项

### 使用 MongoDB（默认）

这是推荐的默认配置，无需额外参数。

```bash
# 启动服务（确保 .env 中 COMPOSE_PROFILES=mongodb）
docker compose up -d

# 或临时指定 profile
COMPOSE_PROFILES=mongodb docker compose up -d

# 查看状态
docker compose ps

# 查看 MongoDB 日志
docker compose logs -f mongodb

# 停止服务
docker compose down
```

**配置文件 `.env`：**

```env
DATABASE_TYPE=mongodb
REPOSITORY_ENABLED=true

MONGODB_HOST=mongodb
MONGODB_PORT=27017
MONGODB_USERNAME=eggcms
MONGODB_PASSWORD=eggcms123
MONGODB_DATABASE=doracms3
```

### 使用 MariaDB

使用 Docker Compose Profiles 功能启用 MariaDB。

```bash
# 启动 MariaDB 模式
COMPOSE_PROFILES=mariadb docker compose up -d
# 或
docker compose --profile mariadb up -d

# 查看 MariaDB 日志
docker compose logs -f mariadb

# 停止服务
docker compose --profile mariadb down
```

**配置文件 `.env`：**

```env
DATABASE_TYPE=mariadb
REPOSITORY_ENABLED=true

MARIADB_HOST=mariadb
MARIADB_PORT=3306
MARIADB_USERNAME=eggcms
MARIADB_PASSWORD=eggcms123
MARIADB_DATABASE=doracms3
```

**注意事项：**

1. 使用 MariaDB 时，建议启用 Repository 模式（`REPOSITORY_ENABLED=true`）
2. MariaDB 首次启动时会自动创建表结构（通过 Sequelize sync），并导入 `docker/mariadb/init` 中的 SQL，随后清空 `admins` 与 `admin_roles` 以便首登创建管理员
3. MongoDB 模式会自动导入 `docker/mongodb/initdata` 下的 BSON 文件，并在导入后清空管理员集合（`admins`/`adminusers`），首登时需创建管理员
4. 如需从 MongoDB 迁移到 MariaDB，请参考[数据库迁移指南](./DATABASE_MIGRATION.md)

### Redis 缓存（必选）

Redis 已设为默认必选组件，启动任意数据库模式都会自动拉起 Redis 并在应用前完成健康检查。

```bash
# 启动（MongoDB 或 MariaDB 模式都会包含 Redis）
docker compose up -d

# 查看 Redis 状态
docker compose logs -f redis
docker compose exec redis redis-cli ping
```

**配置文件 `.env`：**

```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # 可选
REDIS_DB=0
```

### 启用 Nginx 反向代理

使用 Nginx 作为反向代理，支持 HTTPS 和负载均衡。

```bash
# 启动完整堆栈（MongoDB + Redis + Nginx）
docker compose --profile full up -d

# 或仅启动 Nginx
docker compose --profile nginx up -d
```

**配置文件：**

- Nginx 配置: `docker/nginx/nginx.conf`
- 站点配置: `docker/nginx/conf.d/eggcms.conf`
- SSL 证书: 放置在 `docker/ssl/` 目录

**访问地址：**

- HTTP: http://localhost
- HTTPS: https://localhost（需配置 SSL 证书）

## 环境配置

### 环境变量文件

项目支持多个环境配置文件，按优先级从高到低：

1. `.env.production.local` - 生产环境本地配置（最高优先级）
2. `.env.production` - 生产环境配置
3. `.env.local` - 本地通用配置
4. `.env` - 默认配置（最低优先级）

### 核心配置项

#### 数据库配置

```env
# 数据库类型: mongodb 或 mariadb
DATABASE_TYPE=mongodb

# Repository 模式（MariaDB 建议开启）
REPOSITORY_ENABLED=true
```

#### 安全配置

```env
# ⚠️ 必须修改为强随机字符串
APP_KEYS=your_app_keys_here
SESSION_SECRET=your_session_secret
```

#### CORS 配置

```env
# 允许的域名（多个用逗号分隔）
CORS_ORIGINS=http://localhost:8080,https://your-domain.com
DOMAIN_WHITELIST=localhost,your-domain.com
```

#### 文件上传配置

```env
UPLOAD_MAX_SIZE=5MB
UPLOAD_ALLOWED_TYPES=.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx
```

### 完整配置示例

参考 [docker.env.example](./docker.env.example) 文件。

## 数据持久化

### 数据卷说明

Docker Compose 自动创建以下持久化卷：

| 卷名             | 用途         | 数据库类型 |
| ---------------- | ------------ | ---------- |
| `mongodb-data`   | MongoDB 数据 | MongoDB    |
| `mongodb-config` | MongoDB 配置 | MongoDB    |
| `mariadb-data`   | MariaDB 数据 | MariaDB    |
| `redis-data`     | Redis 数据   | 通用       |
| `app-logs`       | 应用日志     | 通用       |
| `app-uploads`    | 上传文件     | 通用       |
| `app-backups`    | 数据备份     | 通用       |

### 查看数据卷

```bash
# 列出所有数据卷
docker volume ls | grep eggcms

# 查看数据卷详情
docker volume inspect egg-cms_mongodb-data

# 查看数据卷使用情况
docker system df -v
```

### 备份数据卷

```bash
# 备份 MongoDB 数据
docker run --rm \
  -v egg-cms_mongodb-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/mongodb-data-$(date +%Y%m%d).tar.gz /data

# 备份上传文件
docker run --rm \
  -v egg-cms_app-uploads:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/app-uploads-$(date +%Y%m%d).tar.gz /data
```

### 恢复数据卷

```bash
# 恢复 MongoDB 数据
docker run --rm \
  -v egg-cms_mongodb-data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "cd / && tar xzf /backup/mongodb-data-20240101.tar.gz"
```

### 清理数据卷

```bash
# ⚠️ 警告：这将删除所有数据！
docker compose down -v

# 删除特定数据卷
docker volume rm egg-cms_mongodb-data
```

## 健康检查

### 服务健康状态

```bash
# 查看所有服务状态
docker compose ps

# 查看特定服务健康状态
docker inspect --format='{{.State.Health.Status}}' eggcms-app
```

### 手动健康检查

```bash
# 应用健康检查
curl http://localhost:8080/api/health

# MongoDB 健康检查
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# MariaDB 健康检查
docker compose exec mariadb healthcheck.sh --connect

# Redis 健康检查
docker compose exec redis redis-cli ping
```

### 健康检查配置

服务健康检查配置在 `docker-compose.yml` 中：

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:8080/api/health']
  interval: 30s # 检查间隔
  timeout: 10s # 超时时间
  retries: 3 # 重试次数
  start_period: 40s # 启动宽限期
```

## 日志管理

### 查看日志

```bash
# 查看所有服务日志
docker compose logs

# 实时跟踪日志
docker compose logs -f

# 查看特定服务日志
docker compose logs eggcms-app
docker compose logs mongodb
docker compose logs mariadb

# 查看最近 100 行日志
docker compose logs --tail=100 eggcms-app

# 查看特定时间段日志
docker compose logs --since 2024-01-01 --until 2024-01-02 eggcms-app
```

### 应用日志

应用日志存储在数据卷 `app-logs` 中：

```bash
# 进入日志目录
docker compose exec eggcms-app sh
cd /app/server/logs
ls -lh

# 查看应用日志
tail -f /app/server/logs/egg-web.log
tail -f /app/server/logs/common-error.log
```

### 日志轮转

应用使用 EggJS 的日志轮转功能，默认配置：

- 日志文件按天轮转
- 保留最近 7 天的日志
- 错误日志单独记录

## 备份与恢复

### MongoDB 备份

#### 手动备份

```bash
# 备份所有数据
docker compose exec mongodb mongodump \
  --username=eggcms \
  --password=eggcms123 \
  --authenticationDatabase=doracms3 \
  --db=doracms3 \
  --out=/data/backup

# 复制备份到宿主机
docker cp eggcms-mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)
```

#### 恢复备份

```bash
# 复制备份到容器
docker cp ./mongodb-backup-20240101 eggcms-mongodb:/data/restore

# 恢复数据
docker compose exec mongodb mongorestore \
  --username=eggcms \
  --password=eggcms123 \
  --authenticationDatabase=doracms3 \
  --db=doracms3 \
  /data/restore/doracms3
```

### MariaDB 备份

#### 手动备份

```bash
# 备份数据库
docker compose exec mariadb mariadb-dump \
  -u eggcms \
  -peggcms123 \
  doracms3 > mariadb-backup-$(date +%Y%m%d).sql

# 或使用 root 用户
docker compose exec mariadb mariadb-dump \
  -u root \
  -padmin123 \
  --all-databases > mariadb-full-backup-$(date +%Y%m%d).sql
```

#### 恢复备份

```bash
# 恢复数据库
cat mariadb-backup-20240101.sql | \
  docker compose exec -T mariadb mariadb \
  -u eggcms \
  -peggcms123 \
  doracms3
```

### 自动备份脚本

创建 `scripts/backup.sh`：

```bash
#!/bin/bash
set -e

BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# 备份 MongoDB
docker compose exec -T mongodb mongodump \
  --username=eggcms \
  --password=eggcms123 \
  --authenticationDatabase=doracms3 \
  --db=doracms3 \
  --archive > "$BACKUP_DIR/mongodb.archive"

# 备份上传文件
docker run --rm \
  -v egg-cms_app-uploads:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/$(date +%Y%m%d)/uploads.tar.gz /data

echo "备份完成: $BACKUP_DIR"
```

添加到 crontab：

```bash
# 每天凌晨 2 点自动备份
0 2 * * * cd /path/to/egg-cms && ./scripts/backup.sh
```

## 故障排除

### 常见问题

#### 1. 容器无法启动

```bash
# 查看容器日志
docker compose logs eggcms-app

# 检查端口占用
sudo lsof -i :8080
sudo lsof -i :27017
sudo lsof -i :3306

# 重新构建镜像
docker compose build --no-cache
docker compose up -d
```

#### 2. 数据库连接失败

```bash
# 检查数据库服务状态
docker compose ps mongodb
docker compose ps mariadb

# 检查数据库日志
docker compose logs mongodb
docker compose logs mariadb

# 手动测试连接
docker compose exec eggcms-app ping mongodb
docker compose exec eggcms-app ping mariadb

# 验证环境变量
docker compose exec eggcms-app env | grep DATABASE
```

#### 3. 数据初始化失败

```bash
# 检查初始化日志
docker compose logs mongodb-init
docker compose logs mariadb-init

# 重新运行初始化
docker compose up -d --force-recreate mongodb-init
docker compose up -d --force-recreate mariadb-init
```

#### 4. 权限问题

```bash
# 检查文件所有权
docker compose exec eggcms-app ls -la /app/server/logs

# 修复权限
docker compose exec -u root eggcms-app chown -R eggcms:nodejs /app/server/logs
```

#### 5. 内存不足

```bash
# 查看资源使用
docker stats

# 增加 Docker 内存限制
# 编辑 docker-compose.yml，添加：
services:
  eggcms-app:
    deploy:
      resources:
        limits:
          memory: 1G
```

### 调试模式

启用详细日志：

```bash
# 设置日志级别
echo "LOG_LEVEL=DEBUG" >> .env

# 重启服务
docker compose restart eggcms-app

# 查看详细日志
docker compose logs -f eggcms-app
```

### 性能分析

```bash
# 查看容器资源使用
docker stats eggcms-app mongodb mariadb redis

# 查看网络连接
docker compose exec eggcms-app netstat -an

# 查看进程
docker compose exec eggcms-app ps aux
```

## 生产环境建议

### 安全加固

1. **修改所有默认密码**

   ```env
   MONGODB_ROOT_PASSWORD=<strong-random-password>
   MONGODB_PASSWORD=<strong-random-password>
   MARIADB_ROOT_PASSWORD=<strong-random-password>
   MARIADB_PASSWORD=<strong-random-password>
   APP_KEYS=<strong-random-key>
   SESSION_SECRET=<strong-random-key>
   ```

2. **限制网络访问**

   ```yaml
   # 数据库不暴露到外部
   ports:
     # - '27017:27017'  # 注释掉
     # - '3306:3306'    # 注释掉
   ```

3. **使用 HTTPS**

   - 配置 SSL 证书
   - 启用 Nginx 反向代理
   - 强制 HTTPS 重定向

4. **启用防火墙**
   ```bash
   # 仅允许必要端口
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

### 性能优化

1. **数据库优化**

   - MongoDB: 配置合适的 WiredTiger 缓存大小
   - MariaDB: 调整 InnoDB 缓冲池大小
   - 参考: `docker/mariadb/conf.d/custom.cnf`

2. **Redis 缓存（默认启用）**

   ```env
   REDIS_HOST=redis
   CACHE_TYPE=redis
   ```

3. **使用生产模式**

   ```env
   NODE_ENV=production
   ```

4. **启用 gzip 压缩**（Nginx 已默认启用）

### 监控

1. **健康检查**

   - 配置外部监控工具（如 Prometheus）
   - 设置告警规则

2. **日志收集**

   - 集成 ELK Stack 或 Loki
   - 设置日志轮转和归档

3. **性能监控**
   - 使用 Grafana 可视化
   - 监控关键指标（CPU、内存、磁盘、网络）

### 高可用部署

1. **数据库主从复制**

   - MongoDB Replica Set
   - MariaDB Master-Slave

2. **负载均衡**

   - 使用 Nginx 或云负载均衡器
   - 多实例部署

3. **自动故障转移**
   - 配置健康检查和自动重启
   - 使用 Kubernetes 或 Docker Swarm

### 备份策略

1. **定时备份**

   - 每日全量备份
   - 每小时增量备份（如支持）

2. **异地备份**

   - 将备份上传到云存储（S3、OSS 等）
   - 保留多个备份版本

3. **定期测试恢复**
   - 每月测试备份恢复流程
   - 验证数据完整性

## 扩展阅读

- [数据库迁移指南](./DATABASE_MIGRATION.md) - MongoDB ↔ MariaDB 迁移
- [环境变量参考](./docker.env.example) - 完整的环境变量说明
- [Nginx 配置](./docker/nginx/) - 反向代理和 SSL 配置
- [EggJS 文档](https://eggjs.org/) - EggJS 框架文档

## 技术支持

如有问题，请通过以下方式获取帮助：

- 📖 [项目文档](./README.md)
- 🐛 [Issue 跟踪](https://github.com/your-repo/issues)
- 💬 [讨论区](https://github.com/your-repo/discussions)

---

**版本**: v3.0.0  
**最后更新**: 2024年1月  
**许可证**: MIT
