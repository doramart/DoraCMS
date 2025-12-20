# 🚀 统一异常处理架构使用指南

## 📋 架构概述

本项目实现了基于分层架构的统一异常处理机制，通过标准化的业务异常类、Repository层错误转换和全局错误中间件，实现了优雅的错误处理。

### 🔥 核心优势

- **类型安全**: 细分的异常类型，便于错误处理和用户反馈
- **层次分离**: Repository层业务异常，Controller层只处理HTTP响应
- **统一标准**: 标准化的错误码、状态码和响应格式
- **开发友好**: 开发环境提供详细的调试信息
- **运维友好**: 结构化的错误日志，便于监控和排查

## 🏗️ 架构设计

### 异常处理流程

```
业务异常发生 → Repository层转换 → Controller抛出 → 错误中间件捕获 → 标准化响应
```

### 异常类层次结构

```
BusinessError (基础业务错误)
├── ValidationError (验证错误)
│   └── UniqueConstraintError (唯一性约束错误)
├── AuthenticationError (认证错误)
├── PermissionError (权限错误)
├── NotFoundError (资源未找到)
├── DatabaseError (数据库错误)
├── BusinessRuleError (业务规则错误)
└── ...更多异常类型
```

## 🎯 使用方法

### 1. Repository层使用

```javascript
// ✅ 最优雅：使用基类提供的异常管理器
class AdminMongoRepository extends BaseMongoRepository {
  // 基类提供 this.exceptions，无需额外引入

  // 检查唯一性
  async checkUserNameUnique(userName, excludeId = null) {
    const isUnique = await UniqueChecker.checkUserNameUnique(this, userName, excludeId);
    if (!isUnique) {
      throw this.exceptions.user.nameExists(userName);
    }
    return true;
  }

  // 登录验证
  async verifyLogin(identifier, password, loginType) {
    const user = await this.findByUserName(identifier);

    if (!user) {
      throw this.exceptions.user.notFound();
    }

    if (user.status !== 'ENABLED') {
      throw this.exceptions.user.disabled();
    }

    if (!this.verifyPassword(password, user.password)) {
      throw this.exceptions.user.invalidCredentials();
    }

    return user;
  }
}
```

```javascript
// ❌ 旧方式：重复引入ErrorFactory
const { ErrorFactory } = require('../../exceptions');

async checkUserNameUnique(userName, excludeId = null) {
  // 在每个方法中重复引入
  const { ErrorFactory } = require('../../exceptions');
  throw ErrorFactory.userNameExists(userName);
}
```

### 2. Controller层使用

```javascript
// ✅ 最优雅：使用异常管理器的Controller
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');

class AdminController extends Controller {
  async addOne() {
    const { ctx, service } = this;

    // 参数验证
    ctx.validate(adminRule.addOne);

    const { userName, userPhone, userEmail } = ctx.request.body;

    // 业务验证 - 抛出异常由中间件处理
    await service.admin.checkUserNameUnique(userName);
    await service.admin.checkPhoneUnique(userPhone);
    await service.admin.checkEmailUnique(userEmail);

    // 创建用户
    const result = await service.admin.create(ctx.request.body);

    ctx.helper.renderSuccess(ctx, { data: result });
  }

  async getUserInfo() {
    const { ctx } = this;
    const userId = ctx.session.adminUserInfo?.id;

    // 使用语义化的异常方法
    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const userInfo = await ctx.service.admin.findOne({ id: userId });

    if (!userInfo) {
      throw RepositoryExceptions.user.notFound(userId);
    }

    ctx.helper.renderSuccess(ctx, { data: userInfo });
  }
}

// ❌ 以前：重复的错误处理代码
class AdminController extends Controller {
  async addOne() {
    const { ctx, service } = this;
    try {
      // ... 业务逻辑
      if (!isUserNameUnique) {
        return ctx.helper.renderFail(ctx, {
          message: ctx.__('user_name_exists'),
        });
      }
      // ... 更多重复的错误处理
    } catch (err) {
      ctx.helper.renderFail(ctx, {
        message: err.message || err,
      });
    }
  }
}
```

## 🎨 异常管理器详解

### Repository层异常管理器

基类 `BaseStandardRepository` 提供了 `this.exceptions` 异常管理器，提供语义化的异常创建方法：

```javascript
// 用户相关异常
this.exceptions.user.nameExists(value); // 用户名已存在
this.exceptions.user.emailExists(value); // 邮箱已存在
this.exceptions.user.phoneExists(value); // 手机号已存在
this.exceptions.user.notFound(id); // 用户不存在
this.exceptions.user.disabled(); // 用户已禁用
this.exceptions.user.invalidCredentials(); // 登录凭据无效

// 认证相关异常
this.exceptions.auth.sessionExpired(); // 会话过期
this.exceptions.auth.invalidToken(); // 无效令牌
this.exceptions.auth.loginRequired(); // 需要登录

// 权限相关异常
this.exceptions.permission.denied(resource, action); // 权限被拒绝
this.exceptions.permission.resourceAccess(resource); // 资源访问被拒绝
this.exceptions.permission.actionForbidden(action); // 操作被禁止

// 业务规则异常
this.exceptions.business.statusConflict(message); // 状态冲突
this.exceptions.business.dataConflict(message); // 数据冲突
this.exceptions.business.operationNotAllowed(message); // 操作不允许

// 资源相关异常
this.exceptions.resource.notFound(resourceName, id); // 资源不存在
this.exceptions.resource.alreadyExists(resourceName, field, value); // 资源已存在
```

