/**
 * AI 服务集成测试
 * 验证 AI 适配器、模型管理器、模型选择器的集成工作流程
 */
'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('AI Service Integration Test', () => {
  let ctx;
  let aiModelManager;
  let modelSelector;
  let testModelId;

  before(async () => {
    ctx = app.createAnonymousContext();
    aiModelManager = ctx.service.aiModelManager;
    modelSelector = ctx.service.modelSelector;
  });

  describe('AI Model Manager', () => {
    it('should create a test AI model', async () => {
      const modelData = {
        provider: 'openai',
        modelName: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo (Test)',
        description: '测试用 AI 模型',
        config: {
          apiKey: 'test-api-key',
          apiEndpoint: 'https://api.openai.com/v1',
          maxTokens: 2000,
          temperature: 0.7,
          timeout: 30000,
        },
        supportedTasks: ['title_generation', 'tag_extraction', 'summary_generation'],
        costPerRequest: 0.002,
        costPer1kTokens: 0.002,
        priority: 50,
        isEnabled: true,
        maxRetries: 2,
      };

      const model = await aiModelManager.createModel(modelData);

      assert(model);
      assert(model.id || model._id);
      assert.equal(model.provider, 'openai');
      assert.equal(model.modelName, 'gpt-3.5-turbo');

      testModelId = model.id || model._id;
    });

    it('should find model by provider and name', async () => {
      const model = await aiModelManager.findByProviderAndModel('openai', 'gpt-3.5-turbo');

      assert(model);
      assert.equal(model.provider, 'openai');
      assert.equal(model.modelName, 'gpt-3.5-turbo');
    });

    it('should get available models by task type', async () => {
      const models = await aiModelManager.getAvailableModels({
        taskType: 'title_generation',
      });

      assert(Array.isArray(models));
      assert(models.length > 0);

      const hasTestModel = models.some(m => m.provider === 'openai' && m.modelName === 'gpt-3.5-turbo');
      assert(hasTestModel, 'Test model should be in the list');
    });

    it('should update model statistics', async () => {
      const usageData = {
        tokens: 500,
        cost: 0.001,
        responseTime: 1200,
        success: true,
      };

      const updated = await aiModelManager.updateModelStats(testModelId, usageData);

      assert(updated);
      assert(updated.statistics);
      assert.equal(updated.statistics.totalCalls, 1);
      assert.equal(updated.statistics.totalTokens, 500);
      assert(updated.statistics.lastUsedAt);
    });

    it('should get model statistics', async () => {
      const stats = await aiModelManager.getModelStats(testModelId);

      assert(stats);
      assert.equal(stats.totalCalls, 1);
      assert.equal(stats.totalTokens, 500);
    });

    it('should get overall statistics', async () => {
      const stats = await aiModelManager.getOverallStats();

      assert(stats);
      assert(stats.totalModels >= 1);
      assert(stats.enabledModels >= 1);
      assert(stats.totalCalls >= 1);
      assert(stats.byProvider);
      assert(stats.byProvider.openai);
    });

    it('should toggle model enabled status', async () => {
      // 禁用模型
      let updated = await aiModelManager.toggleModel(testModelId, false);
      assert.equal(updated.isEnabled, false);

      // 重新启用
      updated = await aiModelManager.toggleModel(testModelId, true);
      assert.equal(updated.isEnabled, true);
    });
  });

  describe('Model Selector', () => {
    it('should select optimal model with balanced strategy', async () => {
      const result = await modelSelector.selectOptimalModel({
        taskType: 'title_generation',
        strategy: modelSelector.constructor.STRATEGIES.BALANCED,
      });

      assert(result);
      assert(result.model);
      assert(result.adapter);
      assert(result.model.supportedTasks.includes('title_generation'));
    });

    it('should select model with cost optimal strategy', async () => {
      const result = await modelSelector.selectOptimalModel({
        taskType: 'tag_extraction',
        strategy: modelSelector.constructor.STRATEGIES.COST_OPTIMAL,
      });

      assert(result);
      assert(result.model);
      assert(result.adapter);
      assert(result.metadata.strategy === 'cost_optimal');
    });

    it('should select model with priority strategy', async () => {
      const result = await modelSelector.selectOptimalModel({
        taskType: 'summary_generation',
        strategy: modelSelector.constructor.STRATEGIES.PRIORITY,
      });

      assert(result);
      assert(result.model);
      assert(result.adapter);
    });

    it('should get recommended models for task type', async () => {
      const recommendations = await modelSelector.getRecommendedModels('title_generation');

      assert(Array.isArray(recommendations));
      assert(recommendations.length > 0);
      assert(recommendations[0].score !== undefined);

      // 验证按分数排序
      if (recommendations.length > 1) {
        assert(recommendations[0].score >= recommendations[1].score);
      }
    });

    it('should compare multiple models', async () => {
      const models = await aiModelManager.getAvailableModels({ isEnabled: true });
      const modelIds = models.slice(0, 2).map(m => m.id || m._id);

      const comparison = await modelSelector.compareModels(modelIds);

      assert(Array.isArray(comparison));
      assert.equal(comparison.length, modelIds.length);
      assert(comparison[0].performanceScore !== undefined);
      assert(comparison[0].balancedScore !== undefined);
    });
  });

  describe('AI Adapter', () => {
    let testAdapter;

    before(async () => {
      const OpenAIAdapter = require('../../lib/adapters/openai/OpenAIAdapter');

      testAdapter = new OpenAIAdapter(app, {
        provider: 'openai',
        apiKey: 'test-key',
        apiEndpoint: 'https://api.openai.com/v1',
        defaultModel: 'gpt-3.5-turbo',
      });
    });

    it('should estimate tokens correctly', () => {
      const text = 'This is a test. 这是一个测试。';
      const tokens = testAdapter.estimateTokens(text);

      assert(tokens > 0);
      assert(typeof tokens === 'number');
    });

    it('should get adapter statistics', () => {
      const stats = testAdapter.getStats();

      assert(stats);
      assert(typeof stats.totalCalls === 'number');
      assert(typeof stats.successRate === 'number' || typeof stats.successRate === 'string');
    });

    it('should reset adapter statistics', () => {
      testAdapter.resetStats();
      const stats = testAdapter.getStats();

      assert.equal(stats.totalCalls, 0);
      assert.equal(stats.successCalls, 0);
      assert.equal(stats.failedCalls, 0);
    });
  });

  describe('Utility Functions', () => {
    it('should calculate tokens with TokenCounter', () => {
      const TokenCounter = require('../../lib/utils/tokenCounter');

      const text = 'Hello world! 你好世界！';
      const tokens = TokenCounter.estimate(text, 'gpt-3.5-turbo');

      assert(tokens > 0);
      assert(typeof tokens === 'number');
    });

    it('should estimate messages tokens', () => {
      const TokenCounter = require('../../lib/utils/tokenCounter');

      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' },
      ];

      const tokens = TokenCounter.estimateMessages(messages, 'gpt-3.5-turbo');

      assert(tokens > 0);
    });

    it('should truncate text to token limit', () => {
      const TokenCounter = require('../../lib/utils/tokenCounter');

      const longText = 'This is a very long text. '.repeat(100);
      const truncated = TokenCounter.truncateToTokens(longText, 50, 'gpt-3.5-turbo');

      assert(truncated.length < longText.length);
      assert(truncated.endsWith('...'));
    });

    it('should calculate cost with CostCalculator', () => {
      const CostCalculator = require('../../lib/utils/costCalculator');

      const usage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      };

      const cost = CostCalculator.calculate(usage, 'gpt-3.5-turbo');

      assert(cost > 0);
      assert(typeof cost === 'number');
    });

    it('should estimate cost', () => {
      const CostCalculator = require('../../lib/utils/costCalculator');

      const estimatedCost = CostCalculator.estimate(1000, 'gpt-3.5-turbo');

      assert(estimatedCost > 0);
    });

    it('should convert to RMB', () => {
      const CostCalculator = require('../../lib/utils/costCalculator');

      const usdCost = 0.01;
      const rmbCost = CostCalculator.toRMB(usdCost, 7.2);

      assert.equal(rmbCost, 0.072);
    });

    it('should compare models cost', () => {
      const CostCalculator = require('../../lib/utils/costCalculator');

      const models = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o-mini'];
      const comparison = CostCalculator.compareModels(models, 1000);

      assert(Array.isArray(comparison));
      assert.equal(comparison.length, 3);
      assert(comparison[0].cost <= comparison[comparison.length - 1].cost);
    });
  });

  describe('Cleanup', () => {
    it('should delete test model', async () => {
      if (testModelId) {
        const deleted = await aiModelManager.deleteModel(testModelId);
        assert(deleted === true);
      }
    });
  });
});
