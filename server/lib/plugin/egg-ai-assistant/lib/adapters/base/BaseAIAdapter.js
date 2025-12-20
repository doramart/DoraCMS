/**
 * AI 服务适配器基类
 * 定义统一的 AI 调用接口和通用功能
 * 所有具体的 AI 适配器（OpenAI/DeepSeek/Ollama）都继承此类
 */
'use strict';

class BaseAIAdapter {
  /**
   * 构造函数
   * @param {Object} app - Egg Application 实例
   * @param {Object} config - 适配器配置
   */
  constructor(app, config = {}) {
    this.app = app;
    this.config = config;
    this.logger = app.logger;

    // 基础配置
    this.provider = config.provider || 'unknown';
    this.apiKey = config.apiKey || '';
    this.apiEndpoint = config.apiEndpoint || '';
    this.timeout = config.timeout || 30000; // 默认 30 秒超时
    this.maxRetries = config.maxRetries || 3; // 默认重试 3 次
    this.retryDelay = config.retryDelay || 1000; // 默认重试延迟 1 秒

    // 运行时统计
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * 生成文本内容（核心方法，子类必须实现）
   * @param {String} prompt - 提示词
   * @param {Object} options - 生成选项
   * @return {Promise<Object>} 生成结果
   */
  async generate(prompt, options = {}) {
    throw new Error('Method generate() must be implemented by subclass');
  }

  /**
   * 生成文本内容（带重试机制）
   * @param {String} prompt - 提示词
   * @param {Object} options - 生成选项
   * @return {Promise<Object>} 生成结果
   */
  async generateWithRetry(prompt, options = {}) {
    const startTime = Date.now();
    let lastError = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        this.logger.debug(`[${this.provider}] Attempt ${attempt + 1}/${this.maxRetries} to generate content`);

        const result = await this.generate(prompt, options);

        // 更新统计信息
        const responseTime = Date.now() - startTime;
        this._updateStats(true, result.usage?.totalTokens || 0, result.cost || 0, responseTime);

        this.logger.info(`[${this.provider}] Generation successful in ${responseTime}ms`);

        return {
          success: true,
          content: result.content,
          usage: result.usage || {},
          cost: result.cost || 0,
          responseTime,
          metadata: {
            provider: this.provider,
            model: options.model || this.config.defaultModel,
            attempt: attempt + 1,
            ...result.metadata,
          },
        };
      } catch (error) {
        lastError = error;
        this.logger.warn(`[${this.provider}] Attempt ${attempt + 1} failed:`, error.message);

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries - 1) {
          await this._sleep(this.retryDelay * (attempt + 1)); // 递增延迟
        }
      }
    }

    // 所有重试都失败
    const responseTime = Date.now() - startTime;
    this._updateStats(false, 0, 0, responseTime);

    this.logger.error(`[${this.provider}] All retry attempts failed:`, lastError);

    return {
      success: false,
      error: lastError.message,
      errorCode: lastError.code || 'UNKNOWN_ERROR',
      responseTime,
      metadata: {
        provider: this.provider,
        attempts: this.maxRetries,
      },
    };
  }

  /**
   * 流式生成内容（可选实现）
   * @param {String} prompt - 提示词
   * @param {Object} options - 生成选项
   * @param {Function} onChunk - 数据块回调
   * @return {Promise<Object>} 生成结果
   */
  async generateStream(prompt, options = {}, onChunk) {
    throw new Error('Stream generation is not supported by this adapter');
  }

  /**
   * 计算 Token 数量（子类可覆盖以提供更精确的计算）
   * @param {String} text - 文本内容
   * @return {Number} Token 数量
   */
  estimateTokens(text) {
    // 简单估算：英文约 4 个字符 = 1 token，中文约 1.5 个字符 = 1 token
    const englishChars = (text.match(/[a-zA-Z0-9\s]/g) || []).length;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - englishChars - chineseChars;

    return Math.ceil(englishChars / 4 + chineseChars / 1.5 + otherChars / 3);
  }

  /**
   * 计算成本（子类应覆盖此方法提供精确计算）
   * @param {Object} usage - Token 使用情况
   * @param {String} model - 模型名称
   * @return {Number} 成本（美元）
   */
  calculateCost(usage, model) {
    // 默认成本计算（子类应该覆盖）
    const costPer1kTokens = this.config.costPer1kTokens || 0.002;
    const totalTokens = usage.totalTokens || 0;
    return (totalTokens / 1000) * costPer1kTokens;
  }

  /**
   * 验证 API Key 是否有效
   * @return {Promise<Boolean>} 是否有效
   */
  async validateApiKey() {
    if (!this.apiKey) {
      return false;
    }

    try {
      // 子类应该实现具体的验证逻辑
      await this.generate('test', { maxTokens: 5 });
      return true;
    } catch (error) {
      this.logger.warn(`[${this.provider}] API Key validation failed:`, error.message);
      return false;
    }
  }

  /**
   * 健康检查
   * @return {Promise<Object>} 健康状态
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.generate('ping', { maxTokens: 5 });
      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        provider: this.provider,
        responseTime,
        stats: this.getStats(),
      };
    } catch (error) {
      return {
        healthy: false,
        provider: this.provider,
        error: error.message,
        stats: this.getStats(),
      };
    }
  }

  /**
   * 获取统计信息
   * @return {Object} 统计数据
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalCalls > 0 ? (this.stats.successCalls / this.stats.totalCalls).toFixed(2) : 0,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * 更新统计信息
   * @param {Boolean} success - 是否成功
   * @param {Number} tokens - Token 数量
   * @param {Number} cost - 成本
   * @param {Number} responseTime - 响应时间
   * @private
   */
  _updateStats(success, tokens, cost, responseTime) {
    this.stats.totalCalls++;

    if (success) {
      this.stats.successCalls++;
      this.stats.totalTokens += tokens;
      this.stats.totalCost += cost;
    } else {
      this.stats.failedCalls++;
    }

    // 更新平均响应时间
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.totalCalls - 1) + responseTime) / this.stats.totalCalls;
  }

  /**
   * 睡眠指定毫秒数
   * @param {Number} ms - 毫秒数
   * @return {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 格式化错误信息
   * @param {Error} error - 错误对象
   * @return {Object} 格式化后的错误
   * @protected
   */
  _formatError(error) {
    return {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      status: error.status || error.statusCode,
      provider: this.provider,
    };
  }

  /**
   * 验证必需的配置项
   * @param {Array<String>} requiredFields - 必需字段列表
   * @throws {Error} 配置缺失时抛出错误
   * @protected
   */
  _validateConfig(requiredFields) {
    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`Missing required configuration: ${field}`);
      }
    }
  }

  /**
   * 构建请求头
   * @return {Object} 请求头
   * @protected
   */
  _buildHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': 'egg-ai-assistant/1.0.0',
    };
  }
}

module.exports = BaseAIAdapter;
