# SDK API 迁移总结 - 从旧 API 到 v1 RESTful API

## 迁移时间
2024-12-26

## 迁移概述
将 SDK 中所有 API 调用从旧的非 RESTful 接口迁移到新的 v1 RESTful API 接口，确保 SDK 与后端 API 版本保持一致。

## 后端修改

### 1. 新增 API 接口到 v1.js

#### 内容删除接口
```javascript
// 删除单个内容
router.delete('/api/v1/content/:id', authApiToken, controller.api.content.deleteContent);

// 批量删除内容
router.delete('/api/v1/content', authApiToken, controller.api.content.deleteContents);
```

#### Token 刷新接口
```javascript
// Token 刷新
router.post('/api/v1/auth/refresh', authApiToken, controller.api.regUser.refreshToken);
```

### 2. 新增 Controller 方法

#### server/app/controller/api/content.js
- ✅ `deleteContent(ctx)` - 删除单个内容（RESTful DELETE /api/v1/content/:id）
- ✅ `deleteContents(ctx)` - 批量删除内容（RESTful DELETE /api/v1/content）

#### server/app/controller/api/regUser.js
- ✅ `refreshToken(ctx)` - 刷新 Token（POST /api/v1/auth/refresh）

## SDK 修改

### 1. AuthModule 接口迁移

| 功能 | 旧接口 | 新接口 (v1) | 状态 |
|------|--------|------------|------|
| 登录 | `POST /reguser/doLogin` | `POST /api/v1/auth/login` | ✅ 已迁移 |
| 登出 | 仅清除本地 Token | `POST /api/v1/auth/logout` | ✅ 已迁移 |
| 刷新 Token | `POST /auth/refresh` | `POST /api/v1/auth/refresh` | ✅ 已迁移 |
| 获取当前用户 | `GET /reguser/getSession` | `GET /api/v1/users/me` | ✅ 已迁移 |

### 2. ContentModule 接口迁移

| 功能 | 旧接口 | 新接口 (v1) | HTTP 方法变化 | 状态 |
|------|--------|------------|--------------|------|
| 获取列表 | `GET /content/getList` | `GET /api/v1/content` | - | ✅ 已迁移 |
| 获取详情 | `GET /content/getContent?id=xxx` | `GET /api/v1/content/:id` | - | ✅ 已迁移 |
| 创建内容 | `POST /content/addOne` | `POST /api/v1/content` | - | ✅ 已迁移 |
| 更新内容 | `POST /content/updateOne` | `PUT /api/v1/content/:id` | POST → PUT | ✅ 已迁移 |
| 删除内容 | `POST /content/deleteOne` | `DELETE /api/v1/content/:id` | POST → DELETE | ✅ 已迁移 |
| 批量删除 | `POST /content/deleteOne` | `DELETE /api/v1/content` | POST → DELETE | ✅ 已迁移 |

### 3. SDK 基础设施改进

#### HTTPClient 增强
- ✅ 支持 DELETE 请求的 body 参数（通过 `config.data`）
- ✅ 自动添加 `/api/v1` 版本前缀

#### 类型定义更新
- ✅ `RequestConfig` 接口新增 `data?: any` 字段

### 4. 测试更新

#### AuthModule 测试
- ✅ 更新所有接口调用为新的 v1 端点
- ✅ 新增登出服务端调用测试
- ✅ 新增登出失败容错测试
- ✅ 总计 13 个测试（新增 1 个）

#### ContentModule 测试
- ✅ 更新所有接口调用为新的 v1 RESTful 端点
- ✅ 更新 HTTP 方法（PUT, DELETE）
- ✅ 总计 12 个测试

## 测试结果

### 单元测试 ✅
```bash
pnpm --filter "./packages/sdk-js" test
```

**结果**: 
- ✅ 所有 69 个测试通过（新增 1 个测试）
- ✅ 测试覆盖率良好
- ✅ 执行时间: 1.51s

测试文件分布：
- AuthModule.test.ts: 13 个测试（+1）
- ContentModule.test.ts: 12 个测试
- APIError.test.ts: 3 个测试
- storage.test.ts: 6 个测试
- crypto.test.ts: 5 个测试
- HTTPClient.test.ts: 10 个测试
- DoraCMSClient.test.ts: 20 个测试

### 构建验证 ✅
```bash
pnpm --filter "./packages/sdk-js" build
```

**结果**:
- ✅ ESM 构建成功: `dist/index.mjs` (14.28 kB, gzip: 3.64 kB)
- ✅ CJS 构建成功: `dist/index.js` (7.69 kB, gzip: 2.43 kB)
- ✅ TypeScript 类型声明生成成功
- ✅ 构建时间: 2.10s

