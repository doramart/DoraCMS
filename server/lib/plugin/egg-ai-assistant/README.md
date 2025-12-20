# Egg AI Assistant Plugin

> 🤖 智能 AI 助手插件 - 为 Egg.js 应用提供多模型 AI 能力

## 📋 项目概述

Egg AI Assistant 是一个功能完整的 AI 助手插件，支持多种 AI 服务提供商（OpenAI、DeepSeek、Ollama 等），提供智能模型选择、成本优化和降级策略。

### ✨ 核心特性

- 🔌 **多模型支持**: 统一接口调用 OpenAI、DeepSeek、Ollama 等 AI 服务
- 🧠 **智能选择**: 4 种模型选择策略（成本优先、性能优先、平衡、优先级）
- 🔄 **自动降级**: 模型失败自动切换备选，确保服务高可用
- 💰 **成本控制**: 精确的成本计算和估算，支持成本约束
- 📊 **统计监控**: 详细的使用统计和健康检查
- 🗄️ **数据库兼容**: 完全基于 Repository 模式，支持 MongoDB 和 MariaDB
- 🔐 **安全配置**: API Key 加密存储，Web 界面配置，无需修改代码 🔥

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────┐
│          Service Layer (业务层)              │
│  - AIModelManager                           │
│  - ModelSelector                            │
│  - PromptManager (Week 5-6)                 │
│  - AIContentService (Week 7)                │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│    Repository Layer (数据访问层)             │
│  - AIModel Repository                       │
│  - PromptTemplate Repository                │
│  - AIUsageLog Repository                    │
│  (支持 MongoDB 和 MariaDB)                  │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│      AI Adapters (AI 适配器层)              │
│  - BaseAIAdapter (抽象基类)                 │
│  - OpenAIAdapter ✅                         │
│  - DeepSeekAdapter (计划中)                │
│  - OllamaAdapter (计划中)                  │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│          Utility Layer (工具层)              │
│  - TokenCounter (Token 计数)                │
│  - CostCalculator (成本计算)                │
│  - RetryHelper (重试机制)                   │
└─────────────────────────────────────────────┘
```

## 📦 目录结构

```
egg-ai-assistant/
├── app/
│   ├── service/
│   │   ├── aiModelManager.js      # AI 模型管理服务
│   │   └── modelSelector.js       # 模型选择服务
│   ├── repository/
│   │   ├── interfaces/            # Repository 接口定义
│   │   ├── adapters/              # MongoDB/MariaDB 适配器
│   │   └── schemas/               # 数据库 Schema
│   ├── model/                     # MongoDB Models
│   └── controller/                # 控制器（计划中）
│
├── lib/
│   ├── adapters/                  # AI 服务适配器
│   │   ├── base/
│   │   │   └── BaseAIAdapter.js   # 基础适配器
│   │   └── openai/
│   │       └── OpenAIAdapter.js   # OpenAI 适配器
│   └── utils/                     # 工具函数
│       ├── tokenCounter.js        # Token 计数
│       ├── costCalculator.js      # 成本计算
│       └── retryHelper.js         # 重试机制
│
├── migrations/                    # 数据迁移
│   ├── seed/                      # 种子数据
│   │   ├── default-models.json
│   │   └── default-prompts.json
│   └── scripts/
│       └── init-database.js       # 数据库初始化
│
├── test/                          # 测试用例
│   └── integration/
│       └── ai-service-integration.test.js
│
├── docs/                          # 文档
│   ├── AI_ADAPTER_USAGE.md        # 使用指南
│   └── WEEK3-4_COMPLETION_SUMMARY.md
│
├── examples/                      # 示例代码
│   └── basic-usage.js
│
├── app.js                         # 插件入口
├── package.json
└── README.md                      # 本文件
```

## 🚀 快速开始

### 1. 配置

在 `config/config.default.js` 中添加配置：

```javascript
config.aiAssistant = {
  // 是否自动初始化数据库
  autoInit: true,

  // OpenAI 配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    apiEndpoint: 'https://api.openai.com/v1',
  },
};
```

### 2. 启用插件

在 `config/plugin.js` 中启用：

```javascript
exports.aiAssistant = {
  enable: true,
  package: 'egg-ai-assistant',
};
```

### 3. 使用示例

```javascript
// 在 Service 中使用
class YourService extends Service {
  async generateTitle(content) {
    // 1. 选择最优模型
    const { model, adapter } = await this.service.modelSelector.selectOptimalModel({
      taskType: 'title_generation',
      strategy: 'balanced',
    });

    // 2. 调用 AI
    const result = await adapter.generateWithRetry(content, {
      model: model.modelName,
      maxTokens: 100,
    });

    // 3. 记录统计
    await this.service.aiModelManager.recordModelUsage(model.id, {
      tokens: result.usage.totalTokens,
      cost: result.cost,
      responseTime: result.responseTime,
      success: true,
    });

    return result.content;
  }
}
```

## 📚 文档

**核心功能**:

- [AI 适配器使用指南](./docs/AI_ADAPTER_USAGE.md) - 详细的使用说明和示例
- [提示词管理指南](./docs/PROMPT_MANAGEMENT_GUIDE.md) - 提示词系统完整文档
- [AI 内容服务指南](./docs/AI_CONTENT_SERVICE_GUIDE.md) - AI 内容生成服务文档
- [API Key 管理设计](./docs/API_KEY_MANAGEMENT.md) - API Key 安全配置方案 🔥

**进度报告**:

- [Week 3-4 完成总结](./docs/WEEK3-4_COMPLETION_SUMMARY.md) - AI 适配器层
- [Week 5-6 完成总结](./docs/WEEK5-6_COMPLETION_SUMMARY.md) - 提示词管理系统
- [Week 7 完成总结](./docs/WEEK7_COMPLETION_SUMMARY.md) - AI 内容服务
- [进度总览](./PROGRESS.md) - 完整进度跟踪

**其他**:

- [示例代码](./examples/basic-usage.js) - 实际应用示例
- [缓存系统升级总结](./UNIFIED_CACHE_MIGRATION.md) - 统一缓存迁移

## ✅ 已完成功能（Week 1-4）

### Week 1-2: Repository 层 ✅

- ✅ AI Model Repository (MongoDB/MariaDB)
- ✅ Prompt Template Repository
- ✅ AI Usage Log Repository
- ✅ 数据库初始化脚本
- ✅ 一致性测试

### Week 3-4: AI 适配器层 ✅

- ✅ BaseAIAdapter 基础抽象类
- ✅ OpenAI Adapter
- ✅ AIModelManager Service
- ✅ ModelSelector Service
- ✅ Token 计数工具
- ✅ 成本计算工具
- ✅ 重试机制工具
- ✅ 集成测试
- ✅ 使用文档

## 🔄 进行中 / 计划中

### Week 5-6: 提示词管理系统

- ⏳ PromptManager Service
- ⏳ 提示词模板系统
- ⏳ 多语言支持
- ⏳ 变量渲染引擎
- ⏳ A/B 测试支持

### Week 7: AI Content Service

- ⏳ AIContentService 统一服务
- ⏳ 标题生成
- ⏳ 标签提取
- ⏳ 摘要生成
- ⏳ 分类匹配

### Week 8: 发布功能集成

- ⏳ ContentPublish Service 扩展
- ⏳ AI 辅助发布模式
- ⏳ 智能发布模式
- ⏳ 前端界面集成

## 🎯 模型选择策略

### 1. cost_optimal (成本优先)

选择成本最低的模型，适合批量处理和预算敏感场景。

```javascript
const { model, adapter } = await ctx.service.modelSelector.selectOptimalModel({
  taskType: 'tag_extraction',
  strategy: 'cost_optimal',
  maxCost: 0.01, // 可选：成本上限
});
```

### 2. performance_optimal (性能优先)

选择成功率最高、响应最快的模型，适合实时交互和质量优先场景。

```javascript
const { model, adapter } = await ctx.service.modelSelector.selectOptimalModel({
  taskType: 'title_generation',
  strategy: 'performance_optimal',
});
```

### 3. balanced (平衡模式) ⭐ 推荐

综合考虑成本、性能、优先级，适合大多数场景。

```javascript
const { model, adapter } = await ctx.service.modelSelector.selectOptimalModel({
  taskType: 'summary_generation',
  strategy: 'balanced',
});
```

### 4. priority (优先级模式)

按配置的优先级选择，适合需要明确控制的场景。

```javascript
const { model, adapter } = await ctx.service.modelSelector.selectOptimalModel({
  taskType: 'content_generation',
  strategy: 'priority',
});
```

## 🔧 工具函数

### Token 计数

```javascript
const TokenCounter = require('./lib/utils/tokenCounter');

