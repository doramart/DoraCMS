# AI 适配器层使用指南

## 📋 概述

AI 适配器层提供了统一的接口来调用不同的 AI 服务（OpenAI、DeepSeek、Ollama 等），并支持智能模型选择、成本优化和降级策略。

## 🏗️ 架构

```
Service Layer (业务层)
    ↓
ModelSelector (模型选择器)
    ↓
AIModelManager (模型管理器)
    ↓
Repository Layer (数据层)
    ↓
AI Adapters (OpenAI/DeepSeek/Ollama)
```

## 🚀 快速开始

### 1. 配置 AI 模型

在数据库中创建 AI 模型配置（通过初始化脚本自动完成）：

```javascript
{
  provider: 'openai',
  modelName: 'gpt-3.5-turbo',
  displayName: 'GPT-3.5 Turbo',
  description: '快速且经济的通用模型',
  config: {
    apiKey: process.env.OPENAI_API_KEY,
    apiEndpoint: 'https://api.openai.com/v1',
    maxTokens: 2000,
    temperature: 0.7,
    timeout: 30000
  },
  supportedTasks: ['title_generation', 'tag_extraction', 'summary_generation'],
  costPerRequest: 0.002,
  priority: 50,
  isEnabled: true
}
```

### 2. 使用模型选择器（推荐）

智能选择最优模型：

```javascript
// 在 Service 中使用
class YourService extends Service {
  async generateTitle(content) {
    try {
      // 1. 选择最优模型
      const { model, adapter } = await this.service.modelSelector.selectOptimalModel({
        taskType: 'title_generation',
        strategy: 'balanced', // cost_optimal | performance_optimal | balanced | priority
        maxCost: 0.01, // 可选：最大成本限制
      });

      // 2. 调用 AI 生成内容
      const result = await adapter.generateWithRetry(content, {
        model: model.modelName,
        maxTokens: 100,
        temperature: 0.8,
      });

      // 3. 记录使用统计
      if (result.success) {
        await this.service.aiModelManager.recordModelUsage(model.id || model._id, {
          tokens: result.usage.totalTokens,
          cost: result.cost,
          responseTime: result.responseTime,
          success: true,
        });

        return result.content;
      }

      throw new Error(result.error);
    } catch (error) {
      this.logger.error('Generate title failed:', error);
      throw error;
    }
  }
}
```

### 3. 带降级的模型选择

自动降级到备选模型：

```javascript
async generateContent(prompt) {
  try {
    // 自动尝试多个模型，直到成功
    const { model, adapter } = await this.service.modelSelector.selectWithFallback({
      taskType: 'summary_generation',
      strategy: 'balanced',
      maxFallbackAttempts: 3, // 最多尝试 3 个模型
    });

    const result = await adapter.generateWithRetry(prompt, {
      model: model.modelName,
      maxTokens: 500,
    });

    return result;
  } catch (error) {
    this.logger.error('All models failed:', error);
    // 返回降级内容或抛出错误
    throw error;
  }
}
```

### 4. 直接使用 AI 适配器

如果需要更精细的控制：

```javascript
async useDirectAdapter() {
  // 获取模型配置
  const model = await this.service.aiModelManager.findByProviderAndModel(
    'openai',
    'gpt-3.5-turbo'
  );

  // 创建适配器
  const OpenAIAdapter = require('../../lib/adapters/openai/OpenAIAdapter');
  const adapter = new OpenAIAdapter(this.app, {
    apiKey: model.config.apiKey,
    apiEndpoint: model.config.apiEndpoint,
    defaultModel: model.modelName,
  });

  // 调用 AI
  const result = await adapter.generate('Hello, AI!', {
    maxTokens: 100,
    temperature: 0.7,
  });

  console.log(result.content);
}
```

## 📊 模型选择策略

### 1. 成本优先 (cost_optimal)

选择成本最低的模型：

```javascript
const { model, adapter } = await this.service.modelSelector.selectOptimalModel({
  taskType: 'tag_extraction',
  strategy: 'cost_optimal',
});
```

**适用场景**：

- 批量处理任务
- 预算敏感的应用
- 对质量要求不高的场景

### 2. 性能优先 (performance_optimal)

选择成功率最高、响应最快的模型：

```javascript
const { model, adapter } = await this.service.modelSelector.selectOptimalModel({
  taskType: 'title_generation',
  strategy: 'performance_optimal',
});
```

**适用场景**：

- 实时交互应用
- 对质量要求高的场景
- 用户体验优先

### 3. 平衡模式 (balanced)

综合考虑成本、性能、优先级：

