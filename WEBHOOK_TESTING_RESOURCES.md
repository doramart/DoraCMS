# Webhook 测试资源总览

## 📦 已创建的文件

我为你创建了完整的 Webhook 测试工具集，包括文档、工具和脚本。

### 📖 文档（3 个）

#### 1. `server/docs/webhook-quick-start.md`
**5 分钟快速开始指南**

- 🎯 目标：让新手快速上手
- 📝 内容：
  - 三种测试方法（Webhook.site、本地服务器、自动化脚本）
  - 支持的事件类型完整列表
  - 常见问题快速解答
  - 即用的示例代码
- 👥 适合：第一次使用 Webhook 的用户

#### 2. `server/docs/webhook-testing-guide.md`
**完整测试指南（最详细）**

- 🎯 目标：提供全面的测试指导
- 📝 内容：
  - 详细的准备工作
  - 三种测试方法的完整步骤
  - 多种测试场景（内容、用户、重试、批量）
  - 签名验证示例（Node.js、Python）
  - 查看日志和统计的方法
  - 完整的故障排查指南
  - 性能优化建议
  - 完整测试脚本示例
- 👥 适合：需要深入测试的开发者

#### 3. `scripts/README.md`
**测试工具使用说明**

- 🎯 目标：说明测试工具的使用方法
- 📝 内容：
  - 工具文件说明
  - 使用方法和示例
  - 依赖安装指南
  - 高级用法
  - 故障排查
- 👥 适合：使用测试工具的开发者

### 🛠️ 工具（2 个）

#### 1. `scripts/webhook-test-server.js`
**本地 Webhook 接收服务器**

**功能特性**:
- ✅ 接收并显示 Webhook 请求
- ✅ 美化的控制台输出（带颜色和图标）
- ✅ 验证 HMAC-SHA256 签名
- ✅ 验证时间戳（防重放攻击）
- ✅ Web 界面（访问 http://localhost:3000）
- ✅ 健康检查端点（/health）
- ✅ 支持环境变量和命令行参数配置

**使用场景**:
- 本地开发调试
- 验证签名机制
- 查看详细的请求信息
- 测试时间戳验证

**启动命令**:
```bash
# 基础启动
node scripts/webhook-test-server.js

# 启用签名验证
WEBHOOK_SECRET=your_secret node scripts/webhook-test-server.js

# 自定义端口
PORT=8080 node scripts/webhook-test-server.js
```

#### 2. `scripts/test-webhook.sh`
**自动化测试脚本**

**功能特性**:
- ✅ 自动执行完整测试流程
- ✅ 彩色输出（成功/失败/警告）
- ✅ 依赖检查（curl、jq）
- ✅ 配置验证
- ✅ JSON 格式化输出
- ✅ 错误处理
- ✅ 交互式删除确认

**测试内容**:
1. 创建 Webhook
2. 获取 Webhook 列表
3. 触发事件（创建内容）
4. 等待处理
5. 查看日志
6. 查看统计
7. 更新 Webhook
8. 禁用 Webhook
9. 启用 Webhook
10. 删除 Webhook（可选）

**使用命令**:
```bash
export TOKEN="your_jwt_token"
./scripts/test-webhook.sh
```

### 📊 总结文档（2 个）

#### 1. `WEBHOOK_TESTING_SUMMARY.md`
**测试功能总结**

- 创建的文件列表
- 快速开始指南
- 测试场景说明
- 查看结果的方法
- 测试检查清单
- 故障排查指南
- 推荐测试流程

#### 2. `WEBHOOK_TESTING_RESOURCES.md`（本文件）
**测试资源总览**

- 所有文件的说明
- 使用方法汇总
- 快速参考

## 🚀 三种测试方法

### 方法一：Webhook.site（最简单）

**优点**:
- ✅ 无需任何配置
- ✅ 实时查看请求
- ✅ 自动保存历史记录
- ✅ 提供 Web 界面

**适合场景**:
- 快速验证功能
- 演示 Webhook
- 不需要验证签名

**步骤**:
1. 访问 https://webhook.site
2. 复制生成的 URL
3. 创建 Webhook
4. 触发事件
5. 在页面查看结果

### 方法二：本地测试服务器（最详细）

**优点**:
- ✅ 完全控制
- ✅ 验证签名
- ✅ 详细的日志输出
- ✅ 可以自定义逻辑

**适合场景**:
- 开发调试
- 验证签名机制
- 需要详细信息

**步骤**:
1. 启动测试服务器：`node scripts/webhook-test-server.js`
2. 创建 Webhook（URL: http://localhost:3000/webhook）
3. 触发事件
4. 查看控制台输出

### 方法三：自动化脚本（最快速）

**优点**:
- ✅ 一键测试
- ✅ 完整流程
- ✅ 自动验证
- ✅ 适合 CI/CD

**适合场景**:
- 回归测试
- 持续集成
- 批量测试

**步骤**:
1. 设置环境变量：`export TOKEN="..."`
2. 运行脚本：`./scripts/test-webhook.sh`
3. 查看测试结果

## 📋 支持的事件类型

