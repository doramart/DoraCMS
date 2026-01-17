# DoraCMS Monorepo 结构说明

## 📋 概述

DoraCMS 采用 monorepo 架构，使用 pnpm workspace 管理多个相关包。这种结构使得我们可以：

1. 在一个仓库中管理多个相关项目
2. 共享开发工具和配置
3. 保持代码和类型的一致性
4. 简化依赖管理和版本控制
5. 提供更好的开发体验

---

## 🏗️ 项目结构

```
doracms/
├── server/                 # 服务端（Egg.js）
│   ├── app/               # 应用代码
│   ├── config/            # 配置文件
│   ├── test/              # 测试文件
│   └── package.json       # 服务端依赖
│
├── client/                 # 客户端项目
│   ├── user-center/       # 用户中心（Vue 3）
│   └── remote-page/       # 远程页面
│
├── packages/               # 🆕 独立发布的 npm 包
│   ├── sdk-js/            # @doracms/sdk (计划中)
│   ├── types/             # @doracms/types (计划中)
│   ├── cli/               # doracms-cli (已发布)
│   ├── sdk-mobile-rn/     # @doracms/sdk-mobile-rn (计划中)
│   └── utils/             # @doracms/utils (计划中)
│
├── docs/                   # 文档
├── scripts/                # 开发脚本
├── examples/               # 示例项目（计划中）
│
├── package.json            # 根 package.json
├── pnpm-workspace.yaml     # pnpm workspace 配置
├── tsconfig.base.json      # 🆕 共享的 TypeScript 配置
└── README.md              # 主 README
```

---

## 🎯 设计原则

### 1. 关注点分离

- **server/**: 专注于服务端 API 和业务逻辑
- **client/**: 专注于前端界面和用户体验
- **packages/**: 专注于可复用的工具和 SDK

### 2. 独立发布

每个 `packages/` 下的包都可以独立发布到 npm：

```bash
# 发布单个包
cd packages/sdk-js
pnpm publish

# 或使用 Changesets 统一管理
pnpm changeset publish
```

### 3. 类型共享

通过 `@doracms/types` 包，在服务端、客户端和 SDK 之间共享类型定义：

```typescript
// 在服务端
import type { Content } from '@doracms/types';

// 在 SDK 中
import type { Content } from '@doracms/types';

// 在客户端
import type { Content } from '@doracms/types';
```

### 4. 本地开发

使用 workspace 协议引用本地包：

```json
{
  "dependencies": {
    "@doracms/sdk": "workspace:*",
    "@doracms/types": "workspace:*"
  }
}
```

---

## 🔧 开发工作流

### 安装依赖

```bash
# 安装所有包的依赖
pnpm install
```

### 开发模式

```bash
# 启动服务端
pnpm run dev:server

# 启动客户端
pnpm run dev:user-center

# 同时启动服务端和客户端
pnpm run dev:all

# 开发某个包（在包目录中）
cd packages/sdk-js
pnpm dev
```

### 构建

```bash
# 构建所有包
pnpm -r build

# 构建特定包
pnpm --filter @doracms/sdk build
```

### 测试

```bash
# 运行所有测试
pnpm -r test

# 运行特定包的测试
pnpm --filter @doracms/sdk test
```

### 代码检查

```bash
# 检查所有包
pnpm lint

# 格式化代码
pnpm format
```

---

## 📦 包管理

### 添加依赖

```bash
# 为根项目添加依赖
pnpm add -w <package>

# 为特定包添加依赖
pnpm --filter @doracms/sdk add <package>

# 添加开发依赖
pnpm --filter @doracms/sdk add -D <package>
```

### 引用本地包

```bash
# 在一个包中引用另一个本地包
pnpm --filter @doracms/sdk add @doracms/types@workspace:*
```

### 更新依赖

```bash
# 更新所有依赖
pnpm update -r

# 更新特定包的依赖
pnpm --filter @doracms/sdk update
```

---

## 🚀 发布流程

### 使用 Changesets（推荐）

1. 安装 Changesets：
```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

2. 创建 changeset：
```bash
pnpm changeset
```

3. 更新版本：
```bash
pnpm changeset version
```

4. 发布：
```bash
pnpm changeset publish
```

### 手动发布

1. 更新版本号：
```bash
cd packages/sdk-js
pnpm version patch  # 或 minor, major
```

2. 构建：
```bash
pnpm build
```

3. 发布：
```bash
pnpm publish --access public
```

---

## 🎨 包的命名规范

### Scope
所有包都使用 `@doracms/` 作为 scope。

### 命名格式
- 使用 kebab-case
- 名称应该清晰表达包的用途
- 避免使用缩写

### 示例
- ✅ `@doracms/sdk`
- ✅ `@doracms/sdk-mobile-rn`
- ✅ `doracms-cli` (已发布，不使用 scope)
- ❌ `@doracms/s` (太短)
- ❌ `@doracms/SDK` (不是 kebab-case)

---

## 📚 包的质量标准

每个包都应该满足以下标准：

### 必需项
- ✅ 完整的 `package.json`
- ✅ 清晰的 `README.md`
- ✅ TypeScript 类型定义
- ✅ 单元测试（覆盖率 ≥ 80%）
- ✅ 使用示例
- ✅ 遵循项目代码规范

### 推荐项
- 📝 API 文档
- 📝 CHANGELOG
- 📝 贡献指南
- 📝 性能测试
- 📝 集成测试

---

## 🔍 常见问题

### Q: 为什么使用 monorepo？

**A**: Monorepo 为开源项目带来诸多好处：
1. 降低贡献门槛（只需 clone 一个仓库）
2. 保证代码和类型的一致性
3. 简化依赖管理
4. 统一的 CI/CD 流程
5. 更好的 Issue 管理

### Q: 包之间如何共享代码？

**A**: 通过创建共享包（如 `@doracms/types`、`@doracms/utils`），并使用 workspace 协议引用。

### Q: 如何确保包的独立性？

**A**: 每个包都有独立的：
- `package.json`（独立的版本号和依赖）
- 构建配置
- 测试套件
- 文档

### Q: 发布时会发布整个仓库吗？

**A**: 不会。每个包独立发布，只发布 `packages/xxx` 目录下的内容。

### Q: 如何处理包之间的版本依赖？

**A**: 使用 Changesets 或 Lerna 等工具自动管理版本依赖关系。

---

## 🤝 贡献指南

### 添加新包

1. 在 `packages/` 下创建新目录
2. 初始化 `package.json`
3. 添加源代码和测试
4. 更新 `packages/README.md`
5. 提交 PR

### 修改现有包

1. Fork 仓库
2. 创建功能分支
3. 进行修改并添加测试
4. 运行 `pnpm lint` 和 `pnpm test`
5. 提交 PR

详细信息请参考 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 📖 参考资料

### 成功案例
- [Vue.js](https://github.com/vuejs/core)
- [Next.js](https://github.com/vercel/next.js)
- [Nest.js](https://github.com/nestjs/nest)
- [Strapi](https://github.com/strapi/strapi)

### 工具文档
- [pnpm workspace](https://pnpm.io/workspaces)
- [Changesets](https://github.com/changesets/changesets)
- [Turborepo](https://turbo.build/repo)

---

## 📄 许可证

本项目使用 [MIT License](./LICENSE)。
