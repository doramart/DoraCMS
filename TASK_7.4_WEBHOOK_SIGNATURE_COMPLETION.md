# Task 7.4 - Webhook 签名验证工具实现完成总结

## 任务概述

实现完整的 Webhook 签名验证工具，包括签名生成、验证、中间件和多语言示例，确保 Webhook 请求的真实性和完整性。

## 已完成的工作

### 1. 创建签名工具类

**文件**: `server/app/utils/webhookSignature.js`

实现了完整的签名工具类，包含以下方法：

#### 核心方法
- ✅ `generate(payload, secret)` - 生成 HMAC-SHA256 签名
- ✅ `verify(payload, signature, secret)` - 验证签名
- ✅ `extractSignature(headers)` - 从请求头中提取签名
- ✅ `verifyRequest(payload, headers, secret)` - 验证请求签名

#### 辅助方法
- ✅ `createPayload(event, data, timestamp)` - 创建标准 Webhook 请求体
- ✅ `verifyTimestamp(timestamp, toleranceSeconds)` - 验证时间戳有效性
- ✅ `verifyWebhookRequest(payload, headers, secret, options)` - 完整验证（签名+时间戳）

#### 安全特性
- ✅ `_secureCompare(a, b)` - 时间安全的字符串比较（防止时序攻击）
- ✅ 使用 `crypto.timingSafeEqual()` 进行安全比较
- ✅ 支持时间戳验证防止重放攻击

### 2. 创建验证中间件

**文件**: `server/app/middleware/webhookSignatureVerify.js`

实现了 Koa 中间件，用于自动验证 Webhook 请求：

#### 功能特性
- ✅ 自动提取和验证签名
- ✅ 支持动态获取 Secret（通过 `secretGetter` 函数）
- ✅ 可配置时间戳验证
- ✅ 自定义错误处理
- ✅ 详细的日志记录

#### 使用示例
```javascript
router.post('/webhook', 
  webhookSignatureVerify({
    secretGetter: async (ctx) => {
      return process.env.WEBHOOK_SECRET;
    },
    verifyTimestamp: true,
    toleranceSeconds: 300
  }),
  async (ctx) => {
    // 签名验证成功，处理 Webhook
    ctx.body = { status: 'success' };
  }
);
```

### 3. 编写完整文档

**文件**: `server/docs/webhook-signature-guide.md`

创建了详细的签名验证指南，包含：

#### 文档内容
- ✅ 签名机制说明
- ✅ 签名生成和验证流程
- ✅ Node.js 完整实现和示例
- ✅ Python 实现（Flask 示例）
- ✅ Java 实现（Spring Boot 示例）
- ✅ PHP 实现（Laravel 示例）
- ✅ Go 实现（HTTP 服务器示例）
- ✅ 安全最佳实践
- ✅ 常见问题解答
- ✅ 测试方法

#### 多语言支持
提供了 5 种主流编程语言的完整实现：
1. **Node.js** - Express/Koa 示例
2. **Python** - Flask 应用示例
3. **Java** - Spring Boot 应用示例
4. **PHP** - Laravel 路由示例
5. **Go** - HTTP 服务器示例

### 4. 编写单元测试

**文件**: `server/test/utils/webhookSignature.test.js`

创建了完整的单元测试套件：

#### 测试覆盖
- ✅ `generate()` 方法测试（6 个测试用例）
- ✅ `verify()` 方法测试（7 个测试用例）
- ✅ `extractSignature()` 方法测试（4 个测试用例）
- ✅ `verifyRequest()` 方法测试（3 个测试用例）
- ✅ `createPayload()` 方法测试（2 个测试用例）
- ✅ `verifyTimestamp()` 方法测试（5 个测试用例）
- ✅ `verifyWebhookRequest()` 方法测试（6 个测试用例）

**总计**: 33 个测试用例，覆盖所有核心功能和边界情况

## 技术实现细节

### 1. 签名算法

使用 HMAC-SHA256 算法：

```javascript
const crypto = require('crypto');

function generateSignature(payload, secret) {
  const payloadString = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadString);
  return 'sha256=' + hmac.digest('hex');
}
```

**签名格式**: `sha256=<64位十六进制字符串>`

### 2. 时间安全比较

使用 `crypto.timingSafeEqual()` 防止时序攻击：

```javascript
static _secureCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  return crypto.timingSafeEqual(bufferA, bufferB);
}
```

### 3. 时间戳验证

防止重放攻击：

```javascript
static verifyTimestamp(timestamp, toleranceSeconds = 300) {
  const requestTime = new Date(timestamp).getTime();
  const currentTime = Date.now();
  const diff = Math.abs(currentTime - requestTime);
  
  return diff <= toleranceSeconds * 1000;
}
```

