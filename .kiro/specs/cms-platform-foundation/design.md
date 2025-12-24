# Design Document

## Overview

本设计文档描述了将 EggCMS 系统改造为应用底座平台的技术方案。改造采用 Headless CMS 架构模式，通过前后端完全分离、API 标准化、多端 SDK 和开发者工具链，使平台能够支持移动端、Web 端、小程序等多种应用场景。

### 核心设计理念

1. **架构兼容优先**: 完全兼容现有 Repository/Adapter 架构，不破坏多数据库支持能力
2. **渐进式改造**: 保持向后兼容，逐步迁移现有功能，不影响现有业务
3. **锦上添花**: 在现有架构基础上增强功能，而非重构核心架构
4. **API First**: API 优先设计，所有功能通过 RESTful API 暴露
5. **多端支持**: 通过 SDK 和工具链支持多种客户端技术栈
6. **开发者友好**: 提供完整的文档、工具和模板，降低接入门槛
7. **可扩展性**: 复用现有插件系统支持功能扩展

### 改造原则

**核心原则**:
- ✅ **功能完整性优先**: 改造后所有现有功能必须正常工作
- ✅ **引入最佳实践**: 可以优化和重构代码，提升代码质量
- ✅ **架构演进**: 可以调整架构，但需保持 Repository 模式和多数据库支持
- ✅ **向后兼容**: API 变更需要版本管理，保持旧版本可用
- ✅ **渐进式改造**: 分阶段实施，每个阶段都可独立验证

**允许的调整**:
- 🔄 **代码重构**: 优化代码结构，提升可维护性
- 🔄 **性能优化**: 改进查询效率，优化缓存策略
- 🔄 **安全加固**: 增强输入验证，完善错误处理
- 🔄 **标准化**: 统一 API 响应格式，规范命名约定

**必须保持**:
- ✅ **Repository 模式**: 所有数据访问通过 Repository 层
  - ⚠️ **特别注意**: `server/app/repository` 下的代码调整需要特别慎重
  - ⚠️ Repository Factory、Adapter、Connection 等核心组件不应轻易修改
  - ⚠️ 如需调整，必须确保 MongoDB 和 MariaDB 双数据库都能正常工作
  - ⚠️ 必须通过完整的回归测试验证
- ✅ **多数据库支持**: MongoDB 和 MariaDB 双数据库能力
- ✅ **权限系统**: PermissionRegistry 和权限检查机制
- ✅ **缓存系统**: UnifiedCache 系统
- ✅ **插件系统**: 插件加载和管理机制
- ✅ **业务功能**: 所有现有业务功能正常运行

**Repository 层调整原则**:
1. **优先扩展，避免修改**: 新增 Repository 而非修改现有 Repository
2. **接口稳定**: Repository 接口不应变更，保持向后兼容
3. **双数据库验证**: 任何调整都必须在两种数据库下测试
4. **完整测试**: 必须有完整的单元测试和集成测试覆盖
5. **渐进式**: 如必须调整，采用渐进式迁移，保留旧代码直到新代码稳定

**改造后反思检查清单**:
1. ✓ 所有现有 API 端点是否仍然可访问？
2. ✓ 数据库操作是否仍然通过 Repository？
3. ✓ **MongoDB 和 MariaDB 是否都能正常工作？（重点检查）**
4. ✓ **Repository 层的接口是否保持兼容？（重点检查）**
5. ✓ 权限检查是否仍然有效？
6. ✓ 缓存是否仍然正常工作？
7. ✓ 插件是否仍然可以加载？
8. ✓ 现有单元测试是否全部通过？
9. ✓ **Repository 相关测试是否全部通过？（重点检查）**
10. ✓ 性能是否有提升或至少不降低？

### 改造范围

**Phase 1: API 标准化（可调整现有代码）**
- 🔄 统一 API 响应格式（可修改现有 Controller）
- 🔄 规范错误处理（可优化现有错误处理逻辑）
- ➕ 增加 API 版本管理
- ➕ 集成 Swagger 文档

**Phase 2: 认证系统增强（扩展现有认证）**
- 🔄 优化现有 JWT 认证逻辑（如果需要）
- ➕ 增加 API Key 认证
- ➕ 增加 OAuth 2.0 支持

**Phase 3: 开发者工具（独立于核心系统）**
- ➕ JavaScript/TypeScript SDK
- ➕ 移动端 SDK
- ➕ CLI 脚手架工具
- ➕ 代码生成器

