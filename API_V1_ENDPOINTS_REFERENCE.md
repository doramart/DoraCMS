# DoraCMS v1 API 端点参考

## 概述
本文档列出了所有 v1 RESTful API 端点，供 SDK 开发和前端集成使用。

## 基础信息
- **Base URL**: `http://localhost:8080/api/v1`
- **认证方式**: JWT Token (Bearer) 或 API Key (签名)
- **响应格式**: JSON

## 认证相关 API

### 用户认证

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/auth/login` | POST | ❌ | 用户登录 |
| `/auth/register` | POST | ❌ | 用户注册 |
| `/auth/logout` | POST | ✅ | 用户登出 |
| `/auth/refresh` | POST | ✅ | 刷新 Token |
| `/auth/reset-password` | POST | ❌ | 重置密码 |
| `/auth/send-code` | POST | ❌ | 发送验证码 |
| `/auth/login/guest` | POST | ❌ | 游客登录 |

### 用户信息

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/users/me` | GET | ✅ | 获取当前用户信息 |
| `/users/me` | PUT | ✅ | 更新当前用户信息 |
| `/users/me/password` | POST | ✅ | 修改密码 |
| `/users/me/has-password` | GET | ✅ | 检查是否设置密码 |
| `/users/me/bindings` | POST | ✅ | 绑定邮箱/手机 |
| `/users/me/following` | GET | ✅ | 获取关注列表 |
| `/users/me/favorites` | GET | ✅ | 获取收藏列表 |
| `/users/me/confirm-email` | POST | ❌ | 发送确认邮件 |
| `/users/:userId/contents` | GET | ✅ | 获取用户内容列表 |
| `/users/:userId/following/:creatorId` | POST | ✅ | 关注创作者 |
| `/users/:userId/tags` | POST | ✅ | 添加标签 |
| `/users/check-phone` | GET | ❌ | 检查手机号是否存在 |

## 内容管理 API

### 内容 CRUD

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/content` | GET | ❌ | 获取内容列表 |
| `/content/:id` | GET | ❌ | 获取单个内容详情 |
| `/content` | POST | ✅ | 创建内容 |
| `/content/:id` | PUT | ✅ | 更新内容 |
| `/content/:id` | DELETE | ✅ | 删除单个内容 |
| `/content` | DELETE | ✅ | 批量删除内容 |

### 内容操作

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/content/:id/like` | POST | ✅ | 点赞/取消点赞内容 |
| `/content/:id/favorite` | POST | ✅ | 收藏/取消收藏内容 |
| `/content/:id/dislike` | POST | ✅ | 踩内容 |
| `/content/:id/nearby` | GET | ❌ | 获取附近内容 |
| `/content/:id/navigation` | GET | ❌ | 获取上一篇/下一篇 |
| `/content/:id/cover` | POST | ✅ | 上传封面图 |

### 内容查询

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/content/random` | GET | ❌ | 获取随机内容 |
| `/content/random/images` | GET | ❌ | 获取随机图片 |
| `/content/hot-tag-ids` | GET | ❌ | 获取热门标签ID |
| `/content/word-to-html` | POST | ❌ | Word 转 HTML |

## 分类管理 API

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/categories` | GET | ❌ | 获取分类列表 |
| `/categories/tree` | GET | ❌ | 获取分类树 |
| `/categories/:id` | GET | ❌ | 获取单个分类 |
| `/categories/:id/ancestors` | GET | ❌ | 获取分类祖先 |
| `/categories/:id/content-count` | GET | ❌ | 获取分类内容数量 |

## 标签管理 API

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/tags` | GET | ❌ | 获取标签列表 |
| `/tags` | POST | ✅ | 创建标签 |
| `/tags/hot` | GET | ❌ | 获取热门标签 |
| `/tags/search` | POST | ❌ | 搜索标签 |
| `/tags/findOrCreate` | POST | ❌ | 查找或创建标签 |

## 留言评论 API

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/messages` | GET | ❌ | 获取留言列表 |
| `/messages` | POST | ✅ | 发表留言 |
| `/messages/:id/like` | POST | ✅ | 点赞留言 |
| `/messages/:id/like` | DELETE | ✅ | 取消点赞留言 |
| `/messages/:id/dislike` | POST | ✅ | 踩留言 |
| `/messages/:id/dislike` | DELETE | ✅ | 取消踩留言 |

## 文件上传 API

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/files` | POST | ❌ | 上传文件 |
| `/files/path` | POST | ❌ | 通过路径上传文件 |
| `/upload/files` | POST | ❌ | 上传文件（别名） |
| `/upload/path` | POST | ❌ | 通过路径上传（别名） |
| `/upload/ueditor` | GET/POST | ❌ | UEditor 上传 |

## API Key 管理 API

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/user/api-keys` | GET | ✅ | 获取 API Key 列表 |
| `/user/api-keys` | POST | ✅ | 创建 API Key |
| `/user/api-keys/:id` | GET | ✅ | 获取 API Key 详情 |
| `/user/api-keys/:id` | PUT | ✅ | 更新 API Key |
| `/user/api-keys/:id` | DELETE | ✅ | 删除 API Key |
| `/user/api-keys/:id/enable` | PUT | ✅ | 启用 API Key |
| `/user/api-keys/:id/disable` | PUT | ✅ | 禁用 API Key |
| `/user/api-keys/:id/rotate` | POST | ✅ | 轮换 API Key |