**默认容忍时间**: 5 分钟（300 秒）

### 4. 请求体格式

标准 Webhook 请求体：

```json
{
  "event": "content.created",
  "timestamp": "2024-12-26T10:00:00.000Z",
  "data": {
    "id": "123",
    "title": "文章标题"
  }
}
```

### 5. 请求头格式

签名通过 HTTP 请求头传递：

```
X-Webhook-Signature: sha256=abc123...
X-Webhook-Event: content.created
X-Webhook-Delivery: log_id
```

## 使用示例

### Node.js 快速开始

```javascript
const WebhookSignature = require('./app/utils/webhookSignature');

// 1. 生成签名
const payload = {
  event: 'content.created',
  timestamp: new Date().toISOString(),
  data: { id: '123', title: 'Test' }
};
const secret = 'your_webhook_secret';
const signature = WebhookSignature.generate(payload, secret);

// 2. 验证签名
const isValid = WebhookSignature.verify(payload, signature, secret);

// 3. 完整验证（包括时间戳）
const result = WebhookSignature.verifyWebhookRequest(payload, headers, secret, {
  verifyTimestamp: true,
  toleranceSeconds: 300
});

if (!result.valid) {
  console.error(`Verification failed: ${result.reason}`);
}
```

### Express 中间件

```javascript
app.post('/webhook', (req, res) => {
  const payload = req.body;
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!WebhookSignature.verify(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 处理 Webhook
  res.json({ status: 'success' });
});
```

### Koa 中间件

```javascript
const webhookSignatureVerify = require('./app/middleware/webhookSignatureVerify');

router.post('/webhook', 
  webhookSignatureVerify({
    secretGetter: async (ctx) => process.env.WEBHOOK_SECRET,
    verifyTimestamp: true,
    toleranceSeconds: 300
  }),
  async (ctx) => {
    // 签名验证成功
    ctx.body = { status: 'success' };
  }
);
```

## 安全最佳实践

### 1. Secret 管理

✅ **推荐做法**：
- 使用至少 32 字节的强随机 Secret
- 使用环境变量存储 Secret
- 定期轮换 Secret
- 使用密钥管理服务（如 AWS KMS）

❌ **避免做法**：
- 不要在代码中硬编码 Secret
- 不要在日志中记录 Secret
- 不要通过不安全的渠道传输 Secret

### 2. 签名验证

✅ **必须做到**：
- 始终验证签名
- 使用时间安全比较
- 验证时间戳防止重放攻击
- 记录验证失败尝试

### 3. 错误处理

```javascript
try {
  const result = WebhookSignature.verifyWebhookRequest(payload, headers, secret);
  
  if (!result.valid) {
    logger.warn('Webhook verification failed', {
      reason: result.reason,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 处理 Webhook
  await processWebhook(payload);
  
} catch (error) {
  logger.error('Webhook processing error', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

### 4. Secret 轮换

支持多个 Secret 的过渡期：

```javascript
const secrets = [
  process.env.WEBHOOK_SECRET_NEW,  // 新 Secret
  process.env.WEBHOOK_SECRET_OLD   // 旧 Secret（过渡期）
];

function verifyWithMultipleSecrets(payload, signature, secrets) {
  return secrets.some(secret => 
    WebhookSignature.verify(payload, signature, secret)
  );
}
```

## 测试方法

### 运行单元测试

```bash
# 运行所有测试
npm test

# 运行签名工具测试
npm test test/utils/webhookSignature.test.js

# 查看测试覆盖率
npm run cov
```

### 手动测试

使用 curl 测试签名验证：

```bash
# 1. 生成签名
node -e "
const crypto = require('crypto');
const payload = JSON.stringify({
  event: 'test',
  timestamp: new Date().toISOString(),
  data: {}
});
const secret = 'your_secret';
const signature = 'sha256=' + crypto.createHmac('sha256', secret)
  .update(payload)
  .digest('hex');
console.log(signature);
"

# 2. 发送请求
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=..." \
  -d '{"event":"test","timestamp":"2024-12-26T10:00:00.000Z","data":{}}'
```

## 与现有系统的集成

### 1. webhookQueue.js 集成

`webhookQueue.js` 中已经使用了签名生成：

```javascript
// webhookQueue.js 中的签名生成
_generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return 'sha256=' + hmac.digest('hex');
}
```

**建议**：可以重构为使用 `WebhookSignature.generate()`：

```javascript
const WebhookSignature = require('../utils/webhookSignature');

