# DoraCMS Packages

本目录包含可独立发布的 npm 包，作为 DoraCMS 生态系统的一部分。

## 📦 包列表

### 计划中的包

#### 1. `@doracms/sdk` - JavaScript/TypeScript SDK
**状态**: 🚧 计划中

为开发者提供便捷的 DoraCMS API 集成方式。

**功能**:
- 完整的 TypeScript 类型支持
- 认证管理（JWT + API Key）
- 内容管理 API 封装
- 自动错误处理和重试
- 请求/响应拦截器

**安装**:
```bash
npm install @doracms/sdk
# 或
pnpm add @doracms/sdk
```

**使用示例**:
```typescript
import { DoraCMSClient } from '@doracms/sdk';

const client = new DoraCMSClient({
  apiUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
});

// 获取内容列表
const contents = await client.content.list({ page: 1, pageSize: 10 });
```

---

#### 2. `@doracms/types` - 共享类型定义
**状态**: 🚧 计划中

DoraCMS 的 TypeScript 类型定义，可在服务端、客户端和 SDK 之间共享。

**功能**:
- API 请求/响应类型
- 数据模型类型
- 配置类型
- 工具类型

**安装**:
```bash
npm install @doracms/types
```

**使用示例**:
```typescript
import type { Content, User, ApiResponse } from '@doracms/types';

const content: Content = {
  id: '123',
  title: 'Hello World',
  // ...
};
```

---

#### 3. `doracms-cli` - 命令行工具
**状态**: ✅ 已发布

DoraCMS 脚手架和开发工具。

**功能**:
- 快速创建项目（`doracms create`）
- 代码生成（`doracms generate`）
- 部署工具（`doracms deploy`）
- 开发服务器（`doracms dev`）

**安装**:
```bash
npm install -g doracms-cli
```

**使用示例**:
```bash
# 创建新项目
doracms create my-app

# 生成 API 客户端代码
doracms generate api-client

# 部署到云平台
doracms deploy
```

---

#### 4. `@doracms/sdk-mobile-rn` - React Native SDK
**状态**: 🚧 计划中

针对 React Native 优化的 SDK。

**功能**:
- 基于 `@doracms/sdk` 扩展
- 网络状态检测
- 离线缓存（AsyncStorage）
- 自动重试机制
- 图片上传优化

**安装**:
```bash
npm install @doracms/sdk-mobile-rn
```

---

#### 5. `@doracms/utils` - 通用工具库
**状态**: 🚧 计划中

DoraCMS 的通用工具函数。

**功能**:
- 数据验证
- 格式化工具
- 加密/解密
- 日期处理
- URL 处理

**安装**:
```bash
npm install @doracms/utils
```

---

## 🏗️ 开发指南

### 创建新包

1. 在 `packages/` 目录下创建新文件夹：
```bash
mkdir packages/your-package-name
cd packages/your-package-name
```

2. 初始化 package.json：
```bash
pnpm init
```

3. 配置 package.json：
```json
{
  "name": "@doracms/your-package-name",
  "version": "0.0.1",
  "description": "Package description",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest"
  },
  "keywords": ["doracms"],
  "author": "DoraCMS Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/doramart/doracms",
    "directory": "packages/your-package-name"
  }
}
```

4. 创建源代码目录：
```bash
mkdir src
touch src/index.ts
```

5. 添加 TypeScript 配置：
```json
// tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### 本地开发

在包目录中运行：
```bash
pnpm dev
```

在其他包中引用（使用 workspace 协议）：
```json
{
  "dependencies": {
    "@doracms/your-package-name": "workspace:*"
  }
}
```

### 构建

构建单个包：
```bash
cd packages/your-package-name
pnpm build
```

构建所有包：
```bash
pnpm -r build
```

### 测试

测试单个包：
```bash
cd packages/your-package-name
pnpm test
```

测试所有包：
```bash
pnpm -r test
```

### 发布

1. 更新版本号：
```bash
cd packages/your-package-name
pnpm version patch  # 或 minor, major
```

2. 构建：
```bash
pnpm build
```

3. 发布到 npm：
```bash
pnpm publish --access public
```

或使用 Changesets 统一管理版本和发布：
```bash
pnpm changeset
pnpm changeset version
pnpm changeset publish
```

---

## 📚 相关文档

- [主项目 README](../README.md)
- [贡献指南](../CONTRIBUTING.md)
- [API 文档](../docs/)
- [开发指南](../docs/development.md)

---

## 🤝 贡献

欢迎贡献新的包或改进现有包！请参考 [贡献指南](../CONTRIBUTING.md)。

### 包的命名规范

- 使用 `@doracms/` 作为 scope
- 使用 kebab-case 命名
- 名称应该清晰表达包的用途

### 包的质量标准

- ✅ 完整的 TypeScript 类型定义
- ✅ 单元测试覆盖率 ≥ 80%
- ✅ 完整的 README 文档
- ✅ 使用示例
- ✅ API 文档
- ✅ 遵循项目代码规范

---

## 📄 许可证

所有包都使用 [MIT License](../LICENSE)。
