# EggCMS - 基于 EggJS + Vue3 的现代化 CMS 系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange.svg)](https://pnpm.io/)

> 📦 **GitHub**: [doramart/DoraCMS](https://github.com/doramart/DoraCMS) | 📖 **文档**: [www.doracms.net](https://www.doracms.net) | 🌐 **English**: [README.en.md](./README.en.md)

一个基于 EggJS 3.x + Vue 3 + TypeScript 的现代化内容管理系统，采用 pnpm monorepo 架构管理。

## 🔗 在线演示

- 前台地址: [https://demo.doracms.net](https://demo.doracms.net)
- 后台地址: [https://demo.doracms.net/admin-center](https://demo.doracms.net/admin-center)
- 后台登录信息: 账号 `doracms` 密码 `Hello985`

## 📸 界面预览

### 管理后台

![管理后台](https://cdn.html-js.cn/cms/uploadfiles/images/admin-center.png)

### 用户中心

![用户中心](https://cdn.html-js.cn/cms/uploadfiles/images/user-center.png)

### 内容管理

![内容管理](https://cdn.html-js.cn/cms/uploadfiles/images/content-manage.png)

### AI 内容发布

![AI 内容发布](https://cdn.html-js.cn/cms/uploadfiles/images/ai-content.png)

### 模型管理

![模型管理](https://cdn.html-js.cn/cms/uploadfiles/images/model-manage.png)

### 首页

![首页](https://cdn.html-js.cn/cms/uploadfiles/images/home-page.png)

## 🏗️ 项目架构

本项目采用 **pnpm monorepo** 架构，包含多个相关模块：

```
doracms/
├── server/                    # EggJS 后端服务
├── client/
│   ├── user-center/          # Vue3 用户前端
│   └── admin-center/         # Vue3 + TypeScript 管理后台
├── packages/                  # 🆕 独立发布的 npm 包
│   ├── sdk-js/               # @doracms/sdk (计划中)
│   ├── types/                # @doracms/types (计划中)
│   ├── cli/                  # doracms-cli (已发布)
│   └── utils/                # @doracms/utils (计划中)
└── package.json              # 根目录配置
```

> 📚 详细的 monorepo 结构说明请参考 [MONOREPO_STRUCTURE.md](./MONOREPO_STRUCTURE.md)

## 🛠️ 技术栈

### 后端 (Server)

- **框架**: EggJS 3.x
- **数据库**: MongoDB + Mongoose / MariaDB + Sequelize（双数据库支持）
- **认证**: JWT
- **缓存**: Redis（可选）
- **文件上传**: 支持阿里云 OSS、七牛云
- **部署**: Docker + Docker Compose

### 前端 (User Center)

- **框架**: Vue 3 + Composition API
- **构建工具**: Vite 4.x
- **UI库**: Element Plus
- **状态管理**: Pinia
- **国际化**: Vue i18n

### 管理后台 (Admin Center)

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite 6.x
- **UI库**: Element Plus
- **样式**: UnoCSS + Sass
- **状态管理**: Pinia
- **图表**: Echarts、@antv/g2
- **富文本**: @wangeditor/editor

## 🌍 国际化

- 服务端启用了 `localeDetector` 中间件，自动根据 URL、Cookie 与 `Accept-Language` 选择语言，并同步到 session。
- 所有后台接口均使用统一的国际化 key（`common.*`、`template.*`、`mail.*` 等），可在 `server/config/locale` 中扩展。
- Nunjucks 过滤器与日期工具会读取当前请求的 `ctx.locale`，保持页面渲染与接口返回一致。

## 🚀 快速开始

### 环境要求

#### 本地开发

- Node.js >= 14.0.0 (推荐 18.x)
- pnpm >= 8.0.0
- MongoDB 或 MariaDB
- Redis（可选）

#### Docker 部署

- Docker >= 20.10
- Docker Compose >= 2.0

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/doramart/DoraCMS.git
cd DoraCMS

# 安装所有项目依赖
pnpm install
```

### 开发模式

```bash
# 同时启动服务端和用户前端
pnpm dev

# 启动所有项目（并行）
pnpm dev:all

# 单独启动项目
pnpm dev:server       # 启动后端服务 (端口: 7001)
pnpm dev:user-center  # 启动用户前端 (端口: 3000)
pnpm dev:admin-center # 启动管理后台 (端口: 5173)
```

### 生产构建

```bash
# 构建所有项目
pnpm build

# 单独构建
pnpm build:server
pnpm build:user-center
pnpm build:admin-center
```

## 📝 可用脚本

### 开发相关

- `pnpm dev` - 启动服务端 + 用户前端
- `pnpm dev:all` - 并行启动所有项目
- `pnpm dev:server` - 仅启动后端服务
- `pnpm dev:user-center` - 仅启动用户前端
- `pnpm dev:admin-center` - 仅启动管理后台

### 构建相关

- `pnpm build` - 构建所有项目
- `pnpm build:server` - 构建后端
- `pnpm build:user-center` - 构建用户前端
- `pnpm build:admin-center` - 构建管理后台

### 代码质量

- `pnpm lint` - 检查所有项目代码
- `pnpm lint:server` - 检查后端代码
- `pnpm lint:user-center` - 检查用户前端代码
- `pnpm lint:admin-center` - 检查管理后台代码
- `pnpm format` - 格式化所有代码

### 清理相关

- `pnpm clean` - 清理所有 node_modules
- `pnpm clean:server` - 清理后端依赖
- `pnpm clean:user-center` - 清理用户前端依赖
- `pnpm clean:admin-center` - 清理管理后台依赖

### 插件管理

- `pnpm plugin:install` - 安装服务端插件
- `pnpm plugin:build` - 构建插件
- `pnpm plugin:clean` - 清理插件

## 🌐 访问地址

### 开发模式

- **用户前端**: http://localhost:3000
- **管理后台**: http://localhost:5173
- **后端 API**: http://localhost:7001

### Docker 部署

- **应用**: http://localhost:8080
- **管理后台**: http://localhost:8080/admin
- **API**: http://localhost:8080/api

## 🐳 Docker 部署

> 📖 **完整部署文档**: [Docker 部署指南](https://www.doracms.net/deployment/docker)

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/doramart/DoraCMS.git
cd DoraCMS

# 2. 使用快速启动脚本
./docker-quickstart.sh

# 或使用 Docker Compose
docker compose up -d
```

### 数据库选择

#### 使用 MongoDB（默认）

```bash
# 启动 MongoDB 模式
docker compose up -d

# 查看日志
docker compose logs -f eggcms-app
```

#### 使用 MariaDB

```bash
# 启动 MariaDB 模式
docker compose --profile mariadb up -d

# 查看日志
docker compose logs -f eggcms-app-mariadb
```

### 可选组件

```bash
# 启用 Redis 缓存
docker compose --profile redis up -d

# 启用 Nginx 反向代理
docker compose --profile nginx up -d

# 完整堆栈 (MongoDB + Redis + Nginx)
docker compose --profile full up -d

# 完整堆栈 (MariaDB + Redis + Nginx)
docker compose --profile mariadb --profile redis --profile nginx up -d
```

### 配置环境变量

```bash
# 复制环境变量模板
cp docker.env.example .env

# 编辑配置（重要：修改安全相关配置）
vim .env
```

**⚠️ 生产环境必须修改的配置：**

- `APP_KEYS` - 应用密钥
- `SESSION_SECRET` - 会话密钥
- 数据库密码

生成随机密钥：

```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 32
```

> 💡 **提示**: 更多详细的 Docker 部署说明、数据持久化、健康检查、故障排除等内容，请查看 [完整的 Docker 部署指南](https://www.doracms.net/deployment/docker)

## 📚 更多文档

- [Docker 部署指南](https://www.doracms.net/deployment/docker) - 完整的 Docker 部署文档（推荐）
- [Docker 部署指南（本地）](./DOCKER_DEPLOYMENT.md) - 本地 Docker 部署文档
- [开发指南](./MONOREPO_GUIDE.md) - 本地开发和项目结构
- [数据库迁移指南](./DATABASE_MIGRATION.md) - MongoDB ↔ MariaDB 迁移
- [Repository 模式](./server/app/repository/README.md) - 数据库适配层文档
- [SoybeanAdmin](https://docs.soybeanjs.cn/zh/) - 管理后台基于 SoybeanAdmin 二次开发

## 🤝 贡献

欢迎提交 Pull Request 和 Issue！

## � 技术交流群

欢迎加入我们的技术交流群，与其他开发者一起讨论和学习：

<img width="450" src="http://cdn.html-js.cn/contactbywechatqq1.jpg" alt="技术交流群">

## �📄 许可证

MIT License

---

## 🔧 常见问题

### Q: 如何为特定项目添加依赖？

```bash
# 为服务端添加依赖
pnpm --filter "./server" add package-name

# 为用户前端添加依赖
pnpm --filter "./client/user-center" add package-name

# 为管理后台添加依赖
pnpm --filter "./client/admin-center" add package-name
```

### Q: 如何解决依赖冲突？

```bash
# 清理所有依赖并重新安装
pnpm clean
pnpm install
```

### Q: Node.js 版本不兼容怎么办？

admin-center 需要 Node.js >= 18.20.0，如果版本不兼容，请使用 nvm 切换版本：

```bash
nvm use 18
# 或者
nvm install 18.20.0
nvm use 18.20.0
```

## 代码规范

项目使用 ESLint 和 Prettier 进行代码规范检查和格式化。提交代码时会自动运行 lint-staged 进行检查。