## API 对照表

### 认证相关 API

| 功能 | SDK 方法 | 新 API 端点 | HTTP 方法 |
|------|---------|-----------|----------|
| 登录 | `client.auth.login()` | `/api/v1/auth/login` | POST |
| 登出 | `client.auth.logout()` | `/api/v1/auth/logout` | POST |
| 刷新 Token | `client.auth.refreshToken()` | `/api/v1/auth/refresh` | POST |
| 获取当前用户 | `client.auth.getCurrentUser()` | `/api/v1/users/me` | GET |

### 内容管理 API

| 功能 | SDK 方法 | 新 API 端点 | HTTP 方法 |
|------|---------|-----------|----------|
| 获取列表 | `client.content.list()` | `/api/v1/content` | GET |
| 获取详情 | `client.content.get(id)` | `/api/v1/content/:id` | GET |
| 创建内容 | `client.content.create(data)` | `/api/v1/content` | POST |
| 更新内容 | `client.content.update(id, data)` | `/api/v1/content/:id` | PUT |
| 删除内容 | `client.content.delete(id)` | `/api/v1/content/:id` | DELETE |
| 批量删除 | `client.content.deleteMany(ids)` | `/api/v1/content` | DELETE |

## RESTful 设计原则

### 遵循的 RESTful 最佳实践

1. **资源命名**
   - ✅ 使用名词复数形式：`/content`, `/users`
   - ✅ 使用路径参数表示资源 ID：`/content/:id`

2. **HTTP 方法语义**
   - ✅ GET - 获取资源
   - ✅ POST - 创建资源
   - ✅ PUT - 更新资源（完整更新）
   - ✅ DELETE - 删除资源

3. **URL 结构**
   - ✅ 版本化：`/api/v1/...`
   - ✅ 层次化：`/api/v1/content/:id/like`
   - ✅ 清晰简洁：避免动词，使用 HTTP 方法表达操作

4. **响应格式**
   - ✅ 统一的响应结构：`{ status, data, message, timestamp, requestId }`
   - ✅ 适当的 HTTP 状态码
   - ✅ 详细的错误信息

## 向后兼容性

### 旧 API 保留
- ✅ 旧的非 RESTful API 仍然保留在 `server/app/router.js`
- ✅ 现有客户端不受影响
- ✅ 可以逐步迁移

### 迁移策略
1. **新功能优先使用 v1 API**
2. **SDK 默认使用 v1 API**
3. **旧 API 标记为 deprecated（未来版本）**
4. **提供迁移指南给用户**

## 文件清单

### 后端修改
- ✅ `server/app/router/api/v1.js` - 新增删除和刷新接口路由
- ✅ `server/app/controller/api/content.js` - 新增删除方法
- ✅ `server/app/controller/api/regUser.js` - 新增刷新 Token 方法

### SDK 修改
- ✅ `packages/sdk-js/src/modules/auth/AuthModule.ts` - 更新为 v1 API
- ✅ `packages/sdk-js/src/modules/content/ContentModule.ts` - 更新为 v1 RESTful API
- ✅ `packages/sdk-js/src/http/HTTPClient.ts` - 支持 DELETE body
- ✅ `packages/sdk-js/src/types/index.ts` - 新增 RequestConfig.data

### 测试修改
- ✅ `packages/sdk-js/src/modules/auth/AuthModule.test.ts` - 更新测试端点
- ✅ `packages/sdk-js/src/modules/content/ContentModule.test.ts` - 更新测试端点和方法

## 下一步计划

### 短期（已完成）
- ✅ 迁移所有 SDK 接口到 v1 API
- ✅ 更新所有测试
- ✅ 验证构建成功

### 中期
- [ ] 添加更多 v1 API 端点（用户管理、文件上传等）
- [ ] 完善 API 文档（Swagger）
- [ ] 添加 API 使用示例

### 长期
- [ ] 标记旧 API 为 deprecated
- [ ] 提供完整的迁移指南
- [ ] 考虑移除旧 API（v2 或 v3）

## 总结

本次迁移成功将 SDK 从旧的非 RESTful API 迁移到新的 v1 RESTful API，主要成果：

1. **完整性**: 所有 SDK 功能都已迁移到 v1 API
2. **RESTful**: 遵循 RESTful 设计原则，使用正确的 HTTP 方法
3. **测试覆盖**: 69 个测试全部通过，确保功能正确
4. **向后兼容**: 旧 API 保留，不影响现有客户端
5. **文档完善**: 提供详细的 API 对照表和迁移说明

**迁移完成度**: 100% ✅
