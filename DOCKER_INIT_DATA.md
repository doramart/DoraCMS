# Docker 初始化数据配置指南

本文档说明如何配置 Docker 容器的初始化数据，让容器首次启动时自动导入您的数据。

## 📍 数据源位置

### MongoDB 初始化数据

**路径**: `./docker/mongodb/initdata/`

**格式**: BSON 文件（MongoDB 原生格式）

**说明**:

- `init-mongodb.sh` 脚本会自动导入该目录下所有 `.bson` 文件
- 每个 `.bson` 文件对应一个 MongoDB 集合
- 同时需要对应的 `.metadata.json` 文件（包含索引等元数据）
- 导入完成后会自动清空管理员集合（`admins`/`adminusers`/`contents`），首次登录需在界面创建管理员
- 如需自定义挂载目录，可设置环境变量 `MONGODB_INIT_DIR=/your/path`

**示例结构**:

```
docker/mongodb/initdata/
├── users.bson
├── users.metadata.json
├── contents.bson
├── contents.metadata.json
├── categories.bson
├── categories.metadata.json
└── ...
```

### MariaDB 初始化数据

**路径**: `./docker/mariadb/init/`

**格式**: SQL 文件或 Shell 脚本

**说明**:

- MariaDB 官方镜像会按文件名顺序自动执行该目录下的 `.sql` 和 `.sh` 文件
- 文件按字母顺序执行，建议使用数字前缀（如 `01-xxx.sql`, `02-yyy.sql`）
- 只在容器首次启动时执行一次
- 初始化完成后，`init-mariadb.sh` 会清空 `admins` 与 `admin_roles`/`contents`，保证首次登录需自行创建管理员
- 如需变更初始化目录，可设置 `MARIADB_INIT_DIR=/your/path`

**示例结构**:

```
docker/mariadb/init/
├── 00-readme.txt        # 说明文件（不会执行）
├── 01-init-data.sql     # 初始化数据
└── 02-procedures.sql    # 存储过程（可选）
```

## 🎯 使用现有数据库数据

### 方案 1: 使用自动备份脚本（推荐）

我已经为您创建了自动备份脚本 `scripts/backup-to-init-data.sh`。

#### 步骤 1: 配置数据库连接信息

编辑脚本中的配置区域：

```bash
vim scripts/backup-to-init-data.sh
```

修改以下配置：

```bash
# MongoDB 连接信息
MONGODB_HOST="localhost"           # 您的 MongoDB 主机
MONGODB_PORT="27017"               # 您的 MongoDB 端口
MONGODB_USERNAME="eggcms"          # 您的 MongoDB 用户名
MONGODB_PASSWORD="eggcms123"       # 您的 MongoDB 密码
MONGODB_DATABASE="doracms3"        # 您的数据库名
MONGODB_AUTH_SOURCE="doracms3"     # 认证数据库

# MariaDB 连接信息
MARIADB_HOST="localhost"           # 您的 MariaDB 主机
MARIADB_PORT="3306"                # 您的 MariaDB 端口
MARIADB_USERNAME="eggcms"          # 您的 MariaDB 用户名
MARIADB_PASSWORD="eggcms123"       # 您的 MariaDB 密码
MARIADB_DATABASE="doracms3"        # 您的数据库名
```

#### 步骤 2: 运行备份脚本

```bash
# 进入项目目录
cd egg-cms

# 运行备份脚本
./scripts/backup-to-init-data.sh

# 根据提示选择要备份的数据库:
# 1) MongoDB
# 2) MariaDB
# 3) 两个都备份
```

脚本会自动：

- ✅ 备份您的数据库数据
- ✅ 转换为正确的格式（MongoDB: BSON，MariaDB: SQL）
- ✅ 放置到正确的初始化目录
- ✅ 显示备份统计信息

#### 步骤 3: 验证备份

```bash
# 查看 MongoDB 备份
ls -lh docker/mongodb/initdata/
# 应该看到多个 .bson 和 .metadata.json 文件

# 查看 MariaDB 备份
ls -lh docker/mariadb/init/
# 应该看到 01-init-data.sql 文件

# 检查 SQL 文件内容（可选）
head -n 50 docker/mariadb/init/01-init-data.sql
```

### 方案 2: 手动备份数据

如果您不想使用脚本，也可以手动备份。

#### MongoDB 手动备份

```bash
# 1. 创建目标目录
mkdir -p docker/mongodb/initdata

# 2. 使用 mongodump 备份
mongodump \
  --host=localhost \
  --port=27017 \
  --username=eggcms \
  --password=eggcms123 \
  --authenticationDatabase=doracms3 \
  --db=doracms3 \
  --out=./docker/mongodb/initdata

# 3. 验证备份
ls -lh docker/mongodb/initdata/
```

#### MariaDB 手动备份

```bash
# 1. 创建目标目录
mkdir -p docker/mariadb/init

# 2. 使用 mariadb-dump 或 mysqldump 备份
mariadb-dump \
  -h localhost \
  -P 3306 \
  -u eggcms \
  -peggcms123 \
  --databases doracms3 \
  --single-transaction \
  --default-character-set=utf8mb4 \
  > docker/mariadb/init/01-init-data.sql

# 或使用 mysqldump
mysqldump \
  -h localhost \
  -P 3306 \
  -u eggcms \
  -peggcms123 \
  --databases doracms3 \
  --single-transaction \
  --default-character-set=utf8mb4 \
  > docker/mariadb/init/01-init-data.sql

# 3. 验证备份
ls -lh docker/mariadb/init/
head -n 20 docker/mariadb/init/01-init-data.sql
```