_generateSignature(payload, secret) {
  return WebhookSignature.generate(payload, secret);
}
```

### 2. 接收 Webhook 的路由

如果需要接收来自外部系统的 Webhook，可以使用中间件：

```javascript
// server/app/router/api.js
const webhookSignatureVerify = require('../middleware/webhookSignatureVerify');

router.post('/api/webhooks/receive',
  webhookSignatureVerify({
    secretGetter: async (ctx) => {
      // 从数据库或配置中获取 secret
      return ctx.app.config.webhook.receiveSecret;
    },
    verifyTimestamp: true,
    toleranceSeconds: 300
  }),
  controller.api.webhook.receive
);
```

## 文档和示例

### 1. 完整文档

`server/docs/webhook-signature-guide.md` 包含：
- 签名机制详细说明
- 5 种编程语言的完整实现
- 安全最佳实践
- 常见问题解答
- 测试方法

### 2. 代码示例

文档中提供了以下语言的完整示例：
- **Node.js** (Express/Koa)
- **Python** (Flask)
- **Java** (Spring Boot)
- **PHP** (Laravel)
- **Go** (HTTP Server)

每个示例都包含：
- 签名生成函数
- 签名验证函数
- HTTP 服务器集成
- 完整的使用示例

## 性能考虑

### 1. 签名生成性能

HMAC-SHA256 算法性能优秀：
- 单次签名生成：< 1ms
- 支持高并发场景
- CPU 密集型操作，可考虑缓存

### 2. 时间安全比较

`crypto.timingSafeEqual()` 性能：
- 固定时间比较，防止时序攻击
- 性能开销极小（< 0.1ms）
- 安全性优先于性能

### 3. 优化建议

```javascript
// 如果同一 payload 需要多次验证，可以缓存签名
const signatureCache = new Map();

function getCachedSignature(payload, secret) {
  const key = `${JSON.stringify(payload)}:${secret}`;
  
  if (!signatureCache.has(key)) {
    const signature = WebhookSignature.generate(payload, secret);
    signatureCache.set(key, signature);
  }
  
  return signatureCache.get(key);
}
```

## 常见问题

### Q1: 为什么签名验证总是失败？

**可能原因**：
1. Secret 不正确
2. 请求体被修改（如添加了空格或换行）
3. JSON 序列化方式不一致
4. 字符编码问题

**解决方案**：
```javascript
// 确保使用相同的 JSON 序列化方式
const payload = JSON.parse(JSON.stringify(originalPayload));

// 检查 Secret 是否正确
console.log('Secret:', secret);

// 检查生成的签名
const expectedSignature = WebhookSignature.generate(payload, secret);
console.log('Expected:', expectedSignature);
console.log('Received:', signature);
```

### Q2: 如何处理 Secret 轮换？

**方案**：支持多个 Secret，逐步迁移

```javascript
const secrets = [
  process.env.WEBHOOK_SECRET_NEW,
  process.env.WEBHOOK_SECRET_OLD
];

function verifyWithMultipleSecrets(payload, signature, secrets) {
  return secrets.some(secret => 
    WebhookSignature.verify(payload, signature, secret)
  );
}
```

### Q3: 时间戳验证失败怎么办？

**可能原因**：
1. 服务器时间不同步
2. 网络延迟过大
3. 容忍时间设置过小

**解决方案**：
```javascript
// 增加容忍时间
const result = WebhookSignature.verifyWebhookRequest(payload, headers, secret, {
  verifyTimestamp: true,
  toleranceSeconds: 600 // 10 分钟
});

// 或者暂时禁用时间戳验证
const result = WebhookSignature.verifyWebhookRequest(payload, headers, secret, {
  verifyTimestamp: false
});
```

## 下一步建议

根据 `.kiro/specs/cms-platform-foundation/tasks.md`，Webhook 系统还有以下任务：

1. **Task 7.6** - 在业务逻辑中集成 Webhook
   - 在 Content Service 中触发事件
   - 在 User Service 中触发事件

2. **Task 7.3 & 7.5** - 编写属性测试（可选）
   - Webhook 可靠性属性测试
   - Webhook 签名验证属性测试

## 完成状态

✅ **Task 7.4 - 实现 Webhook 签名验证** 已完成

- ✅ 创建签名工具类（`WebhookSignature`）
- ✅ 实现签名生成和验证方法
- ✅ 实现时间安全比较（防止时序攻击）
- ✅ 实现时间戳验证（防止重放攻击）
- ✅ 创建 Koa 验证中间件
- ✅ 编写完整文档（包含 5 种语言示例）
- ✅ 编写单元测试（33 个测试用例）
- ✅ 提供安全最佳实践指南

**下一步**：可以开始 Task 7.6（在业务逻辑中集成 Webhook）。
