# SDK 开发指南

## 项目结构

```
packages/sdk-js/
├── src/                    # 源代码
│   ├── client/            # 客户端核心类（待实现）
│   ├── modules/           # 功能模块（待实现）
│   │   ├── auth/         # 认证模块
│   │   └── content/      # 内容管理模块
│   ├── http/             # HTTP 客户端（待实现）
│   ├── errors/           # 错误类
│   │   ├── APIError.ts
│   │   └── index.ts
│   ├── types/            # 类型定义
│   │   └── index.ts
│   ├── utils/            # 工具函数
│   │   ├── crypto.ts     # 加密和签名
│   │   ├── storage.ts    # Token 存储
│   │   └── index.ts
│   └── index.ts          # 主入口
├── examples/              # 使用示例
│   ├── basic-usage.ts
│   ├── api-key-auth.ts
│   └── README.md
├── dist/                  # 构建输出（自动生成）
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.js
├── .prettierrc
└── README.md

```

## 已完成的工作

### ✅ Task 4.1: 创建 SDK 项目结构

1. **项目配置**
   - ✅ `package.json` - 包配置和依赖
   - ✅ `tsconfig.json` - TypeScript 配置
   - ✅ `vite.config.ts` - 构建配置
   - ✅ `.eslintrc.js` - ESLint 配置
   - ✅ `.prettierrc` - Prettier 配置
   - ✅ `.gitignore` - Git 忽略文件

2. **类型定义** (`src/types/`)
   - ✅ `SDKConfig` - SDK 配置接口
   - ✅ `APIResponse` - API 响应格式
   - ✅ `APIErrorResponse` - 错误响应格式
   - ✅ `PaginationParams` - 分页参数
   - ✅ `PaginatedResponse` - 分页响应
   - ✅ `RequestConfig` - 请求配置

3. **错误处理** (`src/errors/`)
   - ✅ `APIError` - 统一的 API 错误类
   - ✅ `fromResponse()` - 从响应创建错误
   - ✅ `toJSON()` - 错误序列化
   - ✅ 单元测试

4. **工具函数** (`src/utils/`)
   - ✅ `generateSignature()` - 生成 API Key 签名
   - ✅ `generateNonce()` - 生成随机字符串
   - ✅ `TokenStorage` - Token 存储接口
   - ✅ `MemoryStorage` - 内存存储实现
   - ✅ `LocalStorageImpl` - LocalStorage 实现
   - ✅ `SessionStorageImpl` - SessionStorage 实现
   - ✅ 单元测试

5. **文档**
   - ✅ `README.md` - 主文档
   - ✅ `DEVELOPMENT.md` - 开发指南（本文档）
   - ✅ `examples/` - 使用示例

## 下一步工作

### 🔄 Task 4.2: 实现 SDK 核心类

需要实现：
1. `HTTPClient` - HTTP 客户端封装
   - 基于 axios
   - 请求/响应拦截器
   - 自动添加认证信息
   - 错误处理和转换
   - 自动重试机制

2. `DoraCMSClient` - 主客户端类
   - 配置管理
   - 模块初始化
   - 认证状态管理

### 🔄 Task 4.3: 实现认证模块

需要实现：
1. `AuthModule` - 认证模块
   - `login()` - 登录
   - `logout()` - 登出
   - `refreshToken()` - 刷新 Token
   - `getCurrentUser()` - 获取当前用户
   - Token 自动管理

### 🔄 Task 4.5: 实现内容管理模块

需要实现：
1. `ContentModule` - 内容管理模块
   - `list()` - 获取列表
   - `get()` - 获取详情
   - `create()` - 创建
   - `update()` - 更新
   - `delete()` - 删除

### 🔄 Task 4.6: 实现统一错误处理

需要增强：
1. 错误转换和包装
2. 自动重试机制
3. 错误日志记录

### 🔄 Task 4.8: 生成 TypeScript 类型定义

需要实现：
1. 从 OpenAPI 规范生成类型
2. 导出所有公共接口
3. 配置类型声明文件

### 🔄 Task 4.9: 编写 SDK 文档和示例

需要完善：
1. API 文档
2. 更多使用示例
3. 快速开始指南

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 测试策略

### 单元测试
- 测试工具函数（crypto, storage）
- 测试错误类
- 测试类型转换

### 集成测试（待实现）
- 测试 HTTP 客户端
- 测试认证流程
- 测试 API 调用

### 端到端测试（可选）
- 测试完整的使用场景
- 需要运行真实的 DoraCMS 服务器

## 代码规范

### TypeScript
- 使用严格模式
- 为所有公共 API 提供类型定义
- 避免使用 `any`，使用 `unknown` 代替

### 命名规范
- 类名：PascalCase（如 `DoraCMSClient`）
- 接口名：PascalCase（如 `SDKConfig`）
- 函数名：camelCase（如 `generateSignature`）
- 常量：UPPER_SNAKE_CASE（如 `DEFAULT_TIMEOUT`）

### 注释
- 为所有公共 API 添加 JSDoc 注释
- 注释应该说明"为什么"而不是"是什么"
- 复杂逻辑需要添加解释性注释

## 发布流程

1. 更新版本号（`package.json`）
2. 更新 CHANGELOG
3. 运行测试：`pnpm test`
4. 构建：`pnpm build`
5. 发布：`pnpm publish`

## 相关文档

- [主 README](./README.md)
- [使用示例](./examples/README.md)
- [Monorepo 结构](../../MONOREPO_STRUCTURE.md)
- [任务列表](../../.kiro/specs/cms-platform-foundation/tasks.md)
