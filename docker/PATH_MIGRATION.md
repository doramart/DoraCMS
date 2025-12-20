# Docker 初始化数据路径迁移说明

## 📢 路径变更通知

为了统一管理，我们将 MongoDB 初始化数据的路径进行了调整。

### 变更内容

| 项目               | 旧路径                        | 新路径                             |
| ------------------ | ----------------------------- | ---------------------------------- |
| MongoDB 初始化数据 | `./server/initdata/doracms3/` | `./docker/mongodb/initdata/` ✨    |
| MariaDB 初始化数据 | `./docker/mariadb/init/`      | `./docker/mariadb/init/` ✅ (不变) |

### 新的目录结构

```
docker/
├── mongodb/
│   ├── initdata/          # ✨ MongoDB 初始化数据（新位置）
│   │   ├── .gitkeep
│   │   ├── users.bson
│   │   ├── users.metadata.json
│   │   └── ...
│   └── README.md
├── mariadb/
│   ├── conf.d/            # MariaDB 配置文件
│   │   └── custom.cnf
│   └── init/              # MariaDB 初始化数据
│       ├── .gitkeep
│       └── 01-init-data.sql
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
├── entrypoint.sh
├── init-mongodb.sh
├── init-mariadb.sh
└── wait-for-it.sh
```

## 🔄 如何迁移现有数据

### 如果您有旧位置的数据

如果您在 `./server/initdata/doracms3/` 目录中已经有数据：

```bash
# 选项 1: 移动数据到新位置
mv ./server/initdata/doracms3/* ./docker/mongodb/initdata/

# 选项 2: 复制数据到新位置
cp -r ./server/initdata/doracms3/* ./docker/mongodb/initdata/

# 选项 3: 创建符号链接（不推荐，会在 Git 中造成问题）
# ln -s ../../server/initdata/doracms3 ./docker/mongodb/initdata
```

### 如果您使用备份脚本

如果您使用 `scripts/backup-to-init-data.sh` 脚本：

✅ **无需任何操作**！脚本已自动更新为新路径。

### 如果您手动备份

如果您手动使用 `mongodump` 备份：

```bash
# 旧方式（不再推荐）
mongodump --out=./server/initdata

# 新方式（推荐）
mongodump --out=./docker/mongodb/initdata
```

## ✅ 验证迁移

迁移完成后，验证数据：

```bash
# 检查新位置的数据
ls -lh docker/mongodb/initdata/

# 应该看到类似以下文件：
# users.bson
# users.metadata.json
# contents.bson
# contents.metadata.json
# ...
```

## 🚀 更新 Docker Compose

已更新的文件：

- ✅ `docker-compose.yml` - MongoDB 初始化挂载路径已更新
- ✅ `scripts/backup-to-init-data.sh` - 备份脚本已更新
- ✅ `DOCKER_INIT_DATA.md` - 文档已更新

如果您已经在运行 Docker 容器：

```bash
# 1. 停止容器
docker compose down

# 2. 迁移数据到新位置（见上面的方法）

# 3. 重新启动
docker compose up -d
```

## 🗑️ 清理旧路径（可选）

迁移并验证成功后，可以清理旧路径：

```bash
# ⚠️ 警告：确保数据已迁移并验证后再删除！

# 删除旧的 initdata 目录
rm -rf ./server/initdata/doracms3/

# 或者只是重命名保留
mv ./server/initdata ./server/initdata.backup
```

## 💡 为什么要改变路径？

1. **统一管理**: 所有 Docker 相关的配置和数据都在 `docker/` 目录下
2. **清晰分离**: 将部署相关的数据与应用代码分离
3. **更好的组织**: MongoDB 和 MariaDB 的配置采用相同的目录结构
4. **易于维护**: 更容易找到和管理初始化数据

## ❓ 常见问题

### Q: 旧数据会自动迁移吗？

A: 不会自动迁移，需要手动迁移。但如果使用备份脚本，会自动备份到新位置。

### Q: 我可以同时保留两个位置的数据吗？

A: 可以，但 Docker 容器只会使用新位置（`docker/mongodb/initdata/`）的数据。

### Q: 如果不迁移会怎样？

A: 新启动的 Docker 容器将不会导入任何初始化数据。需要迁移数据到新位置。

### Q: Git 会追踪这些数据吗？

A: 建议在 `.gitignore` 中排除实际的数据文件：

```
docker/mongodb/initdata/*.bson
docker/mongodb/initdata/*.json
!docker/mongodb/initdata/.gitkeep
```

## 📚 相关文档

- [Docker 初始化数据配置指南](../DOCKER_INIT_DATA.md)
- [Docker 部署指南](../DOCKER_DEPLOYMENT.md)
- [MongoDB 配置说明](./mongodb/README.md)

---

**更新时间**: 2024年1月  
**版本**: v3.0.0
