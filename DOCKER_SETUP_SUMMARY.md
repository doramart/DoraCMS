# EggCMS Docker 部署配置完成总结

## ✅ 完成的工作

本次完善了 EggCMS 项目的 Docker 部署配置，实现了对 MongoDB 和 MariaDB 双数据库的完整支持。

### 1. Docker Compose 配置

**文件**: `docker-compose.yml`

**新增服务**:

- ✅ **MariaDB 数据库服务** - MariaDB 11.2 容器
- ✅ **MariaDB 初始化服务** - 自动创建数据库和表结构
- ✅ **应用服务 (MariaDB 模式)** - 专用于 MariaDB 的应用容器

**服务架构**:

```
┌─────────────────────────────────────────────┐
│           EggCMS 应用服务                     │
│  (支持 MongoDB 或 MariaDB 模式)               │
└────────┬──────────────────────┬──────────────┘
         │                      │
    ┌────▼────┐            ┌────▼────┐
    │ MongoDB │            │ MariaDB │
    │ (默认)   │            │(Profile)│
    └────┬────┘            └────┬────┘
         │                      │
    ┌────▼────┐            ┌────▼────┐
    │ 初始化   │            │ 初始化   │
    └─────────┘            └─────────┘

可选组件:
┌─────────┐  ┌─────────┐
│  Redis  │  │  Nginx  │
│ (缓存)  │  │ (代理)  │
└─────────┘  └─────────┘
```

**Profile 支持**:

- `default`: MongoDB + 应用
- `mariadb`: MariaDB + 应用
- `redis`: Redis 缓存
- `nginx`: Nginx 反向代理
- `full`: MongoDB + Redis + Nginx

### 2. 数据库初始化脚本

#### MongoDB 初始化

**文件**: `docker/init-mongodb.sh`

**功能**:

- ✅ 等待 MongoDB 服务启动
- ✅ 创建应用数据库用户
- ✅ 导入初始化数据 (BSON 格式)
- ✅ 创建必要的索引
- ✅ 验证数据完整性

#### MariaDB 初始化

**文件**: `docker/init-mariadb.sh`

**功能**:

- ✅ 等待 MariaDB 服务启动
- ✅ 验证数据库连接
- ✅ 创建基础表结构（迁移记录表）
- ✅ 优化数据库参数
- ✅ 显示数据库信息

**MariaDB 配置**:
**文件**: `docker/mariadb/conf.d/custom.cnf`

**优化项**:

- ✅ 字符集: utf8mb4
- ✅ InnoDB 缓冲池: 256MB
- ✅ 连接数: 200
- ✅ 慢查询日志
- ✅ 其他性能优化参数

### 3. 应用启动脚本

**文件**: `docker/entrypoint.sh`

**新增功能**:

- ✅ 数据库类型检测（mongodb/mariadb）
- ✅ 环境变量自动验证
- ✅ MariaDB 连接等待和检查
- ✅ 智能服务依赖管理
- ✅ 详细的启动信息显示

**核心功能**:

```bash
# 自动检测数据库类型
DATABASE_TYPE="${DATABASE_TYPE:-mongodb}"

# 根据类型启动不同的数据库连接检查
if [[ "$DATABASE_TYPE" == "mongodb" ]]; then
    # MongoDB 连接检查
elif [[ "$DATABASE_TYPE" == "mariadb" ]]; then
    # MariaDB 连接检查
fi
```

### 4. Dockerfile 改进

**文件**: `Dockerfile`

**改进**:

- ✅ 新增 `mariadb-client` 工具
- ✅ 多阶段构建优化
- ✅ 安全用户运行
- ✅ 健康检查支持

### 5. 环境配置

**文件**: `docker.env.example`

**完善内容**:

- ✅ 数据库类型选择说明
- ✅ MongoDB 完整配置
- ✅ MariaDB 完整配置
- ✅ Repository 模式说明
- ✅ 安全密钥生成指南
- ✅ 缓存配置选项
- ✅ 详细的配置注释

### 6. 文档

#### Docker 部署指南

**文件**: `DOCKER_DEPLOYMENT.md`

**内容**:

- ✅ 系统要求
- ✅ 快速开始
- ✅ MongoDB 部署
- ✅ MariaDB 部署
- ✅ Redis 配置
- ✅ Nginx 配置
- ✅ 环境变量详解
- ✅ 数据持久化
- ✅ 健康检查
- ✅ 日志管理
- ✅ 备份恢复
- ✅ 故障排除
- ✅ 生产环境建议