```javascript
const { model, adapter } = await this.service.modelSelector.selectOptimalModel({
  taskType: 'summary_generation',
  strategy: 'balanced',
});
```

**适用场景**：

- 默认推荐策略
- 大多数应用场景
- 需要权衡成本和质量

### 4. 优先级模式 (priority)

按配置的优先级选择：

```javascript
const { model, adapter } = await this.service.modelSelector.selectOptimalModel({
  taskType: 'content_generation',
  strategy: 'priority',
});
```

**适用场景**：

- 需要明确控制模型选择
- 特定业务场景
- 手动配置优先级

## 🔧 工具函数

### Token 计数

```javascript
const TokenCounter = require('../lib/utils/tokenCounter');

// 估算文本 token 数
const tokens = TokenCounter.estimate('Hello, world!', 'gpt-3.5-turbo');

// 估算消息数组 token 数
const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
];
const totalTokens = TokenCounter.estimateMessages(messages, 'gpt-3.5-turbo');

// 截断到指定 token 数
const truncated = TokenCounter.truncateToTokens(longText, 1000, 'gpt-3.5-turbo');
```

### 成本计算

```javascript
const CostCalculator = require('../lib/utils/costCalculator');

// 计算实际成本
const usage = {
  promptTokens: 100,
  completionTokens: 50,
  totalTokens: 150,
};
const cost = CostCalculator.calculate(usage, 'gpt-3.5-turbo');

// 估算成本
const estimatedCost = CostCalculator.estimate(1000, 'gpt-4');

// 转换为人民币
const rmbCost = CostCalculator.toRMB(cost, 7.2);

// 比较模型成本
const comparison = CostCalculator.compareModels(['gpt-3.5-turbo', 'gpt-4', 'gpt-4o-mini'], 1000);
```

### 重试机制

```javascript
const RetryHelper = require('../lib/utils/retryHelper');

// 基本重试
const result = await RetryHelper.execute(
  async () => {
    return await someAPICall();
  },
  {
    maxRetries: 3,
    strategy: RetryHelper.STRATEGIES.EXPONENTIAL,
    baseDelay: 1000,
    maxDelay: 30000,
  }
);

// 速率限制重试
const rateLimitResult = await RetryHelper.execute(
  async () => await callAPI(),
  RetryHelper.createRateLimitStrategy(60) // 每分钟 60 次请求
);

// 断路器模式
const cbResult = await RetryHelper.executeWithCircuitBreaker(async () => await callAPI(), {
  maxRetries: 3,
  failureThreshold: 5,
  resetTimeout: 60000,
});
```

## 📈 统计和监控

### 获取模型统计

```javascript
// 单个模型统计
const stats = await this.service.aiModelManager.getModelStats(modelId);
console.log(stats);
// {
//   totalCalls: 100,
//   totalTokens: 50000,
//   totalCost: 0.1,
//   successRate: 0.98,
//   averageResponseTime: 1200,
//   lastUsedAt: Date
// }

// 整体统计
const overall = await this.service.aiModelManager.getOverallStats();
console.log(overall);
// {
//   totalModels: 5,
//   enabledModels: 3,
//   totalCalls: 500,
//   totalTokens: 250000,
//   totalCost: 0.5,
//   byProvider: { openai: {...}, deepseek: {...} }
// }
```

### 健康检查

```javascript
// 检查所有模型
const health = await this.service.aiModelManager.healthCheckAll();
console.log(health);
// {
//   totalModels: 5,
//   healthyModels: 4,
//   unhealthyModels: 1,
//   models: [
//     { id: '...', provider: 'openai', modelName: 'gpt-3.5-turbo', healthy: true, responseTime: 1200 },
//     ...
//   ]
// }
```

### 获取推荐模型

```javascript
const recommendations = await this.service.modelSelector.getRecommendedModels('title_generation');
console.log(recommendations);
// [
//   { ...model, score: 0.85 },
//   { ...model, score: 0.78 },
//   { ...model, score: 0.65 }
// ]
```

## 🎯 实际应用示例

### 示例 1：智能文章标题生成

