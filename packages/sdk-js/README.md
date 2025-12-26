# @doracms/sdk

Official JavaScript/TypeScript SDK for DoraCMS.

## 特性

- 🎯 **完整的 TypeScript 支持** - 提供完整的类型定义和智能提示
- 🔐 **多种认证方式** - 支持 JWT 和 API Key 认证
- 🔄 **自动 Token 管理** - 自动刷新过期的 Token
- 🛡️ **统一错误处理** - 统一的错误格式和错误处理机制
- 🔁 **自动重试** - 可配置的请求重试机制
- 📦 **轻量级** - 最小化依赖，打包体积小
- 🌐 **跨平台** - 支持浏览器和 Node.js 环境

## 安装

```bash
# 使用 npm
npm install @doracms/sdk

# 使用 yarn
yarn add @doracms/sdk

# 使用 pnpm
pnpm add @doracms/sdk
```

## 快速开始

### 使用 JWT 认证

```typescript
import { DoraCMSClient } from '@doracms/sdk';

// 创建客户端实例
const client = new DoraCMSClient({
  apiUrl: 'https://api.example.com',
  version: 'v1',
});

// 登录获取 Token
await client.auth.login({
  username: 'your-username',
  password: 'your-password',
});

// 现在可以调用需要认证的 API
const content = await client.content.list();
```

### 使用 API Key 认证

```typescript
import { DoraCMSClient } from '@doracms/sdk';

// 创建客户端实例
const client = new DoraCMSClient({
  apiUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  version: 'v1',
});

// 直接调用 API（SDK 会自动处理签名）
const content = await client.content.list();
```

## API 文档

### 客户端配置

```typescript
interface SDKConfig {
  /** API 基础 URL */
  apiUrl: string;
  /** API 密钥（用于 API Key 认证） */
  apiKey?: string;
  /** API 密钥 Secret（用于签名） */
  apiSecret?: string;
  /** JWT Token（用于 JWT 认证） */
  token?: string;
  /** API 版本 */
  version?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 是否自动刷新 Token */
  autoRefreshToken?: boolean;
  /** Token 存储方式 */
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory';
}
```

### 认证模块

```typescript
// 登录
await client.auth.login({ username, password });

// 登出
await client.auth.logout();

// 刷新 Token
await client.auth.refreshToken();

// 获取当前用户信息
const user = await client.auth.getCurrentUser();
```

### 内容管理模块

```typescript
// 获取内容列表
const contents = await client.content.list({
  page: 1,
  pageSize: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

// 获取单个内容
const content = await client.content.get('content-id');

// 创建内容
const newContent = await client.content.create({
  title: '标题',
  content: '内容',
});

// 更新内容
await client.content.update('content-id', {
  title: '新标题',
});

// 删除内容
await client.content.delete('content-id');
```

### 错误处理

```typescript
import { APIError } from '@doracms/sdk';

try {
  await client.content.get('invalid-id');
} catch (error) {
  if (error instanceof APIError) {
    console.error('API 错误:', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      requestId: error.requestId,
    });
  } else {
    console.error('未知错误:', error);
  }
}
```

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 许可证

MIT

## 相关链接

- [DoraCMS 主仓库](https://github.com/doramart/DoraCMS)
- [API 文档](https://github.com/doramart/DoraCMS/tree/main/docs)
- [问题反馈](https://github.com/doramart/DoraCMS/issues)
