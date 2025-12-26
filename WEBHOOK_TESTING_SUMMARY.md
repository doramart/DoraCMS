# Webhook 测试功能总结

## 📋 概述

为了方便测试 DoraCMS 的 Webhook 发送功能，我创建了完整的测试工具和文档。

## 🎯 创建的文件

### 1. 测试文档

#### `server/docs/webhook-quick-start.md`
- **用途**: 5 分钟快速开始指南
- **内容**:
  - 三种测试方法（Webhook.site、本地服务器、自动化脚本）
  - 支持的事件类型列表
  - 常见问题解答
  - 快速示例代码

#### `server/docs/webhook-testing-guide.md`
- **用途**: 完整的测试指南
- **内容**:
  - 详细的测试步骤
  - 多种测试场景（内容事件、用户事件、重试机制、批量操作）
  - 签名验证方法（Node.js、Python）
  - 故障排查指南
  - 性能优化建议

### 2. 测试工具

#### `scripts/webhook-test-server.js`
- **用途**: 本地 Webhook 接收服务器
- **功能**:
  - 接收并显示 Webhook 请求
  - 验证签名（可选）
  - 验证时间戳（防重放攻击）
  - 美化的控制台输出
  - Web 界面（访问 http://localhost:3000）

**启动方法**:
```bash
# 基础启动
node scripts/webhook-test-server.js

# 启用签名验证
WEBHOOK_SECRET=your_secret node scripts/webhook-test-server.js

# 或者
node scripts/webhook-test-server.js your_secret

# 自定义端口
PORT=8080 node scripts/webhook-test-server.js
```

#### `scripts/test-webhook.sh`
- **用途**: 自动化测试脚本
- **功能**:
  - 自动创建 Webhook
  - 触发事件
  - 查看日志和统计
  - 测试启用/禁用功能
  - 可选删除测试数据

**使用方法**:
```bash
# 设置环境变量
export TOKEN="your_jwt_token"
export API_URL="http://localhost:7001"
export WEBHOOK_URL="https://webhook.site/your-id"

# 运行测试
./scripts/test-webhook.sh
```

## 🚀 快速开始

### 方法一：使用 Webhook.site（推荐新手）

**最简单，无需任何配置！**

1. 访问 https://webhook.site 获取测试 URL
2. 创建 Webhook：
   ```bash
   curl -X POST http://localhost:7001/manage/v1/webhooks \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "name": "测试 Webhook",
       "url": "https://webhook.site/YOUR-ID",
       "events": ["content.created"],
       "enabled": true
     }'
   ```
3. 触发事件（创建内容）
4. 在 webhook.site 页面查看结果

### 方法二：使用本地测试服务器（推荐开发）

**适合需要验证签名和详细调试！**

1. 启动测试服务器：
   ```bash
   node scripts/webhook-test-server.js
   ```

2. 创建 Webhook（URL 指向 http://localhost:3000/webhook）

3. 触发事件，查看服务器控制台输出

### 方法三：使用自动化脚本（推荐测试）

**一键完成所有测试！**

```bash
export TOKEN="your_jwt_token"
./scripts/test-webhook.sh
```

## 📊 测试场景

### 1. 基础功能测试
- ✅ 创建 Webhook
- ✅ 获取 Webhook 列表
- ✅ 更新 Webhook
- ✅ 启用/禁用 Webhook
- ✅ 删除 Webhook

### 2. 事件触发测试

#### 内容事件
```bash
# content.created
POST /api/v1/content

# content.updated
PUT /api/v1/content/:id

# content.deleted
DELETE /api/v1/content/:id

# content.published / content.unpublished
PUT /api/v1/content/:id/status
```

#### 用户事件
```bash
# user.registered
POST /api/v1/users/register

# user.login
POST /api/v1/users/login

# user.logout
POST /api/v1/users/logout

# user.updated
PUT /api/v1/users/:id

# user.deleted
DELETE /api/v1/users/:id
```

### 3. 可靠性测试
- ✅ 重试机制（失败自动重试）
- ✅ 超时处理
- ✅ 错误日志记录
- ✅ 并发处理

### 4. 安全性测试
- ✅ 签名验证
- ✅ 时间戳验证（防重放攻击）
- ✅ Secret 管理

## 🔍 查看测试结果

### 1. 通过 API 查看日志

```bash
# 获取 Webhook 列表
curl -X GET "http://localhost:7001/manage/v1/webhooks" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 查看 Webhook 日志
curl -X GET "http://localhost:7001/manage/v1/webhooks/WEBHOOK_ID/logs" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 查看统计信息
curl -X GET "http://localhost:7001/manage/v1/webhooks/WEBHOOK_ID/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 通过数据库查看

```bash
# MongoDB
mongo
use doracms
db.webhook_logs.find().sort({createdAt: -1}).limit(10).pretty()

# MariaDB
mysql -u root -p
USE doracms;
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

### 3. 通过应用日志查看

```bash
tail -f logs/doracms-web.log | grep -i webhook
```

