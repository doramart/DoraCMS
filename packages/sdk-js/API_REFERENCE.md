# API 参考文档

完整的 DoraCMS SDK API 参考。

## 目录

- [DoraCMSClient](#doracmsclient)
- [AuthModule](#authmodule)
- [ContentModule](#contentmodule)
- [APIError](#apierror)
- [类型定义](#类型定义)

---

## DoraCMSClient

主客户端类，用于创建 SDK 实例。

### 构造函数

```typescript
new DoraCMSClient(config: SDKConfig)
```

#### 参数

- `config` - SDK 配置对象

#### 示例

```typescript
const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  version: 'v1',
  timeout: 30000,
  retry: {
    enabled: true,
    maxRetries: 3,
  },
});
```

### 属性

#### `auth: AuthModule`

认证模块实例。

```typescript
await client.auth.login({ username, password });
```

#### `content: ContentModule`

内容管理模块实例。

```typescript
const contents = await client.content.list();
```

### 方法

#### `getToken(): string | null`

获取当前 Token。

**返回值**: Token 字符串或 null

```typescript
const token = client.getToken();
```

#### `setToken(token: string): void`

设置 Token。

**参数**:
- `token` - Token 字符串

```typescript
client.setToken('your-token');
```

#### `removeToken(): void`

移除 Token。

```typescript
client.removeToken();
```

#### `isAuthenticated(): boolean`

检查是否已认证。

**返回值**: 是否已认证

```typescript
if (client.isAuthenticated()) {
  console.log('已登录');
}
```

#### `getAuthType(): 'apiKey' | 'jwt' | 'none'`

获取认证类型。

**返回值**: 认证类型

```typescript
const authType = client.getAuthType();
```

#### `getHTTPClient(): HTTPClient`

获取底层 HTTP 客户端（高级用法）。

**返回值**: HTTPClient 实例

```typescript
const httpClient = client.getHTTPClient();
```

#### `getConfig(): Readonly<SDKConfig>`

获取配置对象。

**返回值**: 只读配置对象

```typescript
const config = client.getConfig();
```

#### `updateConfig(config: Partial<SDKConfig>): void`

更新配置。

**参数**:
- `config` - 部分配置对象

```typescript
client.updateConfig({
  timeout: 60000,
});
```

---

## AuthModule

认证模块，提供登录、登出、Token 管理等功能。

### 方法

#### `login(credentials: LoginCredentials): Promise<LoginResponse>`

用户登录。

**参数**:
- `credentials.username` - 用户名
- `credentials.password` - 密码
- `credentials.imageCode?` - 图形验证码（可选）

**返回值**: 登录响应，包含用户信息和 Token

**示例**:

```typescript
const result = await client.auth.login({
  username: 'admin',
  password: 'password',
  imageCode: '1234',
});

console.log('Token:', result.token);
console.log('用户:', result.userName);
```

#### `logout(): Promise<void>`

用户登出。

**示例**:

```typescript
await client.auth.logout();
```

#### `refreshToken(): Promise<RefreshTokenResponse>`

刷新 Token。

**返回值**: 新的 Token 信息

**示例**:

```typescript
const result = await client.auth.refreshToken();
console.log('新 Token:', result.token);
```

#### `getCurrentUser(): Promise<CurrentUser>`

获取当前登录用户信息。

**返回值**: 当前用户信息

**示例**:

```typescript
const user = await client.auth.getCurrentUser();
console.log('用户名:', user.userName);
console.log('邮箱:', user.email);
```

#### `isLoggedIn(): boolean`

检查是否已登录。

**返回值**: 是否已登录

**示例**:

```typescript
if (client.auth.isLoggedIn()) {
  console.log('已登录');
}
```

#### `getToken(): string | null`

获取当前 Token。

**返回值**: Token 字符串或 null

**示例**:

```typescript
const token = client.auth.getToken();
```

---

## ContentModule

内容管理模块，提供内容的 CRUD 操作。

### 方法

#### `list(params?: ContentQueryParams): Promise<ContentListResponse>`

获取内容列表。

**参数**:
- `params.page?` - 页码，默认 1
- `params.pageSize?` - 每页数量，默认 20
- `params.categoryId?` - 分类 ID
- `params.tagId?` - 标签 ID
- `params.state?` - 状态（0-草稿，1-待审核，2-已发布）
- `params.keyword?` - 搜索关键词
- `params.authorId?` - 作者 ID
- `params.sortBy?` - 排序字段
- `params.sortOrder?` - 排序方向（asc/desc）

**返回值**: 分页的内容列表

**示例**:

```typescript
const contents = await client.content.list({
  page: 1,
  pageSize: 10,
  categoryId: 'cat-123',
  state: '2',
  keyword: '搜索',
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

console.log(`总数: ${contents.total}`);
contents.items.forEach(item => {
  console.log(`- ${item.title}`);
});
```

#### `get(id: string): Promise<Content>`

获取单个内容详情。

**参数**:
- `id` - 内容 ID

**返回值**: 内容详情

**示例**:

```typescript
const content = await client.content.get('content-id');
console.log('标题:', content.title);
console.log('内容:', content.comments);
```

#### `create(data: CreateContentData): Promise<Content>`

创建内容。

**参数**:
- `data.title` - 标题（必填）
- `data.discription` - 描述（必填）
- `data.comments` - 内容（必填）
- `data.sImg` - 封面图（必填）
- `data.categories` - 分类 ID 数组（必填）
- `data.tags` - 标签 ID 数组（必填）
- `data.stitle?` - 副标题（可选）
- `data.state?` - 状态（可选）

**返回值**: 创建的内容

**示例**:

```typescript
const newContent = await client.content.create({
  title: '文章标题',
  discription: '文章描述',
  comments: '文章内容...',
  sImg: 'https://example.com/image.jpg',
  categories: ['cat-1', 'cat-2'],
  tags: ['tag-1', 'tag-2'],
});

console.log('创建成功，ID:', newContent.id);
```

#### `update(id: string, data: UpdateContentData): Promise<Content>`

更新内容。

**参数**:
- `id` - 内容 ID
- `data` - 更新数据（部分字段）

**返回值**: 更新后的内容

**示例**:

```typescript
await client.content.update('content-id', {
  title: '新标题',
  discription: '新描述',
});
```

#### `delete(id: string): Promise<void>`

删除单个内容。

**参数**:
- `id` - 内容 ID

**示例**:

```typescript
await client.content.delete('content-id');
```

#### `deleteMany(ids: string[]): Promise<void>`

批量删除内容。

**参数**:
- `ids` - 内容 ID 数组

**示例**:

```typescript
await client.content.deleteMany(['id1', 'id2', 'id3']);
```

---

## APIError

API 错误类，继承自 Error。

### 属性

#### `code: string`

错误码。

```typescript
console.log(error.code); // 'NOT_FOUND'
```

#### `statusCode: number`

HTTP 状态码。

```typescript
console.log(error.statusCode); // 404
```

#### `requestId: string`

请求 ID，用于追踪。

```typescript
console.log(error.requestId); // 'req-123456'
```

#### `timestamp: string`

错误发生时间（ISO 8601 格式）。

```typescript
console.log(error.timestamp); // '2024-12-26T15:00:00Z'
```

#### `type: ErrorType`

错误类型。

```typescript
console.log(error.type); // ErrorType.CLIENT
```

#### `details?: any`

错误详情（可选）。

```typescript
console.log(error.details); // { field: 'username' }
```

### 方法

#### `isNetworkError(): boolean`

判断是否为网络错误。

```typescript
if (error.isNetworkError()) {
  console.log('网络连接失败');
}
```

#### `isAuthError(): boolean`

判断是否为认证错误。

```typescript
if (error.isAuthError()) {
  console.log('需要重新登录');
}
```

#### `isServerError(): boolean`

判断是否为服务端错误（5xx）。

```typescript
if (error.isServerError()) {
  console.log('服务器错误');
}
```

#### `isClientError(): boolean`

判断是否为客户端错误（4xx）。

```typescript
if (error.isClientError()) {
  console.log('请求参数错误');
}
```

#### `isRetryable(): boolean`

判断是否可以重试。

```typescript
if (error.isRetryable()) {
  console.log('可以重试');
}
```

#### `toJSON(): object`

转换为 JSON 对象。

```typescript
const json = error.toJSON();
console.log(JSON.stringify(json, null, 2));
```

### 静态方法

#### `APIError.networkError(message?: string): APIError`

创建网络错误。

```typescript
throw APIError.networkError('连接失败');
```

#### `APIError.timeoutError(message?: string): APIError`

创建超时错误。

```typescript
throw APIError.timeoutError('请求超时');
```

#### `APIError.fromResponse(response: APIErrorResponse, statusCode: number): APIError`

从 API 响应创建错误。

```typescript
const error = APIError.fromResponse(response, 404);
```

---

## 类型定义

### SDKConfig

SDK 配置选项。

```typescript
interface SDKConfig {
  apiUrl: string;
  apiKey?: string;
  apiSecret?: string;
  token?: string;
  version?: string;
  timeout?: number;
  autoRefreshToken?: boolean;
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory';
  retry?: RetryConfig;
}
```

### RetryConfig

重试配置。

```typescript
interface RetryConfig {
  enabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  retryableStatusCodes?: number[];
}
```

### LoginCredentials

登录凭证。

```typescript
interface LoginCredentials {
  username: string;
  password: string;
  imageCode?: string;
}
```

### LoginResponse

登录响应。

```typescript
interface LoginResponse {
  id: string;
  userName: string;
  name?: string;
  email?: string;
  logo?: string;
  token: string;
}
```

### CurrentUser

当前用户信息。

```typescript
interface CurrentUser {
  id: string;
  userName: string;
  name?: string;
  email?: string;
  logo?: string;
  phoneNum?: string;
  group?: string;
}
```

### ContentQueryParams

内容查询参数。

```typescript
interface ContentQueryParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  tagId?: string;
  state?: string;
  keyword?: string;
  authorId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### Content

内容实体。

```typescript
interface Content {
  id: string;
  title: string;
  stitle?: string;
  discription: string;
  comments: string;
  sImg: string;
  state?: string;
  categories?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}
```

### CreateContentData

创建内容数据。

```typescript
interface CreateContentData {
  title: string;
  stitle?: string;
  discription: string;
  comments: string;
  sImg: string;
  categories: string[];
  tags: string[];
  state?: string;
  draft?: string;
}
```

### UpdateContentData

更新内容数据。

```typescript
interface UpdateContentData {
  title?: string;
  stitle?: string;
  discription?: string;
  comments?: string;
  sImg?: string;
  categories?: string[];
  tags?: string[];
  state?: string;
}
```

### ContentListResponse

内容列表响应。

```typescript
interface ContentListResponse {
  items: Content[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### ErrorType

错误类型枚举。

```typescript
enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  CLIENT = 'CLIENT',
  SERVER = 'SERVER',
  BUSINESS = 'BUSINESS',
  UNKNOWN = 'UNKNOWN',
}
```

### APIResponse

API 响应格式。

```typescript
interface APIResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  code?: string;
  timestamp: string;
  requestId: string;
}
```

---

## 更多信息

- [快速开始](./QUICK_START.md)
- [完整文档](./README.md)
- [示例代码](./examples/)
- [更新日志](./CHANGELOG.md)