**Phase 4: 高级功能（可选）**
- ➕ Webhook 系统
- ➕ GraphQL 支持
- ➕ 实时通信
- ➕ 插件市场

## Architecture

### 整体架构


```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端层 (Clients)                        │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│  移动端 App  │   Web 应用   │   小程序    │  纯后端服务  │  第三方  │
│ (RN/Flutter)│  (Vue/React) │ (微信/支付宝)│  (Node/Py)  │   集成   │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────┬────┘
       │             │             │             │           │
       └─────────────┴─────────────┴─────────────┴───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │      SDK 层 (SDKs)          │
                    ├─────────────────────────────┤
                    │  @doracms/sdk-js            │
                    │  @doracms/sdk-mobile        │
                    │  @doracms/sdk-miniprogram   │
                    └──────────────┬──────────────┘
                                   │
       ┌───────────────────────────┴───────────────────────────┐
       │              API 网关层 (API Gateway)                  │
       ├────────────────────────────────────────────────────────┤
       │  - 路由管理  - 版本控制  - 限流熔断  - 日志监控       │
       │  - 认证鉴权  - 参数验证  - 响应转换  - 错误处理       │
       └────────────────────────┬───────────────────────────────┘
                                │
       ┌────────────────────────┴───────────────────────────────┐
       │              业务服务层 (Business Services)            │
       ├──────────────┬──────────────┬──────────────┬──────────┤
       │  内容服务     │  用户服务     │  文件服务     │  通知服务 │
       │ (Content)    │  (User)      │  (File)      │ (Notify) │
       └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───┘
              │              │              │              │
       ┌──────┴──────────────┴──────────────┴──────────────┴────┐
       │           数据访问层 (Repository Pattern)              │
       ├────────────────────────────────────────────────────────┤
       │  - MongoDB Adapter    - MariaDB Adapter                │
       │  - 统一接口           - 数据转换                        │
       └────────────────────────┬───────────────────────────────┘
                                │
       ┌────────────────────────┴───────────────────────────────┐
       │              数据存储层 (Data Storage)                 │
       ├──────────────┬──────────────┬──────────────┬──────────┤
       │   MongoDB    │   MariaDB    │    Redis     │   OSS    │
       └──────────────┴──────────────┴──────────────┴──────────┘
```

### 分层职责

**1. 客户端层**
- 各种终端应用（移动端、Web、小程序、后端服务）
- 通过 SDK 或直接调用 API

**2. SDK 层**
- 封装 API 调用逻辑
- 提供类型安全的接口
- 处理认证、错误、重试等通用逻辑

**3. API 网关层**
- 统一入口，路由分发
- 版本管理（v1, v2）
- 认证鉴权、限流、日志

**4. 业务服务层**
- 核心业务逻辑
- 服务间调用
- 事件发布

**5. 数据访问层**
- Repository 模式（已实现）
- 数据库适配器
- 缓存管理

**6. 数据存储层**
- 数据库（MongoDB/MariaDB）
- 缓存（Redis）
- 文件存储（OSS）


## Components and Interfaces

### 1. API Gateway 组件

**职责**: 统一 API 入口，处理路由、认证、限流等横切关注点

