# 快速开始：创建新包

本指南将帮助您在 `packages/` 目录下快速创建一个新的 npm 包。

---

## 📦 创建新包的步骤

### 1. 创建包目录

```bash
# 在项目根目录执行
mkdir packages/your-package-name
cd packages/your-package-name
```

### 2. 初始化 package.json

```bash
pnpm init
```

然后编辑 `package.json`：

```json
{
  "name": "@doracms/your-package-name",
  "version": "0.0.1",
  "description": "Your package description",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit"
  },
  "keywords": [
    "doracms",
    "your-keywords"
  ],
  "author": "DoraCMS Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/doramart/doracms",
    "directory": "packages/your-package-name"
  },
  "bugs": {
    "url": "https://github.com/doramart/doracms/issues"
  },
  "homepage": "https://github.com/doramart/doracms/tree/main/packages/your-package-name#readme"
}
```

### 3. 安装开发依赖

```bash
# 安装 TypeScript 和构建工具
pnpm add -D typescript tsup vitest

# 如果需要 ESLint
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 4. 创建 TypeScript 配置

创建 `tsconfig.json`：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 5. 创建源代码目录

```bash
mkdir src
touch src/index.ts
```

在 `src/index.ts` 中添加代码：

```typescript
/**
 * @doracms/your-package-name
 * 
 * Your package description
 */

export function hello(name: string): string {
  return `Hello, ${name}!`;
}

export default {
  hello,
};
```

### 6. 创建测试文件

创建 `src/index.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { hello } from './index';

describe('hello', () => {
  it('should return greeting message', () => {
    expect(hello('World')).toBe('Hello, World!');
  });
});
```

### 7. 创建 README

创建 `README.md`：

```markdown
# @doracms/your-package-name

> Your package description

## Installation

\`\`\`bash
npm install @doracms/your-package-name
# or
pnpm add @doracms/your-package-name
\`\`\`

## Usage

\`\`\`typescript
import { hello } from '@doracms/your-package-name';

console.log(hello('World')); // Hello, World!
\`\`\`

## API

### `hello(name: string): string`

Returns a greeting message.

**Parameters:**
- `name` - The name to greet

**Returns:**
- A greeting message string

## License

MIT
```

### 8. 添加 .gitignore

创建 `.gitignore`：

```
node_modules
dist
coverage
*.log
.DS_Store
```

### 9. 构建和测试

```bash
# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 生成测试覆盖率报告
pnpm test:coverage
```

### 10. 在其他包中使用

在其他包的 `package.json` 中添加依赖：

```json
{
  "dependencies": {
    "@doracms/your-package-name": "workspace:*"
  }
}
```

然后在代码中使用：

```typescript
import { hello } from '@doracms/your-package-name';

console.log(hello('DoraCMS'));
```

---

## 🎨 包的最佳实践

### 1. 命名规范

- ✅ 使用 `@doracms/` scope
- ✅ 使用 kebab-case
- ✅ 名称清晰表达用途
- ❌ 避免使用缩写

### 2. 代码质量

- ✅ 使用 TypeScript
- ✅ 添加完整的类型定义
- ✅ 编写单元测试（覆盖率 ≥ 80%）
- ✅ 使用 ESLint 检查代码
- ✅ 添加代码注释

### 3. 文档

- ✅ 完整的 README
- ✅ API 文档
- ✅ 使用示例
- ✅ CHANGELOG（记录版本变更）

### 4. 发布

- ✅ 使用语义化版本（Semantic Versioning）
- ✅ 在 `files` 字段中只包含必要文件
- ✅ 提供 ESM 和 CJS 两种格式
- ✅ 包含 TypeScript 类型定义

---

## 📚 示例包结构

```
packages/your-package-name/
├── src/
│   ├── index.ts           # 主入口
│   ├── index.test.ts      # 测试文件
│   ├── types.ts           # 类型定义
│   └── utils/             # 工具函数
│       ├── helper.ts
│       └── helper.test.ts
├── dist/                  # 构建输出（git ignore）
│   ├── index.js           # CJS 格式
│   ├── index.mjs          # ESM 格式
│   └── index.d.ts         # 类型定义
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

---

## 🔧 常用命令

### 开发

```bash
# 在包目录中
pnpm dev                    # 开发模式（监听变化）
pnpm build                  # 构建
pnpm test                   # 运行测试
pnpm test:coverage          # 测试覆盖率
pnpm lint                   # 代码检查
pnpm type-check             # 类型检查
```

### 在根目录

```bash
# 为特定包安装依赖
pnpm --filter @doracms/your-package-name add <package>

# 构建特定包
pnpm --filter @doracms/your-package-name build

# 测试特定包
pnpm --filter @doracms/your-package-name test

# 构建所有包
pnpm -r build

# 测试所有包
pnpm -r test
```

---

## 🚀 发布流程

### 使用 Changesets（推荐）

1. 创建 changeset：
```bash
pnpm changeset
```

2. 更新版本：
```bash
pnpm changeset version
```

3. 发布：
```bash
pnpm changeset publish
```

### 手动发布

1. 更新版本号：
```bash
cd packages/your-package-name
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

## 💡 提示

### 引用其他本地包

```bash
# 添加依赖
pnpm --filter @doracms/your-package add @doracms/types@workspace:*
```

在代码中使用：

```typescript
import type { SomeType } from '@doracms/types';
```

### 共享配置

可以创建共享的配置包：

```
packages/
├── eslint-config/         # 共享 ESLint 配置
├── tsconfig/              # 共享 TypeScript 配置
└── prettier-config/       # 共享 Prettier 配置
```

### 测试配置

创建 `vitest.config.ts`：

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
      ],
    },
  },
});
```

---

## 🤝 需要帮助？

- 查看 [packages/README.md](./README.md) 了解更多信息
- 查看 [MONOREPO_STRUCTURE.md](../MONOREPO_STRUCTURE.md) 了解整体架构
- 查看现有包的代码作为参考
- 在 GitHub Issues 中提问

---

## 📖 参考资源

- [pnpm workspace](https://pnpm.io/workspaces)
- [tsup 文档](https://tsup.egoist.dev/)
- [Vitest 文档](https://vitest.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [npm 发布指南](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
