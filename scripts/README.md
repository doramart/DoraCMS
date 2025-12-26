# Webhook 测试工具

本目录包含用于测试 DoraCMS Webhook 功能的工具和脚本。

## 📁 文件说明

### `webhook-test-server.js`
本地 Webhook 接收服务器，用于接收和验证 Webhook 请求。

**功能特性**:
- ✅ 接收并显示 Webhook 请求详情
- ✅ 验证 HMAC-SHA256 签名
- ✅ 验证时间戳（防重放攻击）
- ✅ 美化的控制台输出
- ✅ Web 界面（http://localhost:3000）
- ✅ 健康检查端点

**使用方法**:

```bash
# 基础启动（不验证签名）
node scripts/webhook-test-server.js

# 启用签名验证（推荐）
WEBHOOK_SECRET=your_webhook_secret node scripts/webhook-test-server.js

# 或者通过命令行参数
node scripts/webhook-test-server.js your_webhook_secret

# 自定义端口
PORT=8080 node scripts/webhook-test-server.js
```

**示例输出**:

```
============================================================
📨 收到 Webhook 请求
============================================================
⏰ 时间: 2024-01-01T12:00:00.000Z

📋 请求头:
  X-Webhook-Event: content.created
  X-Webhook-ID: 507f1f77bcf86cd799439011
  X-Webhook-Signature: abc123...
  X-Webhook-Timestamp: 1704110400000

📦 请求体:
{
  "event": "content.created",
  "data": { ... }
}

🔐 验证签名:
  结果: ✅ 签名验证通过

⏱️  时间戳验证:
  结果: ✅ 时间戳有效
============================================================
```

### `test-webhook.sh`
自动化测试脚本，执行完整的 Webhook 功能测试。

**测试内容**:
- ✅ 创建 Webhook
- ✅ 获取 Webhook 列表
- ✅ 触发事件（创建内容）
- ✅ 查看日志
- ✅ 查看统计信息
- ✅ 更新 Webhook
- ✅ 启用/禁用 Webhook
- ✅ 删除 Webhook（可选）

**使用方法**:

```bash
# 1. 设置环境变量
export TOKEN="your_jwt_token"
export API_URL="http://localhost:7001"
export WEBHOOK_URL="https://webhook.site/your-unique-id"

# 2. 运行测试
./scripts/test-webhook.sh

# 或者一行命令
TOKEN="your_token" ./scripts/test-webhook.sh
```

**依赖**:
- `curl` - HTTP 客户端（必需）
- `jq` - JSON 处理工具（可选，用于格式化输出）

安装 jq（可选）:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

## 🚀 快速开始

### 方法一：使用 Webhook.site（最简单）

1. 访问 https://webhook.site 获取测试 URL
2. 运行自动化测试：
   ```bash
   export TOKEN="your_jwt_token"
   export WEBHOOK_URL="https://webhook.site/your-id"
   ./scripts/test-webhook.sh
   ```
3. 在 webhook.site 页面查看接收到的请求

### 方法二：使用本地测试服务器

1. 启动测试服务器：
   ```bash
   node scripts/webhook-test-server.js
   ```

2. 在另一个终端运行测试：
   ```bash
   export TOKEN="your_jwt_token"
   export WEBHOOK_URL="http://localhost:3000/webhook"
   ./scripts/test-webhook.sh
   ```

3. 查看测试服务器的控制台输出

## 📖 完整文档

- [Webhook 快速开始](../server/docs/webhook-quick-start.md) - 5 分钟快速上手
- [Webhook 完整测试指南](../server/docs/webhook-testing-guide.md) - 详细测试文档
- [Webhook 签名验证指南](../server/docs/webhook-signature-guide.md) - 签名机制说明
- [测试功能总结](../WEBHOOK_TESTING_SUMMARY.md) - 测试工具总览

## 🔧 高级用法

### 测试特定事件

```bash
# 测试内容事件
curl -X POST http://localhost:7001/api/v1/content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "测试", "content": "内容"}'

# 测试用户事件
curl -X POST http://localhost:7001/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@example.com", "password": "pass123"}'
```

### 验证签名（Node.js）

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, timestamp, secret) {
  const signString = `${timestamp}.${JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signString)
    .digest('hex');
  return signature === expectedSignature;
}
```

### 使用 ngrok 暴露本地服务

如果需要从远程服务器测试：

```bash
# 安装 ngrok
npm install -g ngrok

# 暴露本地 3000 端口
ngrok http 3000

# 使用 ngrok 提供的 URL 创建 Webhook
# 例如: https://abc123.ngrok.io/webhook
```

## 🐛 故障排查

### 问题：测试脚本报错 "curl: command not found"
**解决**: 安装 curl
```bash
# macOS
brew install curl

# Ubuntu/Debian
sudo apt-get install curl
```

### 问题：测试服务器无法启动
**解决**: 检查端口是否被占用
```bash
# 查看端口占用
lsof -i :3000

# 使用其他端口
PORT=8080 node scripts/webhook-test-server.js
```

### 问题：签名验证失败
**解决**: 
1. 确认 Secret 正确
2. 检查时间同步（时间戳验证）
3. 确保请求体未被修改

### 问题：Webhook 没有触发
**解决**:
1. 检查 Webhook 是否启用
2. 检查事件类型是否匹配
3. 查看应用日志：`tail -f logs/doracms-web.log`

## 💡 提示

1. **开发环境**: 使用本地测试服务器，可以看到详细的请求信息
2. **快速验证**: 使用 webhook.site，无需搭建任何服务
3. **自动化测试**: 使用测试脚本，一键完成所有测试
4. **生产环境**: 使用真实的 Webhook 接收端点，并启用签名验证

## 📞 需要帮助？

- 查看 [完整测试指南](../server/docs/webhook-testing-guide.md)
- 查看 [签名验证指南](../server/docs/webhook-signature-guide.md)
- 查看应用日志：`logs/doracms-web.log`
- 查看 Webhook 日志：通过 API 或数据库

祝测试顺利！🎉