## 邮件模板 API

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/mail-templates` | GET | ❌ | 获取邮件模板列表 |
| `/mail-templates/:id` | GET | ❌ | 获取邮件模板详情 |
| `/mail-templates/types` | GET | ❌ | 获取邮件模板类型 |
| `/mail/send` | POST | ❌ | 发送邮件 |

## 广告管理 API

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/ads/:id` | GET | ❌ | 获取广告详情 |

## 模板主题 API

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/template` | GET | ❌ | 获取主题列表 |
| `/template/active` | GET | ❌ | 获取当前激活主题 |
| `/template/:slug` | GET | ❌ | 获取主题详情 |
| `/template/:slug/config` | GET | ❌ | 获取主题配置 |
| `/template/:slug/stats` | GET | ❌ | 获取主题统计 |
| `/template/:id/download` | POST | ❌ | 增加下载次数 |
| `/template/:id/rate` | POST | ❌ | 评分主题 |

## 系统配置 API

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/system/config` | GET | ❌ | 获取系统配置 |

## 管理员 API

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/admin/login` | POST | ❌ | 管理员登录 |
| `/admin/init/status` | GET | ❌ | 获取初始化状态 |
| `/admin/init` | POST | ❌ | 初始化超级管理员 |

## 请求参数说明

### 内容列表查询参数

```typescript
{
  current?: number;        // 当前页码，默认 1
  pageSize?: number;       // 每页数量，默认 20
  categoryId?: string;     // 分类 ID
  tagId?: string;          // 标签 ID
  state?: string;          // 状态：0-草稿，1-待审核，2-已发布
  searchkey?: string;      // 搜索关键词
  authorId?: string;       // 作者 ID
  sortBy?: string;         // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序方向
}
```

### 内容创建/更新数据

```typescript
{
  title: string;           // 标题（必填）
  stitle?: string;         // 副标题
  discription: string;     // 描述（必填）
  comments: string;        // 内容（必填）
  sImg: string;            // 封面图（必填）
  categories: string[];    // 分类 ID 数组（必填）
  tags: string[];          // 标签 ID 数组（必填）
  state?: string;          // 状态
  draft?: string;          // 是否草稿
}
```

### 批量删除请求体

```typescript
{
  ids: string[];           // 内容 ID 数组
}
```

## 响应格式

### 成功响应

```json
{
  "status": "success",
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2024-12-26T15:00:00Z",
  "requestId": "req-123456"
}
```

### 错误响应

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "错误描述",
  "timestamp": "2024-12-26T15:00:00Z",
  "requestId": "req-123456",
  "details": { ... }
}
```

### 分页响应

```json
{
  "status": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  },
  "timestamp": "2024-12-26T15:00:00Z",
  "requestId": "req-123456"
}
```

## 认证说明

### JWT Token 认证

在请求头中添加：
```
Authorization: Bearer <token>
```

### API Key 认证

在请求头中添加：
```
X-API-Key: <api_key>
X-Timestamp: <timestamp>
X-Signature: <signature>
```

签名生成方法：
```javascript
const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(`${apiKey}${timestamp}${method}${path}${body}`)
  .digest('hex');
```

## SDK 使用示例

### 认证

```typescript
import { DoraCMSClient } from '@doracms/sdk';

const client = new DoraCMSClient({
  apiUrl: 'http://localhost:8080',
  version: 'v1',
});

// 登录
const result = await client.auth.login({
  username: 'admin',
  password: 'password',
});

// 获取当前用户
const user = await client.auth.getCurrentUser();

// 刷新 Token
await client.auth.refreshToken();

// 登出
await client.auth.logout();
```

### 内容管理

```typescript
// 获取内容列表
const contents = await client.content.list({
  page: 1,
  pageSize: 10,
  state: '2',
});

// 获取单个内容
const content = await client.content.get('content-id');

// 创建内容
const newContent = await client.content.create({
  title: '文章标题',
  discription: '文章描述',
  comments: '文章内容',
  sImg: 'https://example.com/image.jpg',
  categories: ['cat-1'],
  tags: ['tag-1'],
});

// 更新内容
await client.content.update('content-id', {
  title: '新标题',
});

// 删除内容
await client.content.delete('content-id');

// 批量删除
await client.content.deleteMany(['id1', 'id2', 'id3']);
```

## 注意事项

1. **认证要求**: 标记为 ✅ 的端点需要认证
2. **版本前缀**: 所有端点都需要 `/api/v1` 前缀
3. **内容类型**: 请求和响应都使用 `application/json`
4. **错误处理**: 始终检查响应的 `status` 字段
5. **分页**: 列表接口支持分页，注意 `current` 和 `pageSize` 参数
6. **RESTful**: 遵循 RESTful 设计原则，使用正确的 HTTP 方法

## 更新日志

### 2024-12-26
- ✅ 新增内容删除接口（单个和批量）
- ✅ 新增 Token 刷新接口
- ✅ 所有接口迁移到 v1 RESTful API
- ✅ SDK 完全支持 v1 API