### 内容事件（Content Events）
| 事件名称 | 触发时机 | 触发方式 |
|---------|---------|---------|
| `content.created` | 创建内容 | POST /api/v1/content |
| `content.updated` | 更新内容 | PUT /api/v1/content/:id |
| `content.deleted` | 删除内容 | DELETE /api/v1/content/:id |
| `content.published` | 发布内容 | PUT /api/v1/content/:id/status |
| `content.unpublished` | 取消发布 | PUT /api/v1/content/:id/status |

### 用户事件（User Events）
| 事件名称 | 触发时机 | 触发方式 |
|---------|---------|---------|
| `user.registered` | 用户注册 | POST /api/v1/users/register |
| `user.login` | 用户登录 | POST /api/v1/users/login |
| `user.logout` | 用户登出 | POST /api/v1/users/logout |
| `user.updated` | 更新用户 | PUT /api/v1/users/:id |
| `user.deleted` | 删除用户 | DELETE /api/v1/users/:id |

## 🎯 快速参考

### 创建 Webhook

```bash
curl -X POST http://localhost:7001/manage/v1/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "我的 Webhook",
    "url": "https://your-webhook-url.com/webhook",
    "events": ["content.created", "user.registered"],
    "enabled": true
  }'
```

### 触发事件

```bash
# 触发 content.created
curl -X POST http://localhost:7001/api/v1/content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "测试", "content": "内容"}'

# 触发 user.registered
curl -X POST http://localhost:7001/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@example.com", "password": "pass123"}'
```

### 查看日志

```bash
# 获取 Webhook 列表
curl -X GET http://localhost:7001/manage/v1/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN"

# 查看 Webhook 日志
curl -X GET http://localhost:7001/manage/v1/webhooks/WEBHOOK_ID/logs \
  -H "Authorization: Bearer YOUR_TOKEN"

# 查看统计信息
curl -X GET http://localhost:7001/manage/v1/webhooks/WEBHOOK_ID/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 验证签名（Node.js）

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, timestamp, secret) {
  const signString = `${timestamp}.${JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signString)
    .digest('hex');
  return signature === expectedSignature;
}
```

## 🔍 故障排查快速指南

### Webhook 没有触发？
```bash
# 1. 检查 Webhook 是否启用
curl -X GET http://localhost:7001/manage/v1/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. 查看应用日志
tail -f logs/doracms-web.log | grep -i webhook

# 3. 检查事件类型是否匹配
# 确认 Webhook 监听的事件与触发的事件一致
```

### Webhook 发送失败？
```bash
# 1. 测试 URL 是否可访问
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 2. 查看错误日志
curl -X GET "http://localhost:7001/manage/v1/webhooks/WEBHOOK_ID/logs?status=failed" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. 检查超时设置（默认 10 秒）
```

### 签名验证失败？
```bash
# 1. 确认 Secret 正确
# 2. 检查时间戳（容差 5 分钟）
# 3. 确保请求体未被修改
# 4. 检查字符编码（UTF-8）
```

## 📚 文档导航

### 新手入门
1. 阅读 [快速开始指南](./server/docs/webhook-quick-start.md)
2. 使用 Webhook.site 测试
3. 查看测试结果

### 深入学习
1. 阅读 [完整测试指南](./server/docs/webhook-testing-guide.md)
2. 使用本地测试服务器
3. 验证签名机制

### 自动化测试
1. 阅读 [工具使用说明](./scripts/README.md)
2. 运行自动化测试脚本
3. 集成到 CI/CD

### 签名验证
1. 阅读 [签名验证指南](./server/docs/webhook-signature-guide.md)
2. 查看多语言示例
3. 实现签名验证

## 🎉 总结

你现在拥有：

### 📖 完整的文档
- ✅ 快速开始指南（5 分钟上手）
- ✅ 完整测试指南（深入学习）
- ✅ 工具使用说明（工具参考）
- ✅ 签名验证指南（安全机制）

### 🛠️ 强大的工具
- ✅ 本地测试服务器（详细调试）
- ✅ 自动化测试脚本（一键测试）

### 🎯 多种测试方法
- ✅ Webhook.site（最简单）
- ✅ 本地服务器（最详细）
- ✅ 自动化脚本（最快速）

### 📊 完整的测试场景
- ✅ 基础功能测试
- ✅ 事件触发测试
- ✅ 可靠性测试
- ✅ 安全性测试

## 🚀 开始测试

选择一种方法开始：

```bash
# 方法一：使用 Webhook.site
# 1. 访问 https://webhook.site
# 2. 复制 URL
# 3. 创建 Webhook
# 4. 触发事件

# 方法二：使用本地测试服务器
node scripts/webhook-test-server.js

# 方法三：使用自动化脚本
export TOKEN="your_jwt_token"
./scripts/test-webhook.sh
```

祝测试顺利！🎉

---

**相关文档**:
- [快速开始](./server/docs/webhook-quick-start.md)
- [完整测试指南](./server/docs/webhook-testing-guide.md)
- [签名验证指南](./server/docs/webhook-signature-guide.md)
- [工具使用说明](./scripts/README.md)
- [测试功能总结](./WEBHOOK_TESTING_SUMMARY.md)