## 🎨 测试服务器功能展示

当你启动 `webhook-test-server.js` 并接收到 Webhook 时，会看到：

```
============================================================
📨 收到 Webhook 请求
============================================================
⏰ 时间: 2024-01-01T12:00:00.000Z

📋 请求头:
  X-Webhook-Event: content.created
  X-Webhook-ID: 507f1f77bcf86cd799439011
  X-Webhook-Signature: abc123def456...
  X-Webhook-Timestamp: 1704110400000
  X-Webhook-Delivery: 550e8400-e29b-41d4-a716-446655440000
  Content-Type: application/json

📦 请求体:
{
  "event": "content.created",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "测试文章",
    "content": "这是测试内容",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}

🔐 验证签名:
  Secret: your_secre...
  结果: ✅ 签名验证通过

⏱️  时间戳验证:
  请求时间: 2024-01-01T12:00:00.000Z
  当前时间: 2024-01-01T12:00:03.000Z
  时间差: 3.00 秒
  结果: ✅ 时间戳有效

============================================================
✅ 响应: 200 OK
============================================================
```

## 📝 测试检查清单

### 启动前检查
- [ ] DoraCMS 服务已启动（`pnpm run dev:server`）
- [ ] 已获取管理员 JWT Token
- [ ] 测试 URL 已准备好（webhook.site 或本地服务器）

### 基础功能测试
- [ ] 创建 Webhook 成功
- [ ] 获取 Webhook 列表成功
- [ ] 更新 Webhook 成功
- [ ] 启用/禁用 Webhook 成功

### 事件触发测试
- [ ] content.created 事件触发成功
- [ ] content.updated 事件触发成功
- [ ] content.deleted 事件触发成功
- [ ] user.registered 事件触发成功
- [ ] user.login 事件触发成功

### 日志和统计测试
- [ ] 查看 Webhook 日志成功
- [ ] 查看统计信息成功
- [ ] 日志包含完整的请求/响应信息

### 签名验证测试
- [ ] 签名正确生成
- [ ] 签名验证通过
- [ ] 时间戳验证通过

### 错误处理测试
- [ ] 无效 URL 触发重试
- [ ] 超时正确处理
- [ ] 错误日志正确记录

## 🐛 故障排查

### Webhook 没有触发？
1. 检查 Webhook 是否启用（`enabled: true`）
2. 检查事件类型是否匹配
3. 查看应用日志：`tail -f logs/doracms-web.log`
4. 检查队列是否正常初始化

### Webhook 发送失败？
1. 检查 URL 是否可访问：`curl -X POST YOUR_URL`
2. 查看错误日志：`GET /manage/v1/webhooks/WEBHOOK_ID/logs?status=failed`
3. 检查超时设置（默认 10 秒）
4. 检查网络连接

### 签名验证失败？
1. 确认 Secret 正确
2. 检查时间戳是否在容差范围内（默认 5 分钟）
3. 确保请求体未被修改
4. 检查字符编码（应为 UTF-8）

## 📚 相关文档

- [Webhook 快速开始](./server/docs/webhook-quick-start.md) - 5 分钟快速上手
- [Webhook 完整测试指南](./server/docs/webhook-testing-guide.md) - 详细测试文档
- [Webhook 签名验证指南](./server/docs/webhook-signature-guide.md) - 签名机制说明
- [Task 7.7 完成总结](./TASK_7.7_WEBHOOK_CONTROLLER_COMPLETION.md) - Controller 实现
- [Task 7.6 完成总结](./TASK_7.6_WEBHOOK_INTEGRATION_COMPLETION.md) - 业务集成
- [Task 7.4 完成总结](./TASK_7.4_WEBHOOK_SIGNATURE_COMPLETION.md) - 签名工具

## 🎯 推荐测试流程

1. **快速验证**（5 分钟）
   - 使用 webhook.site 快速验证基本功能
   - 确认 Webhook 能够正常发送

2. **详细测试**（15 分钟）
   - 使用本地测试服务器
   - 验证签名机制
   - 测试各种事件类型

3. **自动化测试**（5 分钟）
   - 运行 `test-webhook.sh` 脚本
   - 验证所有 API 功能

4. **压力测试**（可选）
   - 创建多个 Webhook
   - 批量触发事件
   - 验证并发处理能力

## ✅ 测试完成标准

- ✅ 所有 CRUD 操作正常
- ✅ 所有事件类型都能触发
- ✅ 日志和统计功能正常
- ✅ 签名验证通过
- ✅ 重试机制正常工作
- ✅ 错误处理正确

## 🎉 总结

现在你有了完整的 Webhook 测试工具集：

1. **📖 文档齐全**: 快速开始 + 完整指南
2. **🛠️ 工具完善**: 测试服务器 + 自动化脚本
3. **🎯 场景全面**: 基础功能 + 事件触发 + 可靠性 + 安全性
4. **🐛 排查方便**: 详细日志 + 故障排查指南

开始测试吧！🚀