#### 数据库迁移指南

**文件**: `DATABASE_MIGRATION.md`

**内容**:

- ✅ 架构说明
- ✅ Repository 模式介绍
- ✅ MongoDB → MariaDB 迁移
- ✅ MariaDB → MongoDB 迁移
- ✅ 数据库并行运行
- ✅ 常见问题解答
- ✅ 故障排除
- ✅ 最佳实践

#### 快速启动脚本

**文件**: `docker-quickstart.sh`

**功能**:

- ✅ 交互式部署向导
- ✅ 自动环境检查
- ✅ 配置文件生成
- ✅ 密钥生成工具
- ✅ 服务状态显示
- ✅ 一键启动/停止/清理

#### README 更新

**文件**: `README.md`

**新增**:

- ✅ Docker 部署章节
- ✅ 双数据库支持说明
- ✅ 快速启动指南
- ✅ 文档索引

### 7. 辅助文件

#### .dockerignore

**文件**: `.dockerignore`

**优化**:

- ✅ 排除开发文件
- ✅ 排除文档
- ✅ 排除测试文件
- ✅ 排除日志和临时文件
- ✅ 减小镜像体积

## 📊 技术特性

### 双数据库支持

| 特性     | MongoDB   | MariaDB   |
| -------- | --------- | --------- |
| 版本     | 6.0       | 11.2      |
| 驱动     | Mongoose  | Sequelize |
| 字符集   | UTF-8     | utf8mb4   |
| 初始化   | BSON 导入 | Auto Sync |
| 性能优化 | ✅        | ✅        |
| 事务支持 | ✅        | ✅        |

### Repository 模式

```
Service Layer
     ↓
IRepository Interface
     ↓
┌─────────────┬─────────────┐
│ MongoDB     │  MariaDB    │
│ Adapter     │  Adapter    │
└─────────────┴─────────────┘
```

**优势**:

- ✅ 统一的业务接口
- ✅ 数据库无关的业务逻辑
- ✅ 灵活切换数据库
- ✅ 易于测试和维护

### 部署模式

#### 单数据库模式（推荐生产环境）

```yaml
# MongoDB 模式
docker compose up -d

# MariaDB 模式
docker compose --profile mariadb up -d
```

#### 完整堆栈模式

```yaml
# MongoDB + Redis + Nginx
docker compose --profile full up -d

# MariaDB + Redis + Nginx
docker compose --profile mariadb --profile redis --profile nginx up -d
```

### 数据持久化

| 数据卷       | 用途         | 大小预估   |
| ------------ | ------------ | ---------- |
| mongodb-data | MongoDB 数据 | 按需增长   |
| mariadb-data | MariaDB 数据 | 按需增长   |
| redis-data   | Redis 数据   | < 1GB      |
| app-logs     | 应用日志     | < 100MB/天 |
| app-uploads  | 上传文件     | 按需增长   |
| app-backups  | 备份文件     | 按需       |

## 🚀 快速使用指南

### 方式一：使用快速启动脚本（推荐）

```bash
# 1. 进入项目目录
cd egg-cms

# 2. 运行快速启动脚本
./docker-quickstart.sh

# 3. 根据提示选择配置

# MongoDB 模式
./docker-quickstart.sh

# MariaDB 模式
./docker-quickstart.sh --database mariadb

# 完整堆栈（MongoDB + Redis + Nginx）
./docker-quickstart.sh --full

# 完整堆栈（MariaDB + Redis + Nginx）
./docker-quickstart.sh --mariadb-full
```

### 方式二：使用 Docker Compose

```bash
# 1. 配置环境变量
cp docker.env.example .env
vim .env

# 2. 启动服务

# MongoDB（默认）
docker compose up -d

# MariaDB
docker compose --profile mariadb up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 方式三：手动步骤

```bash
# 1. 准备环境配置
cp docker.env.example .env

# 2. 生成安全密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. 编辑 .env，填入配置

# 4. 启动数据库（选择一个）
docker compose up -d mongodb mongodb-init
# 或
docker compose --profile mariadb up -d mariadb mariadb-init

# 5. 启动应用
docker compose up -d eggcms-app
# 或
docker compose --profile mariadb up -d eggcms-app-mariadb

# 6. 验证服务
curl http://localhost:8080/api/health
```

## 🔧 常用命令

### 服务管理

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f eggcms-app
docker compose logs -f mongodb
docker compose logs -f mariadb

# 重启服务
docker compose restart eggcms-app

# 停止所有服务
docker compose down

# 清理所有数据（⚠️ 危险操作）
docker compose down -v
```

