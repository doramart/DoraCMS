# @doracms/sdk

Official JavaScript/TypeScript SDK for DoraCMS Platform.

[![npm version](https://img.shields.io/npm/v/@doracms/sdk.svg)](https://www.npmjs.com/package/@doracms/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 特性

- 🎯 **完整的 TypeScript 支持** - 提供完整的类型定义和智能提示
- 🔐 **多种认证方式** - 支持 JWT 和 API Key 认证
- 🔄 **自动 Token 管理** - 自动刷新过期的 Token
- 🛡️ **统一错误处理** - 统一的错误格式和错误分类
- 🔁 **智能重试机制** - 可配置的自动重试，支持指数退避
- 📦 **轻量级** - 最小化依赖，打包体积小
- 🌐 **跨平台** - 支持浏览器和 Node.js 环境
- 🚀 **RESTful API** - 遵循 RESTful 设计规范

## 📦 安装

```bash
# 使用 npm
npm install @doracms/sdk

# 使用 yarn
yarn add @doracms/sdk

# 使用 pnpm
pnpm add @doracms/sdk
```

## 🚀 快速开始

### 基础使用

```typescript
import { DoraCMSClient } from '@doracms/sdk';

// 创建客户端实例
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  version: 'v1',
});

// 登录
await client.auth.login({
  username: 'admin',
  password: 'password',
});

// 获取内容列表
const contents = await client.content.list({
  page: 1,
  pageSize: 10,
});

console.log(`找到 ${contents.total} 条内容`);
```

### 使用 JWT 认证

```typescript
import { DoraCMSClient } from '@doracms/sdk';

const client = new DoraCMSClient({
  apiUrl: 'https://api.example.com',
  version: 'v1',
  token: 'your-jwt-token', // 可选：直接提供 Token
});

// 登录获取 Token
const result = await client.auth.login({
  username: 'your-username',
  password: 'your-password',
});

console.log('登录成功！Token:', result.token);

// Token 会自动保存，后续请求会自动携带
const user = await client.auth.getCurrentUser();
console.log('当前用户:', user.userName);
```

### 使用 API Key 认证

```typescript
import { DoraCMSClient } from '@doracms/sdk';

const client = new DoraCMSClient({
  apiUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  version: 'v1',
});

// SDK 会自动处理签名，无需手动管理
const contents = await client.content.list();
```

## 📖 核心功能

### 认证模块

```typescript
// 登录
const result = await client.auth.login({
  username: 'admin',
  password: 'password',
  imageCode: '1234', // 可选：图形验证码
});

// 登出
await client.auth.logout();

// 刷新 Token
const newToken = await client.auth.refreshToken();

// 获取当前用户信息
const user = await client.auth.getCurrentUser();

// 检查登录状态
const isLoggedIn = client.auth.isLoggedIn();
```

### 内容管理模块

```typescript
// 获取内容列表（支持分页和筛选）
const contents = await client.content.list({
  page: 1,
  pageSize: 20,
  categoryId: 'cat-123',
  state: '2', // 已发布
  keyword: '搜索关键词',
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

// 获取单个内容
const content = await client.content.get('content-id');

// 创建内容
const newContent = await client.content.create({
  title: '文章标题',
  discription: '文章描述',
  comments: '文章内容',
  sImg: 'https://example.com/image.jpg',
  categories: ['cat-1', 'cat-2'],
  tags: ['tag-1', 'tag-2'],
});

// 更新内容
await client.content.update('content-id', {
  title: '新标题',
  discription: '新描述',
});

// 删除单个内容
await client.content.delete('content-id');

// 批量删除内容
await client.content.deleteMany(['id1', 'id2', 'id3']);
```

### 错误处理

SDK 提供了完善的错误处理机制：

```typescript
import { DoraCMSClient, APIError, ErrorType } from '@doracms/sdk';

try {
  const content = await client.content.get('invalid-id');
} catch (error) {
  if (error instanceof APIError) {
    console.error('API 错误:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      type: error.type,
      requestId: error.requestId,
    });

    // 根据错误类型处理
    if (error.isAuthError()) {
      // 跳转到登录页
      console.log('需要重新登录');
    } else if (error.isNetworkError()) {
      // 显示网络错误提示
      console.log('网络连接失败');
    } else if (error.isServerError()) {
      // 显示服务器错误提示
      console.log('服务器错误，请稍后重试');
    }
  }
}
```

### 自动重试

SDK 支持智能的自动重试机制：

```typescript
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  version: 'v1',
  retry: {
    enabled: true,              // 启用自动重试
    maxRetries: 3,              // 最多重试 3 次
    retryDelay: 1000,           // 初始延迟 1 秒
    exponentialBackoff: true,   // 使用指数退避
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
});

// GET 请求会自动重试（如果失败）
const contents = await client.content.list();
```

重试规则：
- ✅ 只重试 GET 请求（幂等性）
- ✅ 网络错误自动重试
- ✅ 超时错误自动重试
- ✅ 服务端错误（5xx）自动重试
- ✅ 速率限制（429）自动重试
- ❌ 认证错误不重试
- ❌ 客户端错误（4xx）不重试

## ⚙️ 配置选项

### SDKConfig

```typescript
interface SDKConfig {
  /** API 基础 URL（必填） */
  apiUrl: string;
  
  /** API 密钥（用于 API Key 认证） */
  apiKey?: string;
  
  /** API 密钥 Secret（用于签名） */
  apiSecret?: string;
  
  /** JWT Token（用于 JWT 认证） */
  token?: string;
  
  /** API 版本，默认 'v1' */
  version?: string;
  
  /** 请求超时时间（毫秒），默认 30000 */
  timeout?: number;
  
  /** 是否自动刷新 Token，默认 true */
  autoRefreshToken?: boolean;
  
  /** Token 存储方式，默认 'memory' */
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory';
  
  /** 重试配置 */
  retry?: RetryConfig;
}
```

### RetryConfig

```typescript
interface RetryConfig {
  /** 是否启用自动重试，默认 true */
  enabled?: boolean;
  
  /** 最大重试次数，默认 3 */
  maxRetries?: number;
  
  /** 重试延迟（毫秒），默认 1000 */
  retryDelay?: number;
  
  /** 是否使用指数退避，默认 true */
  exponentialBackoff?: boolean;
  
  /** 可重试的 HTTP 状态码 */
  retryableStatusCodes?: number[];
}
```

## 🎯 高级用法

### 自定义 Token 存储

```typescript
// 使用 localStorage（浏览器环境）
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  tokenStorage: 'localStorage',
});

// 使用 sessionStorage（浏览器环境）
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  tokenStorage: 'sessionStorage',
});

// 使用内存存储（默认，适用于所有环境）
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  tokenStorage: 'memory',
});
```

### 错误恢复策略

```typescript
async function fetchContentWithFallback(id: string) {
  try {
    return await client.content.get(id);
  } catch (error) {
    if (error instanceof APIError) {
      if (error.isNetworkError()) {
        // 网络错误：从缓存获取
        return getCachedContent(id);
      } else if (error.statusCode === 404) {
        // 内容不存在：返回默认值
        return null;
      } else if (error.isServerError()) {
        // 服务器错误：等待后重试
        await sleep(5000);
        return await client.content.get(id);
      }
    }
    throw error;
  }
}
```

### 获取底层 HTTP 客户端

```typescript
// 用于高级用法
const httpClient = client.getHTTPClient();
const axiosInstance = httpClient.getAxiosInstance();

// 添加自定义拦截器
axiosInstance.interceptors.request.use((config) => {
  console.log('发送请求:', config.url);
  return config;
});
```

## 📚 示例代码

查看 `examples/` 目录获取更多示例：

- [basic-usage.ts](./examples/basic-usage.ts) - 基础使用示例
- [api-key-auth.ts](./examples/api-key-auth.ts) - API Key 认证示例
- [error-handling.ts](./examples/error-handling.ts) - 错误处理示例

## 🔧 开发

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 测试覆盖率
pnpm test:coverage

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 🧪 测试

SDK 包含完整的单元测试：

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

## 📝 API 参考

### 错误类型

```typescript
enum ErrorType {
  NETWORK = 'NETWORK',     // 网络错误
  AUTH = 'AUTH',           // 认证错误
  CLIENT = 'CLIENT',       // 客户端错误（4xx）
  SERVER = 'SERVER',       // 服务端错误（5xx）
  BUSINESS = 'BUSINESS',   // 业务错误
  UNKNOWN = 'UNKNOWN',     // 未知错误
}
```

### APIError 方法

```typescript
class APIError extends Error {
  // 属性
  code: string;
  statusCode: number;
  requestId: string;
  timestamp: string;
  type: ErrorType;
  details?: any;

  // 判断方法
  isNetworkError(): boolean;
  isAuthError(): boolean;
  isServerError(): boolean;
  isClientError(): boolean;
  isRetryable(): boolean;

  // 工厂方法
  static networkError(message?: string): APIError;
  static timeoutError(message?: string): APIError;
  static fromResponse(response: APIErrorResponse, statusCode: number): APIError;
}
```

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](../../CONTRIBUTING.md) 了解详情。

## 📄 许可证

MIT © [DoraCMS](https://github.com/doramart/DoraCMS)

## 🔗 相关链接

- [DoraCMS 主仓库](https://github.com/doramart/DoraCMS)
- [API 文档](../../API_V1_ENDPOINTS_REFERENCE.md)
- [问题反馈](https://github.com/doramart/DoraCMS/issues)
- [更新日志](./CHANGELOG.md)

## 💬 支持

如果你遇到问题或有任何疑问：

1. 查看 [API 文档](../../API_V1_ENDPOINTS_REFERENCE.md)
2. 查看 [示例代码](./examples/)
3. 提交 [Issue](https://github.com/doramart/DoraCMS/issues)

---

Made with ❤️ by DoraCMS Team