### Controller层异常管理器

在Controller中可以通过引入 `RepositoryExceptions` 使用相同的异常管理器：

```javascript
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');

// 使用方式与Repository层相同
throw RepositoryExceptions.auth.sessionExpired();
throw RepositoryExceptions.user.notFound(userId);
```

## 📚 异常类型使用指南

### 1. 验证相关异常

```javascript
const { ErrorFactory, ValidationError, UniqueConstraintError } = require('../exceptions');

// 通用验证错误
throw new ValidationError('userName', '用户名格式不正确');

// 唯一性约束错误
throw ErrorFactory.userNameExists('john_doe');
throw ErrorFactory.emailExists('john@example.com');
throw ErrorFactory.phoneExists('13800138000');

// 或直接使用
throw new UniqueConstraintError('userName', 'john_doe', '用户名已存在');
```

### 2. 认证和权限异常

```javascript
// 认证失败
throw ErrorFactory.authentication('用户未登录');
throw ErrorFactory.invalidCredentials();

// 权限不足
throw ErrorFactory.permission('无权限访问此资源', 'admin', 'read');
```

### 3. 业务规则异常

```javascript
// 用户状态相关
throw ErrorFactory.userDisabled();
throw ErrorFactory.userNotFound(userId);

// 自定义业务规则
throw new BusinessRuleError('INSUFFICIENT_BALANCE', '账户余额不足');
```

### 4. 数据库相关异常

```javascript
// 数据库操作失败
throw ErrorFactory.database('create', '创建用户失败', originalError);

// 数据一致性错误
throw new DataConsistencyError('数据状态冲突，请刷新后重试');
```

## 🔧 配置和定制

### 1. 中间件配置

```javascript
// config/config.default.js
config.middleware = [
  'errorHandler', // 统一错误处理中间件 - 放在最前面
  // ... 其他中间件
];

// 可选配置
config.errorHandler = {
  // 是否在生产环境返回详细错误信息
  enableDetail: false,
  // 自定义错误页面
  errorPageUrl: '/error',
};
```

### 2. 自定义异常类

```javascript
// 继承BusinessError创建自定义异常
class PaymentError extends BusinessError {
  constructor(paymentId, message) {
    super(message, 'PAYMENT_ERROR', 402);
    this.name = 'PaymentError';
    this.paymentId = paymentId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      paymentId: this.paymentId,
    };
  }
}

// 在ErrorFactory中添加快速创建方法
static paymentFailed(paymentId, reason) {
  return new PaymentError(paymentId, `支付失败: ${reason}`);
}
```

## 📊 错误响应格式

### 标准错误响应

```json
{
  "status": 400,
  "code": "UNIQUE_CONSTRAINT_ERROR",
  "message": "用户名已存在",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "field": "userName"
}
```

### 开发环境调试信息

```json
{
  "status": 500,
  "code": "DATABASE_ERROR",
  "message": "数据库连接失败",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "debug": {
    "stack": "Error: Connection timeout...",
    "originalError": "MongoNetworkError",
    "path": "/api/admin/create",
    "method": "POST",
    "body": { "userName": "test" }
  }
}
```

## 🎯 最佳实践

### 1. Repository层

- ✅ 使用ErrorFactory快速创建标准异常
- ✅ 在业务验证失败时抛出具体异常
- ✅ 使用\_handleError处理未预期的异常
- ❌ 避免返回null或false来表示错误

### 2. Controller层

- ✅ 移除try-catch，让异常自然抛出
- ✅ 专注于业务逻辑和参数验证
- ✅ 使用异常来处理业务错误
- ❌ 避免在Controller中处理具体异常

### 3. 异常设计

- ✅ 为不同的错误场景创建具体异常类
- ✅ 提供有意义的错误消息
- ✅ 包含必要的上下文信息
- ❌ 避免泄露敏感信息

## 🔍 调试和监控

### 错误日志格式

```
[AdminRepository] checkUserNameUnique error: {
  "error": "Duplicate key error",
  "stack": "Error: E11000 duplicate key error...",
  "operation": "checkUserNameUnique",
  "data": "{\"userName\":\"admin\",\"excludeId\":null}",
  "entityName": "Admin"
}
```

### 监控集成

错误中间件会触发error事件，可用于监控集成：

```javascript
// 在app.js中监听错误事件
app.on('error', (err, ctx) => {
  // 发送到监控系统
  if (err.statusCode >= 500) {
    // 服务器错误，需要报警
    monitoring.alert(err, ctx);
  }

  // 记录用户行为分析
  analytics.track('error_occurred', {
    error_code: err.code,
    user_id: ctx.session?.userId,
    path: ctx.path,
  });
});
```

## 🚀 迁移指南

### 从旧的错误处理迁移

1. **Repository层改造**：

   - 将返回false改为抛出异常
   - 使用ErrorFactory创建标准异常
   - 移除不必要的try-catch

2. **Controller层简化**：

   - 移除所有try-catch块
   - 移除renderFail调用
   - 专注业务逻辑

3. **测试更新**：
   - 更新单元测试，验证异常抛出
   - 测试HTTP响应格式
   - 验证错误码和状态码

这个统一异常处理架构为项目提供了更好的错误处理体验，提高了代码质量和开发效率！