### 数据库操作

```bash
# 进入 MongoDB
docker compose exec mongodb mongosh \
  --username eggcms \
  --password eggcms123 \
  --authenticationDatabase doracms3

# 进入 MariaDB
docker compose exec mariadb mariadb \
  -u eggcms \
  -peggcms123 \
  doracms3

# 备份 MongoDB
docker compose exec mongodb mongodump \
  --username=eggcms \
  --password=eggcms123 \
  --authenticationDatabase=doracms3 \
  --db=doracms3 \
  --archive > backup.archive

# 备份 MariaDB
docker compose exec mariadb mariadb-dump \
  -u eggcms \
  -peggcms123 \
  doracms3 > backup.sql
```

### 调试

```bash
# 进入应用容器
docker compose exec eggcms-app sh

# 查看环境变量
docker compose exec eggcms-app env

# 查看进程
docker compose exec eggcms-app ps aux

# 查看网络
docker compose exec eggcms-app netstat -an
```

## 📝 重要注意事项

### 生产环境部署

1. **⚠️ 必须修改所有默认密码和密钥**

   ```env
   APP_KEYS=<生成的随机密钥>
   SESSION_SECRET=<生成的随机密钥>
   MONGODB_PASSWORD=<强密码>
   MARIADB_PASSWORD=<强密码>
   ```

2. **⚠️ 配置 CORS 白名单**

   ```env
   CORS_ORIGINS=https://your-domain.com
   DOMAIN_WHITELIST=your-domain.com
   ```

3. **⚠️ 数据库端口不要暴露到公网**

   ```yaml
   # 注释掉 ports 配置
   # ports:
   #   - '27017:27017'
   #   - '3306:3306'
   ```

4. **⚠️ 使用 HTTPS**

   - 配置 SSL 证书
   - 启用 Nginx 反向代理
   - 强制 HTTPS 重定向

5. **⚠️ 定期备份数据**
   - 设置自动备份脚本
   - 测试备份恢复流程
   - 异地存储备份文件

### 性能优化

1. **数据库优化**

   - 调整 MariaDB InnoDB 缓冲池大小
   - 配置 MongoDB WiredTiger 缓存
   - 创建合适的索引

2. **应用优化**

   - 启用 Redis 缓存
   - 使用生产模式运行
   - 配置适当的进程数

3. **网络优化**
   - 使用 CDN 分发静态资源
   - 启用 gzip 压缩
   - 配置缓存策略

## 🎯 下一步

### 开发环境

如果需要本地开发，参考 [MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md)：

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev:all
```

### 数据库迁移

如果需要在 MongoDB 和 MariaDB 之间迁移数据，参考 [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)。

### Repository 开发

如果需要了解数据库适配层的实现，参考 [server/app/repository/README.md](./server/app/repository/README.md)。

## 📚 完整文档索引

| 文档                                                                 | 说明                |
| -------------------------------------------------------------------- | ------------------- |
| [README.md](./README.md)                                             | 项目总览            |
| [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)                       | Docker 部署完整指南 |
| [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)                     | 数据库迁移指南      |
| [docker.env.example](./docker.env.example)                           | 环境变量配置模板    |
| [docker-compose.yml](./docker-compose.yml)                           | Docker Compose 配置 |
| [docker-quickstart.sh](./docker-quickstart.sh)                       | 快速启动脚本        |
| [server/app/repository/README.md](./server/app/repository/README.md) | Repository 模式文档 |

## 🆘 获取帮助

如有问题，请：

1. 查看 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) 的故障排除章节
2. 检查 Docker 容器日志：`docker compose logs -f`
3. 查看 [Issue 列表](https://github.com/your-repo/issues)
4. 提交新的 Issue

## ✨ 总结

本次 Docker 部署配置完善工作：

- ✅ **完整支持** MongoDB 和 MariaDB 双数据库
- ✅ **灵活部署** 支持多种部署组合（Profile）
- ✅ **自动化** 提供初始化脚本和快速启动工具
- ✅ **生产就绪** 包含安全、性能、监控等最佳实践
- ✅ **完整文档** 涵盖部署、迁移、故障排除等所有场景
- ✅ **易于使用** 一条命令即可启动完整服务

项目现在可以轻松地部署到任何支持 Docker 的环境中，无论是开发、测试还是生产环境。

---

**完成时间**: 2024年1月  
**版本**: v3.0.0  
**作者**: EggCMS 团队
