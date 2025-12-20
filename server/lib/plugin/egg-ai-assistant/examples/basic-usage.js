/**
 * AI 适配器基本使用示例
 * 本文件演示如何在实际项目中使用 AI 服务
 */
'use strict';

/**
 * 示例 1: 使用模型选择器生成文章标题
 * 推荐方式：自动选择最优模型
 * @param ctx
 * @param articleContent
 */
async function generateTitleExample(ctx, articleContent) {
  try {
    // Step 1: 使用模型选择器选择最优模型
    const { model, adapter } = await ctx.service.modelSelector.selectOptimalModel({
      taskType: 'title_generation',
      strategy: 'balanced', // 平衡策略：兼顾成本和性能
    });

    console.log(`Selected model: ${model.provider}/${model.modelName}`);

    // Step 2: 调用 AI 生成标题（带自动重试）
    const result = await adapter.generateWithRetry(articleContent, {
      model: model.modelName,
      maxTokens: 100,
      temperature: 0.8,
      systemPrompt: '你是一个专业的标题生成助手，擅长创作吸引人的文章标题。',
    });

    if (result.success) {
      console.log('Generated title:', result.content);
      console.log('Cost:', result.cost, 'USD');
      console.log('Response time:', result.responseTime, 'ms');

      // Step 3: 记录使用统计（重要！用于优化模型选择）
      await ctx.service.aiModelManager.recordModelUsage(model.id || model._id, {
        tokens: result.usage.totalTokens,
        cost: result.cost,
        responseTime: result.responseTime,
        success: true,
      });

      return result.content;
    }

    throw new Error(result.error);
  } catch (error) {
    console.error('Generate title failed:', error);
    // 降级处理：返回默认标题
    return '未命名文章';
  }
}

/**
 * 示例 2: 使用降级机制确保服务可用
 * 自动尝试多个模型直到成功
 * @param ctx
 * @param articleContent
 */
async function generateTitleWithFallback(ctx, articleContent) {
  try {
    // 自动降级：如果首选模型失败，会自动尝试其他模型
    const { model, adapter } = await ctx.service.modelSelector.selectWithFallback({
      taskType: 'title_generation',
      strategy: 'balanced',
      maxFallbackAttempts: 3, // 最多尝试 3 个不同的模型
    });

    const result = await adapter.generateWithRetry(articleContent, {
      model: model.modelName,
      maxTokens: 100,
    });

    if (result.success) {
      await ctx.service.aiModelManager.recordModelUsage(model.id || model._id, {
        tokens: result.usage.totalTokens,
        cost: result.cost,
        responseTime: result.responseTime,
        success: true,
      });

      return result.content;
    }

    throw new Error(result.error);
  } catch (error) {
    console.error('All models failed:', error);
    return '未命名文章';
  }
}

/**
 * 示例 3: 批量处理（成本优先策略）
 * 适用于批量生成标签等场景
 * @param ctx
 * @param articles
 */
async function extractTagsBatch(ctx, articles) {
  const results = [];

  // 使用成本优先策略
  const { model, adapter } = await ctx.service.modelSelector.selectOptimalModel({
    taskType: 'tag_extraction',
    strategy: 'cost_optimal', // 选择成本最低的模型
    maxCost: 0.01, // 可选：设置最大成本限制
  });

  console.log(`Using cost-optimal model: ${model.provider}/${model.modelName}`);
  console.log(`Cost per request: $${model.costPerRequest}`);

  for (const article of articles) {
    try {
      const result = await adapter.generateWithRetry(article.content, {
        model: model.modelName,
        maxTokens: 50,
        temperature: 0.3, // 较低的温度，保证稳定性
      });

      if (result.success) {
        results.push({
          articleId: article.id,
          tags: result.content.split(',').map(tag => tag.trim()),
          cost: result.cost,
        });

        // 记录统计
        await ctx.service.aiModelManager.recordModelUsage(model.id || model._id, {
          tokens: result.usage.totalTokens,
          cost: result.cost,
          responseTime: result.responseTime,
          success: true,
        });
      }
    } catch (error) {
      console.error(`Failed to extract tags for article ${article.id}:`, error);
      results.push({
        articleId: article.id,
        tags: [],
        error: error.message,
      });
    }
  }

  // 输出总成本
  const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
  console.log(`Total cost: $${totalCost.toFixed(6)}`);

  return results;
}

