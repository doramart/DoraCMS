# Webhook 文档索引

快速找到你需要的 Webhook 文档。

## 🎯 我想...

### 理解 Webhook 概念（新手必读）
👉 [Webhook 概念详解](./server/docs/webhook-concept-explained.md)
- 什么是 Webhook？
- 完整链路图解
- 具体例子说明
- 与其他方式对比

### 查看代码执行流程
👉 [Webhook 代码执行详解](./server/docs/webhook-code-walkthrough.md)
- HTTP POST 在哪里发送？
- 完整调用栈
- 关键代码位置
- 如何调试

### 理解 URL 的来源
👉 [Webhook URL 详解](./server/docs/webhook-url-explained.md)
- URL 从哪里来？
- URL 如何流转？
- URL 存储在哪里？
- 如何查看和更新 URL

### 快速开始测试
👉 [Webhook 快速开始指南](./server/docs/webhook-quick-start.md)
- 5 分钟快速上手
- 三种测试方法
- 即用的示例代码

### 深入了解测试
👉 [Webhook 完整测试指南](./server/docs/webhook-testing-guide.md)
- 详细的测试步骤
- 多种测试场景
- 故障排查指南

### 使用测试工具
👉 [测试工具使用说明](./scripts/README.md)
- 测试服务器使用方法
- 自动化脚本使用方法
- 高级用法和技巧

### 了解签名验证
👉 [Webhook 签名验证指南](./server/docs/webhook-signature-guide.md)
- 签名生成和验证
- 多语言实现示例
- 安全最佳实践

### 查看测试资源
👉 [测试资源总览](./WEBHOOK_TESTING_RESOURCES.md)
- 所有文件说明
- 使用方法汇总
- 快速参考

### 了解实现细节
👉 [Task 7.7 - Controller 实现](./TASK_7.7_WEBHOOK_CONTROLLER_COMPLETION.md)
- Webhook 管理接口
- API 路由说明
- 实现细节

👉 [Task 7.6 - 业务集成](./TASK_7.6_WEBHOOK_INTEGRATION_COMPLETION.md)
- 业务逻辑集成
- 事件触发机制
- 集成测试

👉 [Task 7.4 - 签名工具](./TASK_7.4_WEBHOOK_SIGNATURE_COMPLETION.md)
- 签名工具实现
- 中间件说明
- 单元测试

## 📁 文档分类

### 用户文档（使用指南）
- [Webhook 概念详解](./server/docs/webhook-concept-explained.md) - 新手必读，理解概念
- [Webhook 代码执行详解](./server/docs/webhook-code-walkthrough.md) - 代码流程，调试指南
- [Webhook 流程图解](./server/docs/webhook-flow-diagram.md) - 流程图解，可视化说明
- [快速开始](./server/docs/webhook-quick-start.md) - 新手入门，快速测试
- [完整测试指南](./server/docs/webhook-testing-guide.md) - 深入学习，详细测试
- [签名验证指南](./server/docs/webhook-signature-guide.md) - 安全机制，签名验证

### 工具文档（工具使用）
- [测试工具说明](./scripts/README.md) - 工具使用方法
- [测试服务器](./scripts/webhook-test-server.js) - 本地接收服务器
- [自动化脚本](./scripts/test-webhook.sh) - 一键测试脚本

### 总结文档（概览参考）
- [测试资源总览](./WEBHOOK_TESTING_RESOURCES.md) - 所有资源说明
- [测试功能总结](./WEBHOOK_TESTING_SUMMARY.md) - 测试工具总结

### 开发文档（实现细节）
- [Controller 实现](./TASK_7.7_WEBHOOK_CONTROLLER_COMPLETION.md) - 管理接口
- [业务集成](./TASK_7.6_WEBHOOK_INTEGRATION_COMPLETION.md) - 事件触发
- [签名工具](./TASK_7.4_WEBHOOK_SIGNATURE_COMPLETION.md) - 签名验证

## 🚀 推荐阅读顺序

### 第一次使用 Webhook
1. [Webhook 概念详解](./server/docs/webhook-concept-explained.md) - 理解 Webhook 是什么
2. [快速开始指南](./server/docs/webhook-quick-start.md) - 了解基础概念
3. [测试工具说明](./scripts/README.md) - 学习使用工具
4. [测试资源总览](./WEBHOOK_TESTING_RESOURCES.md) - 查看所有资源

### 深入学习 Webhook
1. [完整测试指南](./server/docs/webhook-testing-guide.md) - 详细测试方法
2. [签名验证指南](./server/docs/webhook-signature-guide.md) - 安全机制
3. [业务集成](./TASK_7.6_WEBHOOK_INTEGRATION_COMPLETION.md) - 实现细节

### 开发和维护
1. [Controller 实现](./TASK_7.7_WEBHOOK_CONTROLLER_COMPLETION.md) - API 接口
2. [签名工具](./TASK_7.4_WEBHOOK_SIGNATURE_COMPLETION.md) - 工具实现
3. [业务集成](./TASK_7.6_WEBHOOK_INTEGRATION_COMPLETION.md) - 集成方式