**架构兼容性**:
- ✅ 完全基于现有 EggJS Router 扩展，不替换核心路由
- ✅ 复用现有中间件（authAdminToken, authUserToken, authAdminPower）
- ✅ 保持现有路由配置不变（server/app/router/*.js）

**实现方式**:
```javascript
// 在现有路由基础上增加版本支持
// server/app/router/api.js
module.exports = app => {
  const { router, controller } = app;
  
  // 现有路由保持不变
  router.get('/api/content/list', controller.api.content.getContentList);
  
  // 新增版本化路由（可选）
  router.get('/api/v1/content/list', controller.api.v1.content.getContentList);
  router.get('/api/v2/content/list', controller.api.v2.content.getContentList);
};

// 版本中间件（新增）
// server/app/middleware/apiVersion.js
module.exports = () => {
  return async function apiVersion(ctx, next) {
    // 从 URL 或 Header 提取版本号
    const version = ctx.params.version || ctx.get('API-Version') || 'v1';
    ctx.apiVersion = version;
    await next();
  };
};
```

**实现要点**:
- 不修改现有路由，只增加新的版本化路由
- 版本中间件只是标记版本，不改变请求流程
- 保持现有中间件链不变

### 2. Authentication Service 组件

**职责**: 多端认证与授权管理

**架构兼容性**:
- ✅ 完全复用现有 JWT 认证（server/app/utils/authToken.js）
- ✅ 复用现有权限系统（PermissionRegistry）
- ✅ 复用现有认证中间件（authAdminToken, authUserToken）
- ✅ 只增加新的认证方式，不修改现有认证逻辑

**实现方式**:
```javascript
// 扩展现有认证工具
// server/app/utils/authToken.js（保持现有代码不变）

// 新增 API Key 认证（独立文件）
// server/app/utils/apiKeyAuth.js
class APIKeyAuth {
  constructor(app) {
    this.app = app;
    // 使用现有 Repository 模式
    this.apiKeyRepo = app.repositoryFactory.create('APIKey');
  }
  
  async verifyAPIKey(apiKey) {
    // 通过 Repository 查询，保持数据库兼容性
    const keyInfo = await this.apiKeyRepo.findOne({ key: apiKey, active: true });
    if (!keyInfo) {
      throw new Error('Invalid API Key');
    }
    return keyInfo;
  }
}

// 新增 API Key 中间件（不影响现有中间件）
// server/app/middleware/authApiKey.js
module.exports = () => {
  return async function authApiKey(ctx, next) {
    const apiKey = ctx.get('X-API-Key');
    if (apiKey) {
      const keyInfo = await ctx.app.apiKeyAuth.verifyAPIKey(apiKey);
      ctx.apiKeyInfo = keyInfo;
      ctx.userId = keyInfo.userId;
    }
    await next();
  };
};
```

**实现要点**:
- 新增认证方式作为独立模块，不修改现有认证代码
- 使用现有 Repository 模式访问数据
- 新增中间件可选配置，不影响现有路由
- 保持现有权限检查逻辑不变

### 3. SDK Core 组件

**职责**: 提供统一的 SDK 核心功能

**核心接口**:
```typescript
class DoraCMSClient {
  constructor(config: ClientConfig);
  
  // 认证
  auth: AuthModule;
  
  // 内容管理
  content: ContentModule;
  
  // 用户管理
  user: UserModule;
  
  // 文件管理
  file: FileModule;
  
  // 自定义请求
  request<T>(endpoint: string, options?: RequestOptions): Promise<T>;
}

interface ClientConfig {
  apiUrl: string;
  apiKey?: string;
  token?: string;
  version?: string;
  timeout?: number;
  retry?: RetryConfig;
}
```

**实现要点**:
- 使用 axios 作为 HTTP 客户端
- 自动处理 Token 刷新
- 统一错误处理和重试逻辑
- 支持请求/响应拦截器

### 4. CLI Tool 组件

**职责**: 命令行工具，提供脚手架和代码生成功能

**核心命令**:
```bash
# 创建项目
doracms create <project-name> [options]
  --template <template-name>  # mobile, web, backend
  --typescript                # 使用 TypeScript
  --skip-install              # 跳过依赖安装

# 生成代码
doracms generate <type> [options]
  client                      # 生成 API 客户端
  model                       # 生成数据模型
  service                     # 生成服务代码

# 部署
doracms deploy [options]
  --platform <platform>       # vercel, aws, aliyun
  --env <environment>         # dev, staging, prod
```

**实现要点**:
- 使用 Commander.js 构建 CLI
- 使用 Inquirer.js 实现交互式界面
- 模板使用 EJS 或 Handlebars
- 支持插件扩展

### 5. Code Generator 组件

**职责**: 根据 OpenAPI 规范生成客户端代码

**核心接口**:
```typescript
interface CodeGenerator {
  // 从 OpenAPI 规范生成代码
  generateFromSpec(spec: OpenAPISpec, options: GenerateOptions): Promise<GeneratedCode>;
  
  // 支持的语言
  getSupportedLanguages(): string[];
  
  // 自定义模板
  registerTemplate(language: string, template: Template): void;
}

interface GenerateOptions {
  language: string;          // typescript, dart, swift, kotlin
  outputDir: string;
  packageName?: string;
  customTemplates?: Record<string, string>;
}
```

**实现要点**:
- 使用 openapi-generator 或自研生成器
- 支持自定义模板
- 生成代码包含类型定义、API 方法、错误处理
- 支持增量生成（保留自定义代码）

### 6. Webhook Service 组件

**职责**: 事件通知和 Webhook 管理

**架构兼容性**:
- ✅ 使用现有 Repository 模式存储 Webhook 配置
- ✅ 使用现有 Redis 缓存系统作为消息队列
- ✅ 不修改现有业务逻辑，只在关键点触发事件

**实现方式**:
```javascript
// 新增 Webhook Service
// server/app/service/webhook.js
class WebhookService extends Service {
  constructor(ctx) {
    super(ctx);
    // 使用现有 Repository
    this.webhookRepo = ctx.app.repositoryFactory.create('Webhook');
    this.webhookLogRepo = ctx.app.repositoryFactory.create('WebhookLog');
  }
  
  async trigger(event, payload) {
    // 查询订阅该事件的 Webhook
    const webhooks = await this.webhookRepo.find({
      events: event,
      active: true,
    });
    
    // 使用现有 Redis 发布事件
    for (const webhook of webhooks) {
      await this.ctx.app.redis.lpush('webhook:queue', JSON.stringify({
        webhookId: webhook.id,
        event,
        payload,
      }));
    }
  }
}

// 在现有 Service 中触发 Webhook（不修改核心逻辑）
// server/app/service/content.js
async createContent(data) {
  // 现有业务逻辑保持不变
  const content = await this.contentRepo.create(data);
  
  // 新增：触发 Webhook（可选，不影响核心功能）
  try {
    await this.ctx.service.webhook.trigger('content.created', { content });
  } catch (error) {
    // 静默失败，不影响业务
    this.ctx.logger.warn('Webhook trigger failed:', error);
  }
  
  return content;
}
```

**实现要点**:
- Webhook 作为独立服务，不侵入现有业务逻辑
- 使用现有 Repository 和 Redis
- 触发点采用 try-catch 包裹，失败不影响业务
- 使用现有日志系统记录


## Data Models

### API Key Model

```typescript
interface APIKey {
  id: string;
  userId: string;
  key: string;              // 加密存储
  name: string;             // API Key 名称
  scope: string[];          // 权限范围
  rateLimit: number;        // 速率限制
  expiresAt?: Date;         // 过期时间
  lastUsedAt?: Date;        // 最后使用时间
  createdAt: Date;
  updatedAt: Date;
}
```

### Webhook Model

```typescript
interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  failureCount: number;     // 失败次数
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: object;
  response?: {
    status: number;
    body: string;
  };
  success: boolean;
  error?: string;
  createdAt: Date;
}
```

### API Version Model

```typescript
interface APIVersion {
  version: string;          // v1, v2
  status: 'active' | 'deprecated' | 'sunset';
  deprecationDate?: Date;
  sunsetDate?: Date;
  migrationGuide?: string;
  changelog: string;
}
```

### Project Template Model

```typescript
interface ProjectTemplate {
  id: string;
  name: string;
  type: 'mobile' | 'web' | 'backend';
  framework: string;        // react-native, flutter, vue, react
  description: string;
  repository: string;       // Git 仓库地址
  version: string;
  tags: string[];
  downloads: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

在定义正确性属性之前，我们需要识别和消除冗余属性：

**冗余分析**:
- 属性 1.2（API 响应格式）和属性 2.2（JSON 格式）可以合并为一个综合属性
- 属性 3.1、3.2、3.4（不同认证方式）可以合并为一个通用认证属性
- 属性 10.2、10.3（Webhook 触发和重试）可以合并为一个 Webhook 可靠性属性
- 属性 18.1、18.2（缓存和分页）是独立的性能优化，保持分离

经过反思，我们将重点关注以下核心属性：

### Core Properties

**Property 1: API 响应标准化**
*For any* API 请求，无论端点或版本，响应应该符合统一的 RESTful 格式（包含 status、data、message 字段），Content-Type 应为 application/json
**Validates: Requirements 1.2, 2.2**

**Property 2: API 版本兼容性**
*For any* 已发布的 API 版本（v1, v2），旧版本的请求应该继续返回正确的响应，不因新版本发布而中断
**Validates: Requirements 1.3, 9.2, 9.5**

**Property 3: 多端认证统一性**
*For any* 有效的认证凭证（JWT Token、API Key、OAuth Token），平台应该正确验证并授权访问，认证失败应返回标准的 401/403 错误
**Validates: Requirements 3.1, 3.2, 3.4, 3.5**

**Property 4: 权限控制一致性**
*For any* 用户和资源组合，权限检查应该基于角色和资源规则返回一致的结果，相同的请求应该得到相同的授权结果
**Validates: Requirements 3.6**

**Property 5: SDK 错误处理一致性**
*For any* API 错误响应，SDK 应该将其转换为统一的错误对象，包含错误码、消息和详细信息
**Validates: Requirements 4.4**

**Property 6: SDK Token 自动管理**
*For any* Token 过期场景，SDK 应该自动检测并刷新 Token，对开发者透明
**Validates: Requirements 4.5**

**Property 7: 移动端 SDK 重试机制**
*For any* 网络请求失败（超时、连接错误），移动端 SDK 应该根据配置的重试策略自动重试，并在最终失败时返回错误
**Validates: Requirements 5.3**

**Property 8: 代码生成器多语言支持**
*For any* 支持的目标语言（TypeScript、Dart、Swift、Kotlin），代码生成器应该能够从 OpenAPI 规范生成包含类型定义、API 方法和错误处理的完整代码
**Validates: Requirements 7.2, 7.4**

**Property 9: Webhook 可靠性**
*For any* 注册的 Webhook，当事件触发时，平台应该发送 POST 请求到回调 URL，如果失败应该自动重试（指数退避），并记录所有尝试的日志
**Validates: Requirements 10.2, 10.3**

**Property 10: Webhook 签名验证**
*For any* Webhook 请求，平台应该使用 HMAC-SHA256 生成签名，接收方应该能够验证签名的有效性
**Validates: Requirements 10.4**

**Property 11: GraphQL 查询正确性**
*For any* 有效的 GraphQL 查询，平台应该只返回查询中指定的字段，不多不少
**Validates: Requirements 11.2**

**Property 12: WebSocket 消息推送**
*For any* 已建立的 WebSocket 连接，当服务端推送消息时，客户端应该实时接收到消息
**Validates: Requirements 12.2**

**Property 13: WebSocket 重连机制**
*For any* WebSocket 连接断开，客户端应该自动尝试重连，直到成功或达到最大重试次数
**Validates: Requirements 12.3**

**Property 14: 文件上传多后端支持**
*For any* 配置的存储后端（本地、OSS、七牛云），文件上传应该成功并返回可访问的 URL
**Validates: Requirements 13.1, 13.2**

**Property 15: 私有文件访问控制**
*For any* 标记为私有的文件，未经授权的访问应该被拒绝，只有持有有效签名 URL 的请求才能访问
**Validates: Requirements 13.4**

**Property 16: 访问日志完整性**
*For any* API 请求（除了排除列表中的路径），平台应该记录包含请求路径、参数、响应时间和状态码的访问日志
**Validates: Requirements 15.1**

**Property 17: 错误日志详细性**
*For any* 系统错误（5xx 状态码），平台应该记录包含错误消息、堆栈信息和上下文的详细错误日志
**Validates: Requirements 15.2**

**Property 18: 数据迁移完整性**
*For any* 数据迁移操作（MongoDB ↔ MariaDB），迁移完成后，目标数据库应该包含与源数据库相同数量和内容的记录
**Validates: Requirements 16.4**

**Property 19: 缓存一致性**
*For any* 被缓存的 API 响应，在缓存有效期内，相同的请求应该返回缓存的数据，缓存失效后应该重新查询数据库
**Validates: Requirements 18.1**

**Property 20: 分页数据完整性**
*For any* 分页查询，所有页面的数据合并后应该等于完整数据集，不应有重复或遗漏
**Validates: Requirements 18.2**

**Property 21: CSRF 防护**
*For any* 状态改变的请求（POST、PUT、DELETE），平台应该验证 CSRF Token，无效的 Token 应该被拒绝
**Validates: Requirements 19.1**

**Property 22: 输入验证与过滤**
*For any* 用户输入，平台应该进行 XSS 和 SQL 注入过滤，恶意输入应该被清理或拒绝
**Validates: Requirements 19.2**

**Property 23: 速率限制**
*For any* API 端点，当请求频率超过配置的限制时，平台应该返回 429 状态码并拒绝请求
**Validates: Requirements 19.3**


## Error Handling

### Error Response Format

所有 API 错误响应应遵循统一格式：

```typescript
interface ErrorResponse {
  status: 'error';
  code: string;           // 错误码，如 'AUTH_FAILED', 'VALIDATION_ERROR'
  message: string;        // 用户友好的错误消息
  details?: object;       // 详细错误信息（可选）
  timestamp: string;      // ISO 8601 格式时间戳
  requestId: string;      // 请求追踪 ID
}
```

### Error Categories

**1. 认证错误 (4xx)**
- `401 UNAUTHORIZED`: Token 无效或过期
- `403 FORBIDDEN`: 权限不足
- `429 TOO_MANY_REQUESTS`: 速率限制

**2. 客户端错误 (4xx)**
- `400 BAD_REQUEST`: 请求参数错误
- `404 NOT_FOUND`: 资源不存在
- `422 UNPROCESSABLE_ENTITY`: 业务逻辑验证失败

**3. 服务端错误 (5xx)**
- `500 INTERNAL_SERVER_ERROR`: 服务器内部错误
- `502 BAD_GATEWAY`: 上游服务错误
- `503 SERVICE_UNAVAILABLE`: 服务暂时不可用

### Error Handling Strategy

**SDK 层错误处理**:
```typescript
class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number,
    public details?: object
  ) {
    super(message);
  }
}

// SDK 自动重试策略
const retryConfig = {
  maxRetries: 3,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  backoff: 'exponential',  // 指数退避
  initialDelay: 1000,      // 初始延迟 1 秒
};
```

**服务端错误处理**:
- 使用现有的 errorHandler 中间件
- 扩展错误日志记录（errorLogger 中间件）
- 集成告警通知（邮件、钉钉、企业微信）

### Graceful Degradation

**降级策略**:
1. **数据库降级**: 主库故障时切换到只读副本
2. **缓存降级**: Redis 故障时使用内存缓存
3. **功能降级**: 非核心功能故障时返回默认值或禁用功能
4. **限流降级**: 高负载时限制非核心 API 访问


## Testing Strategy

### Dual Testing Approach

本项目采用单元测试和属性测试相结合的策略：

**单元测试 (Unit Tests)**:
- 验证具体示例和边缘情况
- 测试特定的业务逻辑
- 快速反馈，易于调试

**属性测试 (Property-Based Tests)**:
- 验证通用属性在所有输入下都成立
- 通过随机生成测试数据发现边缘情况
- 提供更全面的测试覆盖

### Property-Based Testing Configuration

**测试框架选择**:
- **JavaScript/TypeScript**: fast-check
- **Dart (Flutter)**: test + faker
- **Swift (iOS)**: SwiftCheck
- **Kotlin (Android)**: KotlinTest + Kotest-property

**配置要求**:
```javascript
// 每个属性测试至少运行 100 次迭代
const propertyTestConfig = {
  numRuns: 100,
  seed: Date.now(),
  verbose: true,
};

// 测试标签格式
// Feature: cms-platform-foundation, Property 1: API 响应标准化
```

### Test Coverage Requirements

**后端测试**:
- 单元测试覆盖率 ≥ 80%
- 所有 API 端点必须有集成测试
- 所有正确性属性必须有属性测试

**SDK 测试**:
- 核心功能单元测试覆盖率 ≥ 90%
- 网络层必须有 mock 测试
- 错误处理必须有完整测试

**CLI 工具测试**:
- 所有命令必须有功能测试
- 模板生成必须有快照测试

### Testing Pyramid

```
        ┌─────────────────┐
        │   E2E Tests     │  少量，关键流程
        │   (手动/自动)    │
        ├─────────────────┤
        │ Integration     │  中等数量，API 集成
        │    Tests        │
        ├─────────────────┤
        │  Property       │  大量，验证通用属性
        │   Tests         │
        ├─────────────────┤
        │   Unit Tests    │  大量，快速反馈
        └─────────────────┘
```

### Example Property Test

```javascript
// Feature: cms-platform-foundation, Property 1: API 响应标准化
import fc from 'fast-check';

describe('Property 1: API Response Standardization', () => {
  it('should return standardized format for any API request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          endpoint: fc.constantFrom('/api/v1/content', '/api/v1/users', '/api/v2/content'),
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          params: fc.dictionary(fc.string(), fc.anything()),
        }),
        async ({ endpoint, method, params }) => {
          const response = await apiClient.request(endpoint, { method, params });
          
          // 验证响应格式
          expect(response).toHaveProperty('status');
          expect(response).toHaveProperty('data');
          expect(response).toHaveProperty('message');
          expect(response.headers['content-type']).toContain('application/json');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Continuous Integration

**CI/CD 流程**:
1. 代码提交触发 CI
2. 运行 lint 检查
3. 运行单元测试
4. 运行属性测试（100 次迭代）
5. 运行集成测试
6. 生成测试覆盖率报告
7. 构建 Docker 镜像
8. 部署到测试环境

**测试环境**:
- 开发环境：本地 + Docker Compose
- 测试环境：独立的测试集群
- 预发布环境：生产环境的镜像
- 生产环境：正式环境

