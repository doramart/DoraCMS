/**
 * AI 成本计算工具
 * 根据不同模型和 Token 使用情况计算成本
 */
'use strict';

/**
 * 主流 AI 模型的定价（美元/1K tokens）
 * 数据更新时间：2024-10
 */
const MODEL_PRICING = {
  // OpenAI GPT-3.5
  'gpt-3.5-turbo': {
    input: 0.0015,
    output: 0.002,
  },
  'gpt-3.5-turbo-16k': {
    input: 0.003,
    output: 0.004,
  },

  // OpenAI GPT-4
  'gpt-4': {
    input: 0.03,
    output: 0.06,
  },
  'gpt-4-32k': {
    input: 0.06,
    output: 0.12,
  },
  'gpt-4-turbo': {
    input: 0.01,
    output: 0.03,
  },
  'gpt-4o': {
    input: 0.005,
    output: 0.015,
  },
  'gpt-4o-mini': {
    input: 0.00015,
    output: 0.0006,
  },

  // DeepSeek
  'deepseek-chat': {
    input: 0.0001,
    output: 0.0002,
  },
  'deepseek-coder': {
    input: 0.0001,
    output: 0.0002,
  },

  // Claude
  'claude-3-opus': {
    input: 0.015,
    output: 0.075,
  },
  'claude-3-sonnet': {
    input: 0.003,
    output: 0.015,
  },
  'claude-3-haiku': {
    input: 0.00025,
    output: 0.00125,
  },

  // Ollama（本地部署，无成本）
  ollama: {
    input: 0,
    output: 0,
  },
};

class CostCalculator {
  /**
   * 计算 AI 调用成本
   * @param {Object} usage - Token 使用情况
   * @param {Number} usage.promptTokens - 输入 Token 数
   * @param {Number} usage.completionTokens - 输出 Token 数
   * @param {Number} usage.totalTokens - 总 Token 数
   * @param {String} model - 模型名称
   * @return {Number} 成本（美元）
   */
  static calculate(usage, model) {
    if (!usage || !model) return 0;

    const pricing = this.getPricing(model);

    const inputCost = ((usage.promptTokens || 0) / 1000) * pricing.input;
    const outputCost = ((usage.completionTokens || 0) / 1000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * 获取模型定价
   * @param {String} model - 模型名称
   * @return {Object} 定价信息
   */
  static getPricing(model) {
    // 精确匹配
    if (MODEL_PRICING[model]) {
      return MODEL_PRICING[model];
    }

    // 模糊匹配
    const modelKey = Object.keys(MODEL_PRICING).find(key => model.includes(key));
    if (modelKey) {
      return MODEL_PRICING[modelKey];
    }

    // 默认使用 GPT-3.5 定价
    return MODEL_PRICING['gpt-3.5-turbo'];
  }

  /**
   * 估算成本（基于预估的 Token 数）
   * @param {Number} estimatedTokens - 估算的 Token 数
   * @param {String} model - 模型名称
   * @param {Number} inputOutputRatio - 输入输出比例（默认 3:1）
   * @return {Number} 估算成本（美元）
   */
  static estimate(estimatedTokens, model, inputOutputRatio = 3) {
    const pricing = this.getPricing(model);

    // 按比例分配输入输出 token
    const inputTokens = Math.floor((estimatedTokens * inputOutputRatio) / (inputOutputRatio + 1));
    const outputTokens = estimatedTokens - inputTokens;

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * 转换为人民币
   * @param {Number} usdCost - 美元成本
   * @param {Number} exchangeRate - 汇率（默认 7.2）
   * @return {Number} 人民币成本
   */
  static toRMB(usdCost, exchangeRate = 7.2) {
    return usdCost * exchangeRate;
  }

  /**
   * 格式化成本显示
   * @param {Number} cost - 成本（美元）
   * @param {String} currency - 货币类型（'USD' 或 'RMB'）
   * @return {String} 格式化后的成本字符串
   */
  static format(cost, currency = 'USD') {
    if (currency === 'RMB') {
      const rmb = this.toRMB(cost);
      return `¥${rmb.toFixed(4)}`;
    }

    return `$${cost.toFixed(6)}`;
  }

  /**
   * 获取模型的成本效益比（每美元可生成的 token 数）
   * @param {String} model - 模型名称
   * @return {Number} 成本效益比
   */
  static getCostEfficiency(model) {
    const pricing = this.getPricing(model);
    const avgCostPerToken = (pricing.input + pricing.output) / 2 / 1000;

    if (avgCostPerToken === 0) {
      return Infinity; // 本地模型，无成本
    }

    return 1 / avgCostPerToken;
  }

  /**
   * 比较多个模型的成本
   * @param {Array} models - 模型名称数组
   * @param {Number} estimatedTokens - 估算的 Token 数
   * @return {Array} 成本比较结果
   */
  static compareModels(models, estimatedTokens) {
    return models
      .map(model => {
        const cost = this.estimate(estimatedTokens, model);
        const efficiency = this.getCostEfficiency(model);

        return {
          model,
          cost,
          costFormatted: this.format(cost),
          efficiency,
          pricing: this.getPricing(model),
        };
      })
      .sort((a, b) => a.cost - b.cost); // 按成本从低到高排序
  }

  /**
   * 获取所有支持的模型定价信息
   * @return {Object} 定价信息
   */
  static getAllPricing() {
    return { ...MODEL_PRICING };
  }

  /**
   * 更新模型定价（用于运行时配置）
   * @param {String} model - 模型名称
   * @param {Object} pricing - 定价信息
   */
  static updatePricing(model, pricing) {
    MODEL_PRICING[model] = {
      input: pricing.input || 0,
      output: pricing.output || 0,
    };
  }
}

module.exports = CostCalculator;
