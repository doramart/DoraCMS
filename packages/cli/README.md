# doracms-cli

DoraCMS CLI - 项目脚手架和开发工具

## 安装

```bash
# 全局安装
npm install -g doracms-cli

# 或使用 pnpm
pnpm add -g doracms-cli
```

## 使用

### 创建新项目

```bash
doracms create my-project
```

交互式创建项目，CLI 会引导你完成以下选择：

1. **项目类型**
   - 完整全栈项目（推荐学习）
   - 纯后端 API（Headless CMS）
   - 前后端分离 - 用户端
   - 前后端分离 - 管理端（开发中）
   - 移动端适配（开发中）

2. **数据库**
   - MongoDB（推荐）
   - MariaDB
   - 双数据库支持（高级）

3. **包管理器**
   - pnpm（推荐）
   - npm
   - yarn

4. **后端模块**
   - 根据项目类型智能推荐
   - 自动处理模块依赖关系
   - 支持后续手动调整

## 快速开始

### 1. 创建项目

```bash
doracms create my-project
cd my-project
```

### 2. 配置环境变量

编辑 `server/.env` 文件，配置数据库和 Redis 连接信息：

```bash
# =================================
# 数据库配置
# =================================

# MongoDB 配置（如果选择 MongoDB）
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_DATABASE=doracms
MONGODB_AUTH_SOURCE=admin

# MariaDB 配置（如果选择 MariaDB）
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_DATABASE=doracms
MARIADB_USERNAME=root
MARIADB_PASSWORD=your_password

# Redis 配置（必需）
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

> **重要提示**：
> - 确保 MongoDB/MariaDB 和 Redis 服务已启动
> - 数据库会在首次启动时自动初始化
> - 可以参考 `server/env.example` 查看完整配置项

### 3. 启动项目

```bash
# 完整全栈项目
pnpm run dev:all

# 或只启动后端
pnpm run dev:server

# 或只启动前端
pnpm run dev:user-center
```

### 4. 访问应用

- 管理后台：http://localhost:8080
- 用户中心：http://localhost:3000
- 后端 API：http://localhost:7001

默认管理员账号：
- 用户名：`admin`
- 密码：`123456`

### 命令选项

```bash
# 使用默认配置快速创建
doracms create my-project --yes

# 指定项目类型
doracms create my-project --template backend-only

# 指定数据库
doracms create my-project --database mongodb

# 跳过依赖安装
doracms create my-project --skip-install

# 跳过 Git 初始化
doracms create my-project --skip-git
```

## 项目类型

### 1. 完整全栈项目 (fullstack)

包含管理后台、用户中心和完整后端 API。

**适用场景**：
- 企业内部 CMS
- 学习和二次开发
- 完整功能演示

**环境配置**：

在启动项目前，需要配置 `server/.env` 文件中的数据库和 Redis 连接信息：

```bash
# MongoDB 配置（如果选择 MongoDB）
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_DATABASE=doracms
MONGODB_AUTH_SOURCE=admin

# MariaDB 配置（如果选择 MariaDB）
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_DATABASE=doracms
MARIADB_USERNAME=root
MARIADB_PASSWORD=your_password

# Redis 配置（必需）
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**启动命令**：
```bash
pnpm run dev:all
```

**访问地址**：
- 管理后台：http://localhost:8080
- 用户中心：http://localhost:3000
- 后端 API：http://localhost:7001

### 2. 纯后端 API (backend-only)

Headless CMS，只提供 API，不包含前端。

**适用场景**：
- 移动应用后端
- 小程序后端
- 第三方集成

**环境配置**：

在启动项目前，需要配置 `server/.env` 文件中的数据库和 Redis 连接信息：

```bash
# MongoDB 配置（如果选择 MongoDB）
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_DATABASE=doracms
MONGODB_AUTH_SOURCE=admin

# MariaDB 配置（如果选择 MariaDB）
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_DATABASE=doracms
MARIADB_USERNAME=root
MARIADB_PASSWORD=your_password

# Redis 配置（必需）
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**启动命令**：
```bash
pnpm run dev:server
```

**访问地址**：
- 后端 API：http://localhost:7001
- API 文档：http://localhost:7001/swagger-ui.html

### 3. 前后端分离 - 用户端 (user-separated)

包含用户中心前端和完整后端 API。

**适用场景**：
- 博客网站
- 新闻站
- 社区论坛

**环境配置**：

在启动项目前，需要配置 `server/.env` 文件中的数据库和 Redis 连接信息：

```bash
# MongoDB 配置（如果选择 MongoDB）
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USERNAME=
MONGODB_PASSWORD=
MONGODB_DATABASE=doracms
MONGODB_AUTH_SOURCE=admin

# MariaDB 配置（如果选择 MariaDB）
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_DATABASE=doracms
MARIADB_USERNAME=root
MARIADB_PASSWORD=your_password

# Redis 配置（必需）
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

**启动命令**：
```bash
pnpm run dev
```

**访问地址**：
- 用户中心：http://localhost:3000
- 后端 API：http://localhost:7001

## 模块系统

CLI 支持灵活的模块选择，可以根据需求启用或禁用功能模块。

### 核心模块（必需）

- 用户管理
- 系统配置
- 文件上传
- API Key

### 业务模块（可选）

- **内容管理** - 文章、分类、标签管理
- **评论系统** - 用户评论和互动
- **广告管理** - 广告位和广告内容
- **模板管理** - 主题模板管理
- **邮件通知** - 邮件发送和模板
- **Webhook** - 事件通知和集成
- **菜单管理** - 导航菜单配置
- **角色权限** - 角色和权限管理
- **插件系统** - 插件管理和扩展

### 模块推荐

CLI 会根据项目类型自动推荐合适的模块组合：

| 项目类型 | 推荐模块 |
|---------|---------|
| 完整全栈 | 全部启用 |
| 纯后端 API | 内容管理 + Webhook |
| 用户端 | 内容管理 + 评论系统 + 邮件通知 |

### 后续调整

创建项目后，可以通过编辑 `server/config/modules.config.js` 来启用或禁用模块：

```javascript
module.exports = {
  business: {
    ads: {
      enabled: true,  // 改为 true 启用广告模块
      // ...
    },
  },
};
```

修改后重启应用即可生效。

## 开发

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/doramart/doracms.git
cd doracms/packages/cli

# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 测试
pnpm test
```

### 本地测试 CLI

```bash
# 方式 1: 直接运行（推荐）
node bin/doracms.js create test-project

# 方式 2: 使用 pnpm link（需要配置 PNPM_HOME）
pnpm link --global
doracms create test-project

# 查看帮助
node bin/doracms.js --help
node bin/doracms.js create --help
```

### 本地测试 CLI

```bash
# 链接到全局
pnpm link --global

# 测试命令
doracms create test-project

# 取消链接
pnpm unlink --global
```

## 许可证

MIT License

## 相关链接

- [DoraCMS 文档](https://docs.doracms.com)
- [GitHub 仓库](https://github.com/doramart/doracms)
- [问题反馈](https://github.com/doramart/doracms/issues)
