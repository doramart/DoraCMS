# Git 历史敏感信息检查报告

## ⚠️ 发现的问题

Git 历史中确实包含了敏感信息，包括：
- 数据库密码：`YoooYu520~~`, `Yoooyu520~~`
- 内网 IP 地址：`192.168.31.69`
- 域名：`micoai.cn`
- 用户名：`xiaoshen888`

## 📋 包含敏感信息的提交

### 1. 脚本文件中的硬编码密码

#### scripts/backup-to-init-data.sh
- **提交**: `8a5f5d08` (NEW-PUB 分支)
- **敏感信息**:
  - `MONGODB_PASSWORD=YoooYu520~~`
  - `MARIADB_PASSWORD=Yoooyu520~~`
  - `MONGODB_HOST=192.168.31.69`
  - `MARIADB_HOST=192.168.31.69`

#### scripts/backfill-menu-permissions-mariadb.js (已删除)
- **提交**: `13540930` (master 分支)
- **敏感信息**:
  - `password: process.env.MARIADB_PASSWORD || 'Yoooyu520~~'`
  - `host: process.env.MARIADB_HOST || 'micoai.cn'`

#### scripts/backfill-menu-permissions.js (已删除)
- **提交**: `1885be00` (REMOVE-EMAIL 分支)
- **敏感信息**:
  - `password: process.env.MONGODB_PASSWORD || 'YoooYu520~~'`
  - `host: process.env.MONGODB_HOST || 'micoai.cn'`
  - `username: process.env.MONGODB_USERNAME || 'xiaoshen888'`

### 2. 环境变量相关提交

以下提交可能包含环境变量配置：
- `9a9ef885` - 完善mariadb 配置
- `59a2c70d` - 完善 Docker 部署文档和初始化脚本
- `3d5c0c44` - 环境变量调整
- `1e0dd8be` - 变量更新
- `61233e94` - 配置更新
- `31b1f8ca` - 补充部署配置

## 🔍 详细检查结果

### 包含密码的提交
```bash
# 检查结果
git log -S "YoooYu520" --oneline
# 发现多个提交包含此密码
```

### 包含 IP 地址的提交
```bash
# 检查结果
git log -S "192.168.31.69" --oneline
# 发现多个提交包含此 IP
```

### 包含域名的提交
```bash
# 检查结果
git log -S "micoai.cn" --oneline
# 发现多个提交包含此域名
```

## 🛠️ 清理方案

### 方案 1: 使用 git filter-branch（推荐用于小项目）

**⚠️ 警告**: 这会重写 Git 历史，需要强制推送。所有协作者需要重新克隆仓库。

```bash
# 1. 备份仓库
git clone --mirror . ../CMS3-backup.git

# 2. 清理密码
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/backup-to-init-data.sh" \
  --prune-empty --tag-name-filter cat -- --all

# 3. 清理所有包含敏感信息的文件
git filter-branch --force --tree-filter \
  'if [ -f scripts/backup-to-init-data.sh ]; then
     sed -i "s/YoooYu520~~/your_password/g" scripts/backup-to-init-data.sh
     sed -i "s/Yoooyu520~~/your_password/g" scripts/backup-to-init-data.sh
     sed -i "s/192.168.31.69/localhost/g" scripts/backup-to-init-data.sh
   fi' \
  --prune-empty --tag-name-filter cat -- --all

# 4. 清理引用
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 方案 2: 使用 BFG Repo-Cleaner（推荐用于大项目）

```bash
# 1. 安装 BFG
# macOS: brew install bfg
# 或下载: https://rtyley.github.io/bfg-repo-cleaner/

# 2. 备份仓库
git clone --mirror . ../CMS3-backup.git

# 3. 创建替换文件
cat > passwords.txt << EOF
YoooYu520~~==>your_mongodb_password
Yoooyu520~~==>your_mariadb_password
192.168.31.69==>localhost
micoai.cn==>localhost
xiaoshen888==>your_username
EOF

# 4. 清理敏感信息
bfg --replace-text passwords.txt

# 5. 清理和推送
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 方案 3: 创建新仓库（最简单，但会丢失历史）

如果历史记录不重要，可以：

```bash
# 1. 创建新的干净分支
git checkout --orphan clean-main

# 2. 添加所有当前文件（已清理敏感信息）
git add .
git commit -m "Initial commit - cleaned version"

# 3. 删除旧分支
git branch -D master

# 4. 重命名新分支
git branch -m master

# 5. 强制推送
git push -f origin master
```

## 📝 清理后的验证

```bash
# 验证密码是否已清理
git log --all --full-history -S "YoooYu520" --oneline
# 应该返回空结果

# 验证 IP 是否已清理
git log --all --full-history -S "192.168.31.69" --oneline
# 应该返回空结果

# 检查所有分支和标签
git log --all --oneline | grep -iE "password|secret|192.168"
```

## ⚠️ 重要注意事项

1. **备份**: 清理前必须完整备份仓库
2. **协作**: 通知所有协作者，他们需要重新克隆仓库
3. **远程仓库**: 如果已推送到远程，需要强制推送（`git push --force`）
4. **密钥轮换**: 清理 Git 历史后，建议更换所有泄露的密码和密钥
5. **GitHub**: 如果已推送到 GitHub，即使清理了本地历史，GitHub 可能仍保留备份

## 🔐 密钥轮换清单

清理 Git 历史后，必须更换：

- [ ] MongoDB 数据库密码
- [ ] MariaDB 数据库密码
- [ ] 所有使用这些密码的服务
- [ ] 如果 IP 地址是生产环境，考虑更换或加强安全措施

## 📊 风险评估

### 高风险
- ✅ 数据库密码已泄露
- ✅ 内网 IP 地址已泄露

### 中风险
- ⚠️ 域名信息（可能用于社会工程学攻击）
- ⚠️ 用户名信息

### 建议
1. **立即清理 Git 历史**（如果还未推送到公开仓库）
2. **更换所有泄露的密码**
3. **如果已推送到 GitHub，考虑使用 GitHub 的敏感信息扫描功能**
4. **设置 Git 钩子防止未来提交敏感信息**

## 🛡️ 预防措施

### 1. 添加 pre-commit 钩子

创建 `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# 检查是否包含敏感信息
if git diff --cached | grep -E "(password|secret|192\.168|YoooYu520)" > /dev/null; then
    echo "❌ 检测到敏感信息，提交被阻止！"
    exit 1
fi
```

### 2. 使用 .gitattributes

创建 `.gitattributes`:

```
scripts/backup-to-init-data.sh filter=cleanse
```

### 3. 使用环境变量

确保所有脚本都从环境变量读取敏感信息，而不是硬编码。

## 📞 下一步行动

1. [ ] 决定使用哪个清理方案
2. [ ] 备份仓库
3. [ ] 执行清理
4. [ ] 验证清理结果
5. [ ] 更换所有泄露的密码
6. [ ] 设置预防措施
7. [ ] 如果已推送到 GitHub，联系 GitHub 支持

---

**生成时间**: 2025-12-20
**检查范围**: 所有分支和标签
**状态**: ⚠️ 发现敏感信息，需要清理

