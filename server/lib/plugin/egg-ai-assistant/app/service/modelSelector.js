/**
 * AI 模型选择服务
 * 负责根据任务类型、成本、性能等因素智能选择最优 AI 模型
 * 支持降级策略和负载均衡
 */
'use strict';

const Service = require('egg').Service;

/**
 * 模型选择策略
 */
const SELECTION_STRATEGIES = {
  COST_OPTIMAL: 'cost_optimal', // 成本优先
  PERFORMANCE_OPTIMAL: 'performance_optimal', // 性能优先
  BALANCED: 'balanced', // 平衡模式
  PRIORITY: 'priority', // 优先级模式
};

class ModelSelectorService extends Service {
  /**
   * 选择最优模型
   * @param {Object} options - 选择选项
   * @return {Promise<Object>} 选中的模型和适配器
   */
  async selectOptimalModel(options = {}) {
    const {
      taskType = null,
      provider = null,
      strategy = SELECTION_STRATEGIES.BALANCED,
      maxCost = null,
      minPerformance = null,
      excludeModels = [],
    } = options;

    try {
      // 获取可用模型列表
      const availableModels = await this.service.aiModelManager.getAvailableModels({
        taskType,
        provider,
        isEnabled: true,
      });

      if (availableModels.length === 0) {
        throw new Error('No available AI models found');
      }

      // 过滤排除的模型
      const candidateModels = availableModels.filter(model => !excludeModels.includes(model.id || model._id));

      if (candidateModels.length === 0) {
        throw new Error('All available models are excluded');
      }

      // 根据策略选择模型
      const selectedModel = this._selectByStrategy(candidateModels, strategy, {
        maxCost,
        minPerformance,
      });

      // 创建适配器
      const adapter = await this._createAdapter(selectedModel);

      this.logger.info(
        `[ModelSelector] Selected model: ${selectedModel.provider}/${selectedModel.modelName} (strategy: ${strategy})`
      );

      return {
        model: selectedModel,
        adapter,
        metadata: {
          strategy,
          candidatesCount: candidateModels.length,
        },
      };
    } catch (error) {
      this.logger.error('[ModelSelector] selectOptimalModel failed:', error);
      throw error;
    }
  }