```javascript
class ContentService extends Service {
  async generateTitle(articleContent, options = {}) {
    try {
      // 1. 选择最优模型
      const { model, adapter } = await this.service.modelSelector.selectWithFallback({
        taskType: 'title_generation',
        strategy: 'balanced',
        maxFallbackAttempts: 3,
      });

      // 2. 生成标题
      const result = await adapter.generateWithRetry(articleContent, {
        model: model.modelName,
        maxTokens: 100,
        temperature: 0.8,
        systemPrompt: '你是一个专业的标题生成助手，擅长创作吸引人的文章标题。',
      });

      // 3. 记录统计
      await this.service.aiModelManager.recordModelUsage(model.id || model._id, {
        tokens: result.usage.totalTokens,
        cost: result.cost,
        responseTime: result.responseTime,
        success: result.success,
      });

      return {
        title: result.content,
        metadata: {
          provider: model.provider,
          model: model.modelName,
          cost: result.cost,
          responseTime: result.responseTime,
        },
      };
    } catch (error) {
      this.logger.error('Generate title failed:', error);
      // 降级到默认标题
      return {
        title: '未命名文章',
        metadata: { fallback: true },
      };
    }
  }
}
```

### 示例 2：批量标签提取

```javascript
async extractTagsBatch(articles) {
  const results = [];

  // 使用成本优先策略批量处理
  const { model, adapter } = await this.service.modelSelector.selectOptimalModel({
    taskType: 'tag_extraction',
    strategy: 'cost_optimal',
  });

  for (const article of articles) {
    try {
      const result = await adapter.generateWithRetry(article.content, {
        model: model.modelName,
        maxTokens: 50,
        temperature: 0.3,
      });

      results.push({
        articleId: article.id,
        tags: result.content.split(',').map(tag => tag.trim()),
      });

      // 记录统计
      await this.service.aiModelManager.recordModelUsage(model.id || model._id, {
        tokens: result.usage.totalTokens,
        cost: result.cost,
        responseTime: result.responseTime,
        success: true,
      });
    } catch (error) {
      this.logger.error(`Extract tags failed for article ${article.id}:`, error);
      results.push({
        articleId: article.id,
        tags: [],
        error: error.message,
      });
    }
  }

  return results;
}
```

## ⚙️ 配置说明

### 插件配置

在 `config/config.default.js` 中：

```javascript
config.aiAssistant = {
  // 是否自动初始化数据库
  autoInit: true,

  // 默认模型选择策略
  defaultStrategy: 'balanced',

  // 成本限制（美元）
  maxCostPerRequest: 0.1,

  // 超时配置
  timeout: 30000,

  // 重试配置
  maxRetries: 3,

  // OpenAI 配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    apiEndpoint: 'https://api.openai.com/v1',
  },

  // DeepSeek 配置（可选）
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    apiEndpoint: 'https://api.deepseek.com/v1',
  },
};
```

## 🔍 调试和日志

开启详细日志：

```javascript
// 在 Service 中
this.logger.debug('[AI] Model selected:', model);
this.logger.info('[AI] Generation completed:', result);
this.logger.error('[AI] Generation failed:', error);
```

查看适配器统计：

```javascript
const stats = adapter.getStats();
console.log('Adapter stats:', stats);
```

## 📝 最佳实践

1. **使用模型选择器**：推荐使用 `ModelSelector` 而不是直接使用适配器
2. **记录使用统计**：始终记录模型使用情况以便优化
3. **实现降级策略**：使用 `selectWithFallback` 确保服务可用性
4. **控制成本**：设置 `maxCost` 限制避免超支
5. **优雅的错误处理**：提供降级内容或默认值
6. **监控健康状态**：定期执行健康检查
7. **优化 Token 使用**：使用 `TokenCounter.truncateToTokens` 避免超限

## 🚨 故障排查

### 问题 1：模型选择失败

```javascript
// 错误：No available AI models found

// 解决方案：
// 1. 确认数据库中有启用的模型
const models = await this.service.aiModelManager.getAvailableModels({ isEnabled: true });
console.log('Available models:', models);

// 2. 检查模型是否支持该任务类型
const modelsByTask = await this.service.aiModelManager.getAvailableModels({
  taskType: 'your_task_type',
});
```

### 问题 2：API 调用失败

```javascript
// 错误：API Key validation failed

// 解决方案：
// 1. 验证 API Key
const isValid = await adapter.validateApiKey();

// 2. 检查网络和端点
const health = await adapter.healthCheck();
console.log('Adapter health:', health);
```

### 问题 3：成本过高

```javascript
// 解决方案：
// 1. 使用成本优先策略
const { model } = await this.service.modelSelector.selectOptimalModel({
  strategy: 'cost_optimal',
  maxCost: 0.01,
});

// 2. 预估成本
const estimatedCost = CostCalculator.estimate(tokens, modelName);
if (estimatedCost > maxCost) {
  // 使用更便宜的模型或降级
}
```

## 📚 相关文档

- [Repository 层文档](../app/repository/README.md)
- [模型配置指南](./MODEL_CONFIGURATION.md)
- [API 参考](./API_REFERENCE.md)