// 估算 Token
const tokens = TokenCounter.estimate('Hello, world!', 'gpt-3.5-turbo');

// 截断到指定 Token 数
const truncated = TokenCounter.truncateToTokens(longText, 1000);
```

### 成本计算

```javascript
const CostCalculator = require('./lib/utils/costCalculator');

// 计算成本
const cost = CostCalculator.calculate(usage, 'gpt-3.5-turbo');

// 比较模型成本
const comparison = CostCalculator.compareModels(['gpt-3.5-turbo', 'gpt-4', 'gpt-4o-mini'], 1000);
```

### 重试机制

```javascript
const RetryHelper = require('./lib/utils/retryHelper');

const result = await RetryHelper.execute(async () => await someAPICall(), {
  maxRetries: 3,
  strategy: RetryHelper.STRATEGIES.EXPONENTIAL,
});
```

## 📊 统计和监控

### 查看模型统计

```javascript
// 单个模型
const stats = await ctx.service.aiModelManager.getModelStats(modelId);

// 整体统计
const overall = await ctx.service.aiModelManager.getOverallStats();
```

### 健康检查

```javascript
const health = await ctx.service.aiModelManager.healthCheckAll();
```

### 推荐模型

```javascript
const recommendations = await ctx.service.modelSelector.getRecommendedModels('title_generation');
```

## 🧪 测试

运行测试：

```bash
npm test -- lib/plugin/egg-ai-assistant/test/integration/ai-service-integration.test.js
```

## 🤝 贡献

欢迎贡献代码和提出建议！

### 添加新的 AI 适配器

1. 继承 `BaseAIAdapter`
2. 实现 `generate()` 方法
3. 可选：实现 `generateStream()` 方法
4. 在 `aiModelManager.js` 中注册

```javascript
class MyAIAdapter extends BaseAIAdapter {
  constructor(app, config) {
    super(app, config);
    this.provider = 'my-ai';
  }