  /**
   * 带降级的模型选择
   * @param {Object} options - 选择选项
   * @return {Promise<Object>} 选中的模型和适配器
   */
  async selectWithFallback(options = {}) {
    const { maxFallbackAttempts = 3 } = options;
    const excludeModels = [];
    let lastError = null;

    for (let attempt = 0; attempt < maxFallbackAttempts; attempt++) {
      try {
        const result = await this.selectOptimalModel({
          ...options,
          excludeModels,
        });

        // 验证模型是否可用
        const isHealthy = await this._checkModelHealth(result.adapter);

        if (isHealthy) {
          return result;
        }

        // 模型不健康，加入排除列表
        excludeModels.push(result.model.id || result.model._id);
        this.logger.warn(
          `[ModelSelector] Model ${result.model.provider}/${result.model.modelName} is unhealthy, trying fallback...`
        );
      } catch (error) {
        lastError = error;

        if (attempt < maxFallbackAttempts - 1) {
          this.logger.warn(`[ModelSelector] Fallback attempt ${attempt + 1} failed:`, error.message);
        }
      }
    }

    // 所有降级尝试都失败
    throw new Error(`All fallback attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * 根据策略选择模型
   * @param {Array} models - 候选模型列表
   * @param {String} strategy - 选择策略
   * @param {Object} constraints - 约束条件
   * @return {Object} 选中的模型
   * @private
   */
  _selectByStrategy(models, strategy, constraints = {}) {
    const { maxCost, minPerformance } = constraints;

    // 应用约束条件
    let filteredModels = models;

    if (maxCost !== null) {
      filteredModels = filteredModels.filter(model => (model.costPerRequest || 0) <= maxCost);
    }

    if (minPerformance !== null) {
      filteredModels = filteredModels.filter(model => {
        const successRate = model.statistics?.successRate || 1.0;
        return successRate >= minPerformance;
      });
    }

    if (filteredModels.length === 0) {
      // 约束太严格，回退到原始列表
      filteredModels = models;
      this.logger.warn('[ModelSelector] Constraints too strict, using all available models');
    }

    // 根据策略选择
    switch (strategy) {
      case SELECTION_STRATEGIES.COST_OPTIMAL:
        return this._selectByCost(filteredModels);

      case SELECTION_STRATEGIES.PERFORMANCE_OPTIMAL:
        return this._selectByPerformance(filteredModels);

      case SELECTION_STRATEGIES.PRIORITY:
        return this._selectByPriority(filteredModels);

      case SELECTION_STRATEGIES.BALANCED:
      default:
        return this._selectBalanced(filteredModels);
    }
  }

  /**
   * 按成本选择（最低成本）
   * @param {Array} models - 模型列表
   * @return {Object} 选中的模型
   * @private
   */
  _selectByCost(models) {
    return models.reduce((best, current) => {
      const bestCost = best.costPerRequest || Infinity;
      const currentCost = current.costPerRequest || Infinity;
      return currentCost < bestCost ? current : best;
    });
  }

  /**
   * 按性能选择（最高成功率 + 最快响应）
   * @param {Array} models - 模型列表
   * @return {Object} 选中的模型
   * @private
   */
  _selectByPerformance(models) {
    return models.reduce((best, current) => {
      const bestScore = this._calculatePerformanceScore(best);
      const currentScore = this._calculatePerformanceScore(current);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * 按优先级选择（最高优先级）
   * @param {Array} models - 模型列表
   * @return {Object} 选中的模型
   * @private
   */
  _selectByPriority(models) {
    return models.reduce((best, current) => {
      const bestPriority = best.priority || 0;
      const currentPriority = current.priority || 0;
      return currentPriority > bestPriority ? current : best;
    });
  }

  /**
   * 平衡选择（综合考虑成本、性能、优先级）
   * @param {Array} models - 模型列表
   * @return {Object} 选中的模型
   * @private
   */
  _selectBalanced(models) {
    return models.reduce((best, current) => {
      const bestScore = this._calculateBalancedScore(best);
      const currentScore = this._calculateBalancedScore(current);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * 计算性能分数
   * @param {Object} model - 模型
   * @return {Number} 性能分数
   * @private
   */
  _calculatePerformanceScore(model) {
    const stats = model.statistics || {};
    const successRate = stats.successRate || 1.0;
    const avgResponseTime = stats.averageResponseTime || 1000;

    // 成功率权重：70%，响应时间权重：30%
    const successScore = successRate * 0.7;
    const responseScore = (1 - Math.min(avgResponseTime / 10000, 1)) * 0.3;

    return successScore + responseScore;
  }

  /**
   * 计算平衡分数
   * @param {Object} model - 模型
   * @return {Number} 平衡分数
   * @private
   */
  _calculateBalancedScore(model) {
    const stats = model.statistics || {};
    const priority = model.priority || 10;
    const successRate = stats.successRate || 1.0;
    const cost = model.costPerRequest || 0.01;
    const avgResponseTime = stats.averageResponseTime || 1000;

    // 优先级：40%，成功率：30%，成本：20%，响应时间：10%
    const priorityScore = (priority / 100) * 0.4;
    const successScore = successRate * 0.3;
    const costScore = (1 - Math.min(cost / 0.1, 1)) * 0.2; // 假设 0.1 为高成本阈值
    const responseScore = (1 - Math.min(avgResponseTime / 10000, 1)) * 0.1;

    return priorityScore + successScore + costScore + responseScore;
  }

  /**
   * 检查模型健康状态
   * @param {Object} adapter - 适配器实例
   * @return {Promise<Boolean>} 是否健康
   * @private
   */
  async _checkModelHealth(adapter) {
    try {
      const health = await adapter.healthCheck();
      return health.healthy;
    } catch (error) {
      this.logger.error('[ModelSelector] Health check failed:', error);
      return false;
    }
  }

  /**
   * 创建 AI 适配器实例
   * @param {Object} model - 模型配置
   * @return {Object} 适配器实例
   * @private
   */
  async _createAdapter(model) {
    // 🔥 修复：获取不带掩码的模型配置用于创建适配器
    const modelConfig = await this.service.aiModelManager.getModelConfig(model.id || model._id, false);

    const adapterConfig = {
      provider: model.provider,
      apiKey: modelConfig.config?.apiKey,
      apiEndpoint: modelConfig.config?.apiEndpoint,
      defaultModel: model.modelName,
      maxTokens: modelConfig.config?.maxTokens,
      temperature: modelConfig.config?.temperature,
      timeout: modelConfig.config?.timeout,
      maxRetries: model.maxRetries || 2,
    };

    // 根据提供商创建对应的适配器
    switch (model.provider.toLowerCase()) {
      case 'openai': {
        const OpenAIAdapter = require('../../lib/adapters/openai/OpenAIAdapter');
        return new OpenAIAdapter(this.app, adapterConfig);
      }

      case 'deepseek': {
        const DeepSeekAdapter = require('../../lib/adapters/deepseek/DeepSeekAdapter');
        return new DeepSeekAdapter(this.app, adapterConfig);
      }

      case 'doubao': {
        const DoubaoAdapter = require('../../lib/adapters/doubao/DoubaoAdapter');
        return new DoubaoAdapter(this.app, adapterConfig);
      }

      // 未来可以添加其他适配器
      case 'ollama': {
        const OllamaAdapter = require('../../lib/adapters/ollama/OllamaAdapter');
        return new OllamaAdapter(this.app, adapterConfig);
      }

      default:
        throw new Error(`Unsupported AI provider: ${model.provider}`);
    }
  }

  /**
   * 获取推荐模型（基于历史数据）
   * @param {String} taskType - 任务类型
   * @return {Promise<Array>} 推荐模型列表
   */
  async getRecommendedModels(taskType) {
    try {
      const models = await this.service.aiModelManager.getAvailableModels({
        taskType,
        isEnabled: true,
      });

      // 按平衡分数排序
      const ranked = models
        .map(model => ({
          ...model,
          score: this._calculateBalancedScore(model),
        }))
        .sort((a, b) => b.score - a.score);

      return ranked.slice(0, 3); // 返回前 3 个推荐
    } catch (error) {
      this.logger.error('[ModelSelector] getRecommendedModels failed:', error);
      throw error;
    }
  }

  /**
   * 比较多个模型
   * @param {Array<String>} modelIds - 模型 ID 列表
   * @return {Promise<Array>} 比较结果
   */
  async compareModels(modelIds) {
    try {
      const models = await Promise.all(modelIds.map(id => this.service.aiModelManager.getModelById(id)));

      return models.map(model => ({
        id: model.id || model._id,
        provider: model.provider,
        modelName: model.modelName,
        displayName: model.displayName,
        costPerRequest: model.costPerRequest,
        priority: model.priority,
        statistics: model.statistics,
        performanceScore: this._calculatePerformanceScore(model),
        balancedScore: this._calculateBalancedScore(model),
      }));
    } catch (error) {
      this.logger.error('[ModelSelector] compareModels failed:', error);
      throw error;
    }
  }
}

// 导出选择策略常量
ModelSelectorService.STRATEGIES = SELECTION_STRATEGIES;

module.exports = ModelSelectorService;