/**
 * 示例 4: 获取推荐模型
 * 查看哪些模型最适合特定任务
 * @param ctx
 * @param taskType
 */
async function getRecommendedModelsExample(ctx, taskType) {
  const recommendations = await ctx.service.modelSelector.getRecommendedModels(taskType);

  console.log(`Recommended models for ${taskType}:`);
  recommendations.forEach((model, index) => {
    console.log(`${index + 1}. ${model.provider}/${model.modelName}`);
    console.log(`   Score: ${model.score.toFixed(2)}`);
    console.log(`   Cost: $${model.costPerRequest}`);
    console.log(`   Priority: ${model.priority}`);
    console.log(`   Success Rate: ${(model.statistics?.successRate || 1.0) * 100}%`);
    console.log('');
  });

  return recommendations;
}

/**
 * 示例 5: 查看模型统计
 * 监控 AI 使用情况和成本
 * @param ctx
 */
async function viewModelStatsExample(ctx) {
  // 获取整体统计
  const overall = await ctx.service.aiModelManager.getOverallStats();

  console.log('=== Overall AI Usage Statistics ===');
  console.log(`Total Models: ${overall.totalModels}`);
  console.log(`Enabled Models: ${overall.enabledModels}`);
  console.log(`Total Calls: ${overall.totalCalls}`);
  console.log(`Total Tokens: ${overall.totalTokens}`);
  console.log(`Total Cost: $${overall.totalCost.toFixed(4)}`);
  console.log('');

  console.log('=== By Provider ===');
  Object.entries(overall.byProvider).forEach(([provider, stats]) => {
    console.log(`${provider}:`);
    console.log(`  Models: ${stats.models}`);
    console.log(`  Calls: ${stats.calls}`);
    console.log(`  Tokens: ${stats.tokens}`);
    console.log(`  Cost: $${stats.cost.toFixed(4)}`);
  });

  return overall;
}

/**
 * 示例 6: 健康检查
 * 定期检查所有模型的可用性
 * @param ctx
 */
async function healthCheckExample(ctx) {
  const health = await ctx.service.aiModelManager.healthCheckAll();

  console.log('=== AI Models Health Check ===');
  console.log(`Total: ${health.totalModels}`);
  console.log(`Healthy: ${health.healthyModels}`);
  console.log(`Unhealthy: ${health.unhealthyModels}`);
  console.log('');

  health.models.forEach(model => {
    const status = model.healthy ? '✓' : '✗';
    console.log(`${status} ${model.provider}/${model.modelName} - ${model.responseTime || 'N/A'}ms`);
  });

  return health;
}

/**
 * 示例 7: 使用工具函数
 * Token 计数和成本估算
 */
function utilityFunctionsExample() {
  const TokenCounter = require('../lib/utils/tokenCounter');
  const CostCalculator = require('../lib/utils/costCalculator');

  // 估算 Token 数
  const text = '这是一篇很长的文章内容...';
  const tokens = TokenCounter.estimate(text, 'gpt-3.5-turbo');
  console.log(`Estimated tokens: ${tokens}`);

  // 估算成本
  const estimatedCost = CostCalculator.estimate(tokens, 'gpt-3.5-turbo');
  console.log(`Estimated cost: $${estimatedCost.toFixed(6)}`);

  // 转换为人民币
  const rmbCost = CostCalculator.toRMB(estimatedCost, 7.2);
  console.log(`Estimated cost (RMB): ¥${rmbCost.toFixed(4)}`);

  // 比较不同模型的成本
  const comparison = CostCalculator.compareModels(['gpt-3.5-turbo', 'gpt-4', 'gpt-4o-mini'], 1000);

  console.log('\n=== Model Cost Comparison (1000 tokens) ===');
  comparison.forEach(model => {
    console.log(`${model.model}: ${model.costFormatted}`);
  });
}