  async generate(prompt, options = {}) {
    // 实现具体的 AI 调用逻辑
  }
}
```

## 📝 最佳实践

1. **使用模型选择器**：推荐使用 `ModelSelector` 而不是直接使用适配器
2. **记录使用统计**：始终记录模型使用情况以便优化
3. **实现降级策略**：使用 `selectWithFallback` 确保服务可用性
4. **控制成本**：设置 `maxCost` 限制避免超支
5. **优雅的错误处理**：提供降级内容或默认值
6. **监控健康状态**：定期执行健康检查
7. **优化 Token 使用**：使用 `TokenCounter.truncateToTokens` 避免超限

## 🔍 故障排查

### 模型选择失败

```javascript
// 检查可用模型
const models = await ctx.service.aiModelManager.getAvailableModels({ isEnabled: true });
```

### API 调用失败

```javascript
// 验证 API Key
const isValid = await adapter.validateApiKey();

// 健康检查
const health = await adapter.healthCheck();
```

### 成本过高

```javascript
// 使用成本优先策略
const { model } = await ctx.service.modelSelector.selectOptimalModel({
  strategy: 'cost_optimal',
  maxCost: 0.01,
});
```

## 📄 License

MIT

## 🙏 致谢

- Egg.js 框架
- OpenAI API
- 所有贡献者

---

**当前版本**: v0.7.5 (Week 7 + 缓存升级完成)  
**下一步**: Week 7.5-8 API Key 管理 + 发布功能集成

**重要更新**:

- ✅ Week 7: AI Content Service 完成
- ✅ 统一缓存系统迁移完成（app.cache）
- 🔥 Week 7.5: API Key 管理设计完成（待实施）
