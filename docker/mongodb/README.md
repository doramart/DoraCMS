# MongoDB Docker 配置

本目录包含 MongoDB 容器的相关配置和初始化数据。

## 目录结构

```
mongodb/
└── initdata/           # 初始化数据目录
    ├── .gitkeep        # 保持目录
    ├── users.bson      # 用户数据（备份后）
    ├── users.metadata.json
    ├── contents.bson   # 内容数据（备份后）
    ├── contents.metadata.json
    └── ...             # 其他集合数据
```

## initdata 目录

### 用途

存放 MongoDB 的初始化数据（BSON 格式）。Docker 容器首次启动时会自动导入此目录下的所有数据。

### 数据格式

- **`.bson` 文件**: MongoDB 集合数据（二进制格式）
- **`.metadata.json` 文件**: 集合元数据（索引、验证规则等）

### 如何添加数据

#### 方法 1: 使用自动备份脚本（推荐）

```bash
# 运行备份脚本
./scripts/backup-to-init-data.sh

# 选择备份 MongoDB 或两个数据库都备份
```

#### 方法 2: 手动使用 mongodump

```bash
# 备份到 initdata 目录
mongodump \
  --host=localhost \
  --port=27017 \
  --username=your_user \
  --password=your_pass \
  --authenticationDatabase=admin \
  --db=doracms3 \
  --out=./docker/mongodb/initdata

# 这会创建 ./docker/mongodb/initdata/doracms3/ 目录
# 包含所有集合的 .bson 和 .metadata.json 文件
```

### Docker 挂载配置

在 `docker-compose.yml` 中的配置：

```yaml
mongodb-init:
  volumes:
    - ./docker/mongodb/initdata:/data/initdata:ro
    - ./docker/init-mongodb.sh:/init-mongodb.sh:ro
```

### 注意事项

1. **只执行一次**: 初始化脚本只在容器首次启动时执行
2. **重新初始化**: 需要删除数据卷后重新启动
   ```bash
   docker compose down -v
   docker compose up -d
   ```
3. **权限**: 确保文件至少有可读权限
4. **备份**: 修改前建议备份现有数据

## 相关文档

- [Docker 部署指南](../../DOCKER_DEPLOYMENT.md)
- [初始化数据配置](../../DOCKER_INIT_DATA.md)
- [数据库迁移指南](../../DATABASE_MIGRATION.md)
