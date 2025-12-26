# Webhook 系统 MariaDB 支持完成总结

## 问题描述

在添加 Webhook 系统后，重启项目时 `egg-ai-assistant` 插件报错：
```
[egg-ai-assistant] RepositoryFactory not found! Plugin cannot work without Repository pattern.
```

## 根本原因

主项目的 `app.js` 中 RepositoryFactory 已经在 `willReady()` 中初始化，但 Webhook 队列没有被初始化。

## 解决方案

在 `server/app.js` 的 `didReady()` 生命周期钩子中添加 Webhook 队列初始化，并在 `beforeClose` 中添加清理逻辑：

```javascript
async didReady() {
  // ... 其他初始化代码 ...
  
  // 🔥 初始化 Webhook 队列
  try {
    const WebhookQueue = require('./app/lib/webhookQueue');
    _theApp.webhookQueue = new WebhookQueue(_theApp);
    await _theApp.webhookQueue.init();
    _theApp.logger.info('✅ Webhook 队列初始化成功');
  } catch (error) {
    _theApp.logger.error('❌ Webhook 队列初始化失败:', error);
    // 不阻止应用启动，Webhook 功能可选
  }
}

// 在 beforeClose 中添加清理
this.app.beforeClose(async () => {
  // 关闭 Webhook 队列
  if (this.app.webhookQueue) {
    try {
      await this.app.webhookQueue.close();
      this.app.logger.info('✅ Webhook 队列已关闭');
    } catch (error) {
      this.app.logger.error('❌ Webhook 队列关闭失败:', error);
    }
  }
  
  // 其他清理逻辑...
});
```

## 修改说明

**重要**：本次修改只在原有 `app.js` 中添加了 Webhook 队列的初始化和清理逻辑，**没有删除任何现有功能**：

1. ✅ 保留了所有原有的初始化逻辑（模板系统、缓存系统、权限系统等）
2. ✅ 在 `didReady()` 中添加了 Webhook 队列初始化
3. ✅ 在 `beforeClose()` 中添加了 Webhook 队列清理
4. ✅ 使用 try-catch 包裹，确保 Webhook 初始化失败不影响应用启动

## Egg.js 生命周期顺序

1. `configWillLoad` - 配置文件即将加载
2. `configDidLoad` - 配置文件加载完成
3. `didLoad` - 文件加载完成
4. **`willReady`** - 插件启动完毕（✅ RepositoryFactory 在这里初始化）
5. **`didReady`** - 应用启动完成（✅ Webhook 队列在这里初始化）
6. `serverDidReady` - HTTP 服务器启动完成
7. `beforeClose` - 应用即将关闭（✅ Webhook 队列在这里清理）

## Webhook 系统 MariaDB 支持完成清单

### ✅ 已完成的文件

1. **MongoDB 层**（之前已完成）：
   - `server/app/model/webhook.js` - Webhook MongoDB Model
   - `server/app/model/webhookLog.js` - WebhookLog MongoDB Model
   - `server/app/repository/adapters/mongodb/WebhookMongoRepository.js`
   - `server/app/repository/adapters/mongodb/WebhookLogMongoRepository.js`

2. **MariaDB 层**（本次完成）：
   - `server/app/repository/schemas/mariadb/WebhookSchema.js` - Webhook Sequelize Schema
   - `server/app/repository/schemas/mariadb/WebhookLogSchema.js` - WebhookLog Sequelize Schema
   - `server/app/repository/adapters/mariadb/WebhookMariaRepository.js` - Webhook MariaDB Repository
   - `server/app/repository/adapters/mariadb/WebhookLogMariaRepository.js` - WebhookLog MariaDB Repository

3. **连接管理器更新**：
   - `server/app/repository/connections/MariaDBConnection.js` - 添加了 Webhook 和 WebhookLog 模型加载

4. **工厂配置**：
   - `server/app/repository/factories/RepositoryFactory.js` - 已注册 Webhook 和 WebhookLog

5. **应用初始化**：
   - `server/app.js` - 添加了 Webhook 队列初始化和清理逻辑（**保留了所有原有功能**）

6. **Service 和队列**（之前已完成）：
   - `server/app/service/webhook.js` - Webhook Service
   - `server/app/lib/webhookQueue.js` - Webhook 队列处理器
   - `server/app/constants/WebhookEvents.js` - Webhook 事件常量
   - `server/app/repository/base/RepositoryExceptions.js` - Webhook 异常定义

## WebhookLogMariaRepository 核心功能

- ✅ 基础 CRUD（继承自 BaseMariaRepository）
- ✅ `findByWebhookId()` - 根据 Webhook ID 查找日志
- ✅ `findByEvent()` - 根据事件查找日志
- ✅ `findPendingRetries()` - 查找需要重试的日志
- ✅ `markAsSuccess()` - 标记为成功
- ✅ `markAsFailed()` - 标记为失败
- ✅ `markAsRetrying()` - 标记为重试中
- ✅ `getWebhookStats()` - 获取 Webhook 统计信息
- ✅ `getEventStats()` - 获取事件统计信息
- ✅ `cleanupOldLogs()` - 清理旧日志

## 验证步骤

1. 重启项目：`pnpm run dev:server`
2. 检查日志，确认以下信息：
   - ✅ Repository 系统初始化成功
   - ✅ Webhook 队列初始化成功
   - ✅ egg-ai-assistant 插件正常加载（不再报错）
   - ✅ 所有原有功能正常（模板系统、缓存系统、权限系统等）
   - ✅ MariaDB 模型加载成功（如果使用 MariaDB）

## 下一步任务

根据 `.kiro/specs/cms-platform-foundation/tasks.md`：

- [ ] **Task 7.4** - 实现 Webhook 签名验证工具（已在 webhookQueue.js 中实现 HMAC-SHA256）
- [ ] **Task 7.6** - 在业务逻辑中集成 Webhook（在 Content/User Service 中触发事件）
- [ ] **Task 7.7** - 实现 Webhook 管理接口（Controller 层）

## 技术要点

1. **双数据库支持**：Webhook 系统完整支持 MongoDB 和 MariaDB
2. **Repository 模式**：严格遵循项目的 Repository 模式
3. **生命周期管理**：正确处理 Egg.js 应用和插件的生命周期
4. **错误处理**：Webhook 初始化失败不阻止应用启动（可选功能）
5. **队列处理**：使用 Bull 队列异步处理 Webhook 发送
6. **向后兼容**：保留了所有原有的应用初始化逻辑

## 注意事项

- RepositoryFactory 已在 `willReady` 中初始化，插件在 `didReady` 时可以访问
- Webhook 队列在 `didReady` 中初始化，确保 Repository 系统已就绪
- Webhook 队列依赖 Redis，确保 Redis 配置正确
- MariaDB 模式下，Sequelize 会自动创建表结构（通过 `sync()`）
- 所有 JSON 字段在 MariaDB 中存储为 TEXT，通过 getter/setter 自动序列化/反序列化
- **本次修改没有删除任何原有功能，只是添加了 Webhook 队列的初始化和清理**