## 📊 文档对比

| 文档 | 目标读者 | 阅读时间 | 详细程度 |
|-----|---------|---------|---------|
| [概念详解](./server/docs/webhook-concept-explained.md) | 新手 | 10 分钟 | ⭐⭐⭐ |
| [代码执行详解](./server/docs/webhook-code-walkthrough.md) | 开发者 | 15 分钟 | ⭐⭐⭐⭐ |
| [流程图解](./server/docs/webhook-flow-diagram.md) | 所有人 | 5 分钟 | ⭐⭐ |
| [快速开始](./server/docs/webhook-quick-start.md) | 新手 | 5 分钟 | ⭐⭐ |
| [完整测试指南](./server/docs/webhook-testing-guide.md) | 开发者 | 20 分钟 | ⭐⭐⭐⭐⭐ |
| [签名验证指南](./server/docs/webhook-signature-guide.md) | 开发者 | 15 分钟 | ⭐⭐⭐⭐ |
| [测试工具说明](./scripts/README.md) | 测试人员 | 10 分钟 | ⭐⭐⭐ |
| [测试资源总览](./WEBHOOK_TESTING_RESOURCES.md) | 所有人 | 5 分钟 | ⭐⭐ |

## 🎯 按场景查找

### 场景：我想知道代码在哪里执行
1. 阅读 [Webhook 代码执行详解](./server/docs/webhook-code-walkthrough.md)
2. 查看完整调用栈
3. 在关键位置添加断点调试

### 场景：我不理解 Webhook 是什么
1. 阅读 [Webhook 概念详解](./server/docs/webhook-concept-explained.md)
2. 查看完整链路图和具体例子
3. 使用 Webhook.site 亲自体验

### 场景：我想快速验证 Webhook 功能
1. 阅读 [快速开始指南](./server/docs/webhook-quick-start.md)
2. 使用 Webhook.site 方法
3. 5 分钟完成测试

### 场景：我想在本地调试 Webhook
1. 阅读 [测试工具说明](./scripts/README.md)
2. 启动本地测试服务器
3. 查看详细的请求信息

### 场景：我想自动化测试 Webhook
1. 阅读 [测试工具说明](./scripts/README.md)
2. 配置环境变量
3. 运行自动化测试脚本

### 场景：我想验证签名机制
1. 阅读 [签名验证指南](./server/docs/webhook-signature-guide.md)
2. 启动测试服务器（带 Secret）
3. 查看签名验证结果

### 场景：我想了解实现细节
1. 阅读 [Controller 实现](./TASK_7.7_WEBHOOK_CONTROLLER_COMPLETION.md)
2. 阅读 [业务集成](./TASK_7.6_WEBHOOK_INTEGRATION_COMPLETION.md)
3. 阅读 [签名工具](./TASK_7.4_WEBHOOK_SIGNATURE_COMPLETION.md)

### 场景：我遇到了问题
1. 查看 [完整测试指南](./server/docs/webhook-testing-guide.md) 的故障排查部分
2. 查看 [测试工具说明](./scripts/README.md) 的故障排查部分
3. 查看应用日志：`tail -f logs/doracms-web.log`

## 🔗 外部资源

### 在线测试工具
- [Webhook.site](https://webhook.site) - 免费的 Webhook 测试服务
- [Postman Echo](https://postman-echo.com) - Postman 提供的测试服务
- [RequestBin](https://requestbin.com) - 另一个 Webhook 测试服务

### 相关技术
- [HMAC-SHA256](https://en.wikipedia.org/wiki/HMAC) - 签名算法
- [Webhook 最佳实践](https://webhooks.fyi) - 业界标准
- [Bull Queue](https://github.com/OptimalBits/bull) - 队列系统

## 📞 获取帮助

### 查看日志
```bash
# 应用日志
tail -f logs/doracms-web.log | grep -i webhook

# Webhook 日志（通过 API）
curl -X GET "http://localhost:7001/manage/v1/webhooks/WEBHOOK_ID/logs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 检查状态
```bash
# 检查 Webhook 列表
curl -X GET "http://localhost:7001/manage/v1/webhooks" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 检查统计信息
curl -X GET "http://localhost:7001/manage/v1/webhooks/WEBHOOK_ID/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 测试连接
```bash
# 测试 URL 是否可访问
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 🎉 快速开始

选择一个入口开始：

```bash
# 1. 快速验证（推荐新手）
# 阅读：server/docs/webhook-quick-start.md
# 使用：Webhook.site

# 2. 本地调试（推荐开发）
node scripts/webhook-test-server.js

# 3. 自动化测试（推荐测试）
export TOKEN="your_jwt_token"
./scripts/test-webhook.sh
```

---

**提示**: 如果你不确定从哪里开始，建议先阅读 [快速开始指南](./server/docs/webhook-quick-start.md)。

祝使用愉快！🚀
