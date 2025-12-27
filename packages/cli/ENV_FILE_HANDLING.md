# 环境变量文件处理说明

## 📋 概述

DoraCMS CLI 会自动为用户生成环境配置文件，用户**不需要手动复制** `.env.example` 到 `.env`。

## 🔄 自动生成流程

### 1. CLI 自动生成的文件

当用户运行 `doracms create my-project` 时，CLI 会自动生成：

```
my-project/
├── .env              ✅ 自动生成（包含默认配置）
├── .env.example      ✅ 自动生成（作为参考）
└── server/
    └── env.example   ✅ 从模板复制
```

### 2. 生成逻辑

**文件**: `packages/cli/src/generators/env-generator.ts`

```typescript
export async function generateEnvFile(projectPath: string, projectInfo: ProjectInfo) {
  const envContent = buildEnvContent(projectInfo);

  // 1. 生成 .env.example
  await fs.writeFile(path.join(projectPath, '.env.example'), envContent);

  // 2. 自动生成 .env（如果不存在）
  const envPath = path.join(projectPath, '.env');
  if (!(await fs.pathExists(envPath))) {
    await fs.writeFile(envPath, envContent, 'utf-8');
  }
}
```

### 3. 生成的内容

`.env` 文件包含：

```bash
# 应用配置
APP_NAME=my-project
NODE_ENV=development

# 服务器配置
SERVER_PORT=7001
ADMIN_PORT=8080
USER_CENTER_PORT=3000

# 数据库配置
DB_TYPE=mongodb
MONGODB_URL=mongodb://localhost:27017/my-project

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 配置
JWT_SECRET=<随机生成的32字节密钥>
JWT_EXPIRES_IN=7d

# API 配置
API_VERSION=v1
API_KEY_SECRET=<随机生成的32字节密钥>

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## 🎯 用户需要做什么

### 1. 编辑 .env 文件

用户只需要编辑已生成的 `.env` 文件：

```bash
cd my-project
nano .env  # 或使用其他编辑器
```

### 2. 配置数据库连接

根据实际情况修改：

```bash
# MongoDB
MONGODB_URL=mongodb://localhost:27017/my-project

# 或 MariaDB
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=my-project
```

### 3. 配置 Redis（可选）

如果使用 Redis：

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## 📝 成功消息

CLI 在项目创建成功后会显示：

```
🎉 项目创建成功！

下一步:
  cd my-project
  nano .env
  # 编辑 .env 文件，配置数据库连接
  # .env 文件已自动生成，包含默认配置
  pnpm run dev:all
```

## ❌ 不需要的操作

用户**不需要**执行以下操作：

```bash
# ❌ 不需要手动复制
cp .env.example .env

# ❌ 不需要从模板复制
cp server/env.example .env
```

因为 `.env` 文件已经自动生成了！

## 🔍 验证

### 检查文件是否生成

```bash
cd my-project

# 检查 .env 文件
ls -la .env
# 应该存在 ✅

# 查看内容
cat .env
# 应该包含完整的配置 ✅
```

### 检查配置是否正确

```bash
# 检查是否包含项目名称
grep "APP_NAME=my-project" .env

# 检查是否包含随机生成的密钥
grep "JWT_SECRET=" .env
```

## 🔐 安全性

### 自动生成的密钥

CLI 会自动生成安全的随机密钥：

```typescript
function generateRandomSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
```

这确保每个项目都有唯一的密钥，提高安全性。

### .gitignore

生成的项目包含 `.gitignore`，确保 `.env` 不会被提交：

```gitignore
# 环境变量
.env
.env.local
.env.*.local
```

## 📊 不同项目类型的配置

### 完整全栈项目

```bash
SERVER_PORT=7001
ADMIN_PORT=8080
USER_CENTER_PORT=3000
```

### 纯后端项目

```bash
SERVER_PORT=7001
# 不包含前端端口配置
```

### 前后端分离 - 用户端

```bash
SERVER_PORT=7001
USER_CENTER_PORT=3000
# 不包含管理后台端口
```

## 🛠️ 高级配置

### 多环境配置

用户可以创建多个环境文件：

```bash
.env                  # 默认（开发环境）
.env.development      # 开发环境
.env.test            # 测试环境
.env.production      # 生产环境（不要提交到 Git）
```

### 使用环境变量

在代码中使用：

```javascript
// Node.js
const port = process.env.SERVER_PORT || 7001;

// 前端（Vite）
const apiUrl = import.meta.env.VITE_API_URL;
```

## 📚 相关文件

| 文件 | 说明 | 是否提交到 Git |
|------|------|---------------|
| `.env` | 实际使用的环境变量 | ❌ 否 |
| `.env.example` | 环境变量示例 | ✅ 是 |
| `.env.development` | 开发环境配置 | ✅ 是（可选）|
| `.env.production` | 生产环境配置 | ❌ 否 |
| `server/env.example` | 服务端环境变量示例 | ✅ 是 |

## ⚠️ 注意事项

### 1. 不要提交 .env 文件

```bash
# 确保 .gitignore 包含
.env
.env.local
.env.*.local
.env.production
```

### 2. 生产环境配置

生产环境应该：
- 使用环境变量注入
- 使用密钥管理服务
- 不在代码仓库中存储

### 3. 定期更新密钥

定期更新 JWT 密钥和 API 密钥，提高安全性。

## 🔄 更新环境配置

### 添加新的配置项

编辑 `packages/cli/src/generators/env-generator.ts`：

```typescript
function buildEnvContent(projectInfo: ProjectInfo): string {
  let content = `...`;
  
  // 添加新配置
  content += `
# 新功能配置
NEW_FEATURE_ENABLED=true
NEW_FEATURE_API_KEY=
`;
  
  return content;
}
```

### 更新现有项目

如果用户的项目缺少新配置：

```bash
# 1. 查看最新的 .env.example
cat .env.example

# 2. 手动添加到 .env
nano .env
```

## 📖 用户文档

在生成的项目 README.md 中应该包含：

```markdown
## 环境配置

项目已自动生成 `.env` 文件，包含默认配置。

### 配置数据库

编辑 `.env` 文件：

\`\`\`bash
# MongoDB
MONGODB_URL=mongodb://localhost:27017/your-database

# 或 MariaDB
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your-database
\`\`\`

### 启动项目

\`\`\`bash
pnpm install
pnpm run dev:all
\`\`\`
```

## ✅ 总结

- ✅ CLI 自动生成 `.env` 文件
- ✅ 包含默认配置和随机密钥
- ✅ 用户只需编辑，不需要复制
- ✅ 提高安全性和用户体验
- ✅ 成功消息已更新，说明更清晰

---

**关键点**: 用户**不需要手动复制** `.env.example` 到 `.env`，CLI 已经自动完成了这个步骤！