## 🚀 启动 Docker 容器

备份完成后，启动 Docker 容器：

### MongoDB 模式

```bash
# 启动容器（会自动导入数据）
docker compose up -d

# 查看初始化日志
docker compose logs -f mongodb-init

# 验证数据导入
docker compose exec mongodb mongosh \
  --username eggcms \
  --password eggcms123 \
  --authenticationDatabase doracms3 \
  --eval "use doracms3; db.getCollectionNames();"
```

### MariaDB 模式

```bash
# 启动容器（会自动导入数据）
docker compose --profile mariadb up -d

# 查看初始化日志
docker compose logs -f mariadb

# 验证数据导入
docker compose exec mariadb mariadb \
  -u eggcms \
  -peggcms123 \
  doracms3 \
  -e "SHOW TABLES;"
```

## ⚠️ 重要注意事项

### 1. 初始化只执行一次

Docker 容器的初始化脚本**只在首次启动时执行一次**。如果容器已经启动过，即使更新了初始化数据，也不会重新导入。

### 2. 如何重新初始化

如果需要重新导入数据：

```bash
# 方法 1: 删除数据卷（⚠️ 会删除所有数据）
docker compose down -v
docker compose up -d

# 方法 2: 只删除特定数据卷
docker volume rm egg-cms_mongodb-data
# 或
docker volume rm egg-cms_mariadb-data

# 然后重新启动
docker compose up -d
```

### 3. 数据卷持久化

数据存储在 Docker 数据卷中，容器删除后数据不会丢失。只有使用 `docker compose down -v` 才会删除数据卷。

### 4. 字符集问题

确保备份时使用正确的字符集：

- MongoDB: 默认 UTF-8，无需特殊处理
- MariaDB: 必须使用 `--default-character-set=utf8mb4`

### 5. 备份文件大小

如果数据量很大（> 1GB），导入可能需要较长时间。建议：

- 在容器启动日志中观察导入进度
- 增加健康检查的 `start_period` 时间

## 🔍 故障排除

### MongoDB 数据导入失败

**问题**: `mongorestore` 报错

**解决**:

```bash
# 1. 检查备份文件格式
ls -lh server/initdata/doracms3/
# 确保有 .bson 和 .metadata.json 文件

# 2. 查看详细错误日志
docker compose logs mongodb-init

# 3. 手动测试导入
docker compose exec mongodb mongorestore \
  --username=eggcms \
  --password=eggcms123 \
  --authenticationDatabase=doracms3 \
  --db=doracms3 \
  --dir=/docker-entrypoint-initdb.d/doracms3
```

### MariaDB 数据导入失败

**问题**: SQL 执行错误

**解决**:

```bash
# 1. 检查 SQL 文件
cat docker/mariadb/init/01-init-data.sql | head -n 50

# 2. 查看错误日志
docker compose logs mariadb

# 3. 手动测试导入
docker compose exec -T mariadb mariadb \
  -u eggcms \
  -peggcms123 \
  doracms3 < docker/mariadb/init/01-init-data.sql
```

### 数据导入但容器无法启动

**问题**: 导入成功但应用无法连接数据库

**解决**:

```bash
# 1. 检查用户权限
# MongoDB
docker compose exec mongodb mongosh \
  --username admin \
  --password admin123 \
  --authenticationDatabase admin \
  --eval "use doracms3; db.getUsers();"

# MariaDB
docker compose exec mariadb mariadb \
  -u root \
  -padmin123 \
  -e "SELECT User, Host FROM mysql.user WHERE User='eggcms';"

# 2. 检查数据库连接配置
docker compose exec eggcms-app env | grep DATABASE
```

## 📝 完整示例流程

假设您有一个运行中的 MongoDB 和 MariaDB，以下是完整的操作流程：

```bash
# 1. 进入项目目录
cd egg-cms

# 2. 编辑备份脚本配置
vim scripts/backup-to-init-data.sh
# 修改数据库连接信息

# 3. 运行备份脚本
./scripts/backup-to-init-data.sh
# 选择 "3) 两个都备份"

# 4. 验证备份
ls -lh docker/mongodb/initdata/
ls -lh docker/mariadb/init/

# 5. 配置环境变量
cp docker.env.example .env
vim .env
# 修改数据库密码等配置

# 6. 启动 MongoDB 模式
docker compose up -d

# 7. 查看日志，等待初始化完成
docker compose logs -f mongodb-init
# 看到 "🎉 MongoDB初始化完成！" 表示成功

# 8. 查看应用日志
docker compose logs -f eggcms-app

# 9. 访问应用
curl http://localhost:8080/api/health

# 10. 如果需要切换到 MariaDB
docker compose down
docker compose --profile mariadb up -d
```

## 🎯 最佳实践

1. **定期备份**: 建议定期运行备份脚本，保持初始化数据的更新
2. **版本控制**: 将备份数据纳入版本控制（如果数据不敏感）
3. **测试验证**: 在测试环境先验证初始化流程
4. **文档记录**: 记录自定义的初始化脚本和数据结构
5. **安全考虑**: 不要在备份中包含敏感数据（密码、密钥等）

## 📚 相关文档

- [Docker 部署指南](./DOCKER_DEPLOYMENT.md) - 完整的 Docker 部署文档
- [数据库迁移指南](./DATABASE_MIGRATION.md) - MongoDB ↔ MariaDB 迁移
- [备份与恢复](./DOCKER_DEPLOYMENT.md#备份与恢复) - 生产环境备份策略

---

**最后更新**: 2024年1月  
**版本**: v3.0.0