/**
 * 示例 8: 在 Service 中使用
 * 完整的 Service 示例
 */
class AIContentService {
  constructor(ctx) {
    this.ctx = ctx;
  }

  /**
   * 智能生成文章标题
   * @param content
   * @param options
   */
  async generateTitle(content, options = {}) {
    const { strategy = 'balanced', maxCost = null } = options;

    try {
      const { model, adapter } = await this.ctx.service.modelSelector.selectOptimalModel({
        taskType: 'title_generation',
        strategy,
        maxCost,
      });

      const result = await adapter.generateWithRetry(content, {
        model: model.modelName,
        maxTokens: 100,
        temperature: 0.8,
      });

      if (result.success) {
        await this.ctx.service.aiModelManager.recordModelUsage(model.id || model._id, {
          tokens: result.usage.totalTokens,
          cost: result.cost,
          responseTime: result.responseTime,
          success: true,
        });

        return {
          success: true,
          title: result.content,
          metadata: {
            provider: model.provider,
            model: model.modelName,
            cost: result.cost,
            responseTime: result.responseTime,
          },
        };
      }

      throw new Error(result.error);
    } catch (error) {
      this.ctx.logger.error('[AI] Generate title failed:', error);
      return {
        success: false,
        title: '未命名文章',
        error: error.message,
      };
    }
  }

  /**
   * 智能提取文章标签
   * @param content
   */
  async extractTags(content) {
    try {
      const { model, adapter } = await this.ctx.service.modelSelector.selectWithFallback({
        taskType: 'tag_extraction',
        strategy: 'cost_optimal',
        maxFallbackAttempts: 3,
      });

      const result = await adapter.generateWithRetry(content, {
        model: model.modelName,
        maxTokens: 50,
        temperature: 0.3,
      });

      if (result.success) {
        await this.ctx.service.aiModelManager.recordModelUsage(model.id || model._id, {
          tokens: result.usage.totalTokens,
          cost: result.cost,
          responseTime: result.responseTime,
          success: true,
        });

        const tags = result.content.split(',').map(tag => tag.trim());

        return {
          success: true,
          tags,
          metadata: {
            provider: model.provider,
            model: model.modelName,
            cost: result.cost,
          },
        };
      }

      throw new Error(result.error);
    } catch (error) {
      this.ctx.logger.error('[AI] Extract tags failed:', error);
      return {
        success: false,
        tags: [],
        error: error.message,
      };
    }
  }

  /**
   * 智能生成文章摘要
   * @param content
   * @param options
   */
  async generateSummary(content, options = {}) {
    const { maxLength = 200 } = options;

    try {
      const { model, adapter } = await this.ctx.service.modelSelector.selectOptimalModel({
        taskType: 'summary_generation',
        strategy: 'performance_optimal', // 摘要质量要求高，使用性能优先
      });

      const result = await adapter.generateWithRetry(content, {
        model: model.modelName,
        maxTokens: maxLength,
        temperature: 0.5,
        systemPrompt: '你是一个专业的摘要生成助手，擅长提取文章的核心内容。',
      });

      if (result.success) {
        await this.ctx.service.aiModelManager.recordModelUsage(model.id || model._id, {
          tokens: result.usage.totalTokens,
          cost: result.cost,
          responseTime: result.responseTime,
          success: true,
        });

        return {
          success: true,
          summary: result.content,
          metadata: {
            provider: model.provider,
            model: model.modelName,
            cost: result.cost,
          },
        };
      }

      throw new Error(result.error);
    } catch (error) {
      this.ctx.logger.error('[AI] Generate summary failed:', error);
      return {
        success: false,
        summary: '',
        error: error.message,
      };
    }
  }
}

// 导出示例函数
module.exports = {
  generateTitleExample,
  generateTitleWithFallback,
  extractTagsBatch,
  getRecommendedModelsExample,
  viewModelStatsExample,
  healthCheckExample,
  utilityFunctionsExample,
  AIContentService,
};
