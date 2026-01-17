# DoraCMS CLI 快速开始

## 安装

```bash
# 全局安装（发布后）
npm install -g doracms-cli
# 或
pnpm add -g doracms-cli
```

## 创建项目

### 方式 1: 交互式创建（推荐）

```bash
doracms create my-project
```

按照提示选择：
1. 项目类型（fullstack / backend-only / user-separated）
2. 数据库（MongoDB / MariaDB）
3. 包管理器（pnpm / npm / yarn）
4. 是否包含示例数据
5. 选择需要的模块

### 方式 2: 使用命令行选项

```bash
# 创建完整全栈项目
doracms create my-project \
  --template fullstack \
  --database mongodb \
  --package-manager pnpm

# 创建纯后端 API
doracms create my-api \
  --template backend-only \
  --database mongodb \
  --skip-install

# 使用默认配置快速创建
doracms create my-blog --yes
```

## 启动项目

```bash
cd my-project

# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库连接

# 2. 启动开发服务器
pnpm run dev:all      # 完整全栈项目
# 或
pnpm run dev:server   # 仅后端
# 或
pnpm run dev          # 前后端分离项目
```

## 访问应用

### 完整全栈项目
- 管理后台: http://localhost:8080
- 用户中心: http://localhost:3000
- 后端 API: http://localhost:7001

### 纯后端 API
- 后端 API: http://localhost:7001
- API 文档: http://localhost:7001/swagger-ui.html

### 前后端分离
- 用户中心: http://localhost:3000
- 后端 API: http://localhost:7001

## 模块管理

### 查看已启用的模块

```bash
# 查看配置文件
cat server/config/modules.config.js
```

### 启用/禁用模块

编辑 `server/config/modules.config.js`:

```javascript
business: {
  ads: {
    enabled: true,  // 改为 true 启用，false 禁用
    // ...
  },
}
```

重启应用使配置生效。

## 常见问题

### Q: 如何更改数据库？
A: 编辑 `.env` 文件中的数据库连接配置。

### Q: 如何添加新模块？
A: 编辑 `server/config/modules.config.js`，将对应模块的 `enabled` 设为 `true`。

### Q: 如何更新 CLI？
A: 运行 `npm update -g doracms-cli` 或 `pnpm update -g doracms-cli`。

### Q: 创建失败怎么办？
A: 检查错误信息，确保：
- 项目名称有效
- 目标目录不存在或为空
- 有足够的磁盘空间
- 网络连接正常（用于安装依赖）

## 获取帮助

```bash
# 查看所有命令
doracms --help

# 查看 create 命令帮助
doracms create --help

# 查看版本
doracms --version
```

## 文档

- 完整文档: https://docs.doracms.com
- GitHub: https://github.com/doramart/doracms
- 问题反馈: https://github.com/doramart/doracms/issues

---

**祝你使用愉快！** 🎉
