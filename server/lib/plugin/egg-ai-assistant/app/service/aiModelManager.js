/**
 * AI 模型管理服务
 * 负责 AI 模型的增删改查、配置管理、健康检查等
 */
'use strict';

const Service = require('egg').Service;

class AIModelManagerService extends Service {
  /**
   * 获取 AI Model Repository
   * 自动根据配置选择 MongoDB 或 MariaDB
   */
  get aiModelRepo() {
    return this.app.repositoryFactory.createRepository('AIModel', this.ctx);
  }

  /**
   * 获取加密工具实例
   */
  get encryption() {
    if (!this._encryption) {
      const Encryption = require('../../lib/utils/encryption');
      this._encryption = new Encryption(this.app);
    }
    return this._encryption;
  }

  /**
   * 获取所有可用的 AI 模型
   * @param {Object} options - 查询选项
   * @return {Promise<Array>} 模型列表
   */
  async getAvailableModels(options = {}) {
    try {
      const { taskType = null, provider = null, isEnabled = true } = options;

      const filters = {};

      if (isEnabled !== null) {
        filters.isEnabled = { $eq: isEnabled };
      }

      if (provider) {
        filters.provider = { $eq: provider };
      }

      // 如果指定了任务类型，过滤支持该任务的模型
      if (taskType) {
        if (this.app.config.repository.databaseType === 'mongodb') {
          filters.supportedTasks = { $elemMatch: { $eq: taskType } };
        } else {
          filters.supportedTasks = { $contains: taskType };
        }
      }

      const result = await this.aiModelRepo.find(
        { isPaging: '0' },
        {
          filters,
          populate: [], // 明确禁用关联查询，避免不必要的 JOIN
          sort: [
            { field: 'priority', order: 'desc' },
            { field: 'costPerRequest', order: 'asc' },
          ],
        }
      );

      return result;
    } catch (error) {
      this.logger.error('[AIModelManager] getAvailableModels failed:', error);
      throw error;
    }
  }

  /**
   * 根据提供商和模型名查找模型
   * @param {String} provider - 提供商
   * @param {String} modelName - 模型名称
   * @return {Promise<Object|null>} 模型信息
   */
  async findByProviderAndModel(provider, modelName) {
    try {
      // 🔥 修复：使用与 Repository 适配器一致的调用格式
      const result = await this.aiModelRepo.findOne(
        {
          provider: { $eq: provider },
          modelName: { $eq: modelName },
        },
        {
          populate: [], // 禁用关联查询，避免表别名问题
        }
      );

      return result;
    } catch (error) {
      this.logger.error('[AIModelManager] findByProviderAndModel failed:', error);
      throw error;
    }
  }

  /**
   * 根据 ID 获取模型
   * @param {String} id - 模型 ID
   * @return {Promise<Object|null>} 模型信息
   */
  async getModelById(id) {
    try {
      return await this.aiModelRepo.findById(id);
    } catch (error) {
      this.logger.error('[AIModelManager] getModelById failed:', error);
      throw error;
    }
  }

  /**
   * 创建新模型配置
   * @param {Object} modelData - 模型数据
   * @return {Promise<Object>} 创建的模型
   */
  async createModel(modelData) {
    try {
      // 验证必需字段
      this._validateModelData(modelData);

      // 检查是否已存在
      const existing = await this.findByProviderAndModel(modelData.provider, modelData.modelName);

      if (existing) {
        throw new Error(`Model ${modelData.provider}/${modelData.modelName} already exists`);
      }

      // 创建模型
      const model = await this.aiModelRepo.create(modelData);

      this.logger.info(`[AIModelManager] Model created: ${modelData.provider}/${modelData.modelName}`);

      return model;
    } catch (error) {
      this.logger.error('[AIModelManager] createModel failed:', error);
      throw error;
    }
  }

  /**
   * 更新模型配置
   * @param {String} id - 模型 ID
   * @param {Object} updates - 更新数据
   * @return {Promise<Object>} 更新后的模型
   */
  async updateModel(id, updates) {
    try {
      const model = await this.aiModelRepo.update(id, updates);

      this.logger.info(`[AIModelManager] Model updated: ${id}`);

      return model;
    } catch (error) {
      this.logger.error('[AIModelManager] updateModel failed:', error);
      throw error;
    }
  }

  /**
   * 删除模型
   * @param {String} id - 模型 ID
   * @return {Promise<Boolean>} 是否删除成功
   */
  async deleteModel(id) {
    try {
      await this.aiModelRepo.delete(id);

      this.logger.info(`[AIModelManager] Model deleted: ${id}`);

      return true;
    } catch (error) {
      this.logger.error('[AIModelManager] deleteModel failed:', error);
      throw error;
    }
  }

  /**
   * 启用/禁用模型
   * @param {String} id - 模型 ID
   * @param {Boolean} isEnabled - 是否启用
   * @return {Promise<Object>} 更新后的模型
   */
  async toggleModel(id, isEnabled) {
    try {
      return await this.updateModel(id, { isEnabled });
    } catch (error) {
      this.logger.error('[AIModelManager] toggleModel failed:', error);
      throw error;
    }
  }

  /**
   * 更新模型统计信息
   * @param {String} id - 模型 ID
   * @param {Object} usageData - 使用数据
   * @return {Promise<Object>} 更新后的模型
   */
  async updateModelStats(id, usageData) {
    try {
      const { tokens = 0, cost = 0, responseTime = 0, success = true } = usageData;

      const model = await this.aiModelRepo.findById(id);

      if (!model) {
        throw new Error(`Model not found: ${id}`);
      }

      // 计算新的统计数据
      const stats = model.statistics || {
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        successRate: 1.0,
        averageResponseTime: 0,
      };

      stats.totalCalls = (stats.totalCalls || 0) + 1;
      stats.totalTokens = (stats.totalTokens || 0) + tokens;
      stats.totalCost = (stats.totalCost || 0) + cost;
      stats.lastUsedAt = new Date();

      // 更新成功率
      const successCalls = Math.floor(stats.totalCalls * (stats.successRate || 1));
      const newSuccessCalls = success ? successCalls + 1 : successCalls;
      stats.successRate = newSuccessCalls / stats.totalCalls;

      // 更新平均响应时间
      stats.averageResponseTime =
        ((stats.averageResponseTime || 0) * (stats.totalCalls - 1) + responseTime) / stats.totalCalls;

      // 保存更新
      const updated = await this.aiModelRepo.update(id, { statistics: stats });

      this.logger.debug(`[AIModelManager] Model stats updated: ${id}`);

      return updated;
    } catch (error) {
      this.logger.error('[AIModelManager] updateModelStats failed:', error);
      // 不抛出错误，避免影响主流程
      return null;
    }
  }

  /**
   * 记录模型使用
   * @param {String} modelId - 模型 ID
   * @param {Object} usageData - 使用数据
   * @return {Promise<void>}
   */
  async recordModelUsage(modelId, usageData) {
    try {
      await this.updateModelStats(modelId, usageData);
    } catch (error) {
      this.logger.error('[AIModelManager] recordModelUsage failed:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 获取模型统计信息
   * @param {String} id - 模型 ID
   * @return {Promise<Object>} 统计信息
   */
  async getModelStats(id) {
    try {
      const model = await this.aiModelRepo.findById(id);

      if (!model) {
        throw new Error(`Model not found: ${id}`);
      }

      return model.statistics || {};
    } catch (error) {
      this.logger.error('[AIModelManager] getModelStats failed:', error);
      throw error;
    }
  }

  /**
   * 获取所有模型的统计汇总
   * @return {Promise<Object>} 统计汇总
   */
  async getOverallStats() {
    try {
      const models = await this.getAvailableModels({ isEnabled: null });

      const stats = {
        totalModels: models.length,
        enabledModels: 0,
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0,
        byProvider: {},
      };

      for (const model of models) {
        if (model.isEnabled) {
          stats.enabledModels++;
        }

        const modelStats = model.statistics || {};
        stats.totalCalls += modelStats.totalCalls || 0;
        stats.totalTokens += modelStats.totalTokens || 0;
        stats.totalCost += modelStats.totalCost || 0;

        // 按提供商统计
        if (!stats.byProvider[model.provider]) {
          stats.byProvider[model.provider] = {
            models: 0,
            calls: 0,
            tokens: 0,
            cost: 0,
          };
        }

        stats.byProvider[model.provider].models++;
        stats.byProvider[model.provider].calls += modelStats.totalCalls || 0;
        stats.byProvider[model.provider].tokens += modelStats.totalTokens || 0;
        stats.byProvider[model.provider].cost += modelStats.totalCost || 0;
      }

      return stats;
    } catch (error) {
      this.logger.error('[AIModelManager] getOverallStats failed:', error);
      throw error;
    }
  }

  /**
   * 健康检查所有模型
   * @return {Promise<Object>} 健康状态
   */
  async healthCheckAll() {
    try {
      const models = await this.getAvailableModels();
      const results = {
        totalModels: models.length,
        healthyModels: 0,
        unhealthyModels: 0,
        models: [],
      };

      for (const model of models) {
        try {
          // 创建适配器并执行健康检查
          const adapter = await this.createAdapter(model);
          const health = await adapter.healthCheck();

          results.models.push({
            id: model.id || model._id,
            provider: model.provider,
            modelName: model.modelName,
            healthy: health.healthy,
            responseTime: health.responseTime,
          });

          if (health.healthy) {
            results.healthyModels++;
          } else {
            results.unhealthyModels++;
          }
        } catch (error) {
          results.models.push({
            id: model.id || model._id,
            provider: model.provider,
            modelName: model.modelName,
            healthy: false,
            error: error.message,
          });
          results.unhealthyModels++;
        }
      }

      return results;
    } catch (error) {
      this.logger.error('[AIModelManager] healthCheckAll failed:', error);
      throw error;
    }
  }

  /**
   * 创建 AI 适配器实例
   * @param {Object} model - 模型配置
   * @return {Object} 适配器实例
   */
  async createAdapter(model) {
    // 🔥 修复：获取不带掩码的模型配置用于创建适配器
    const modelConfig = await this.getModelConfig(model.id || model._id, false);

    const adapterConfig = {
      provider: model.provider,
      apiKey: modelConfig.config?.apiKey,
      apiEndpoint: modelConfig.config?.apiEndpoint,
      defaultModel: model.modelName,
      maxTokens: modelConfig.config?.maxTokens,
      temperature: modelConfig.config?.temperature,
      timeout: modelConfig.config?.timeout,
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

      case 'ollama': {
        const OllamaAdapter = require('../../lib/adapters/ollama/OllamaAdapter');
        return new OllamaAdapter(this.app, adapterConfig);
      }

      case 'doubao': {
        const DoubaoAdapter = require('../../lib/adapters/doubao/DoubaoAdapter');
        return new DoubaoAdapter(this.app, adapterConfig);
      }

      default:
        throw new Error(`Unsupported AI provider: ${model.provider}`);
    }
  }

  /**
   * 验证模型数据
   * @param {Object} modelData - 模型数据
   * @throws {Error} 验证失败时抛出错误
   * @private
   */
  _validateModelData(modelData) {
    const requiredFields = ['provider', 'modelName', 'displayName'];

    for (const field of requiredFields) {
      if (!modelData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // 验证提供商
    const validProviders = ['openai', 'deepseek', 'ollama', 'claude', 'anthropic', 'doubao'];
    if (!validProviders.includes(modelData.provider.toLowerCase())) {
      throw new Error(`Invalid provider: ${modelData.provider}`);
    }
  }

  /**
   * 保存模型配置（加密 API Key）
   * @param {Object} modelData - 模型数据
   * @return {Promise<Object>} 保存的模型
   */
  async saveModelConfig(modelData) {
    try {
      // 验证模型数据
      this._validateModelData(modelData);

      // 如果有 API Key，进行加密
      if (modelData.config && modelData.config.apiKey) {
        // 如果不是已加密的格式，进行加密
        if (!this.encryption.isValidEncryptedFormat(modelData.config.apiKey)) {
          modelData.config.apiKey = this.encryption.encrypt(modelData.config.apiKey);
        }
      }

      // 如果有 ID，更新；否则创建
      if (modelData.id) {
        const { id, ...updates } = modelData;
        return await this.updateModel(id, updates);
      }

      return await this.createModel(modelData);
    } catch (error) {
      this.logger.error('[AIModelManager] saveModelConfig failed:', error);
      throw error;
    }
  }

  /**
   * 获取模型配置（掩码显示 API Key）
   * @param {String} id - 模型 ID
   * @param {Boolean} maskApiKey - 是否掩码显示 API Key（默认 true）
   * @return {Promise<Object>} 模型配置
   */
  async getModelConfig(id, maskApiKey = true) {
    try {
      const model = await this.aiModelRepo.findById(id);

      if (!model) {
        throw new Error(`Model not found: ${id}`);
      }

      // 处理 API Key（解密或掩码）
      if (model.config && model.config.apiKey) {
        // 先解密
        const decrypted = this.encryption.decrypt(model.config.apiKey);

        if (maskApiKey) {
          // 需要掩码时，对解密后的 API Key 进行掩码
          model.config.apiKey = this.encryption.mask(decrypted);
        } else {
          // 不需要掩码时，直接使用解密后的 API Key
          model.config.apiKey = decrypted;
        }
      }

      return model;
    } catch (error) {
      this.logger.error('[AIModelManager] getModelConfig failed:', error);
      throw error;
    }
  }

  /**
   * 获取实际配置（解密 API Key）
   * 用于实际调用 AI 服务时使用
   * @param {String} id - 模型 ID
   * @return {Promise<Object>} 模型配置（包含明文 API Key）
   */
  async getActualConfig(id) {
    try {
      const model = await this.aiModelRepo.findById(id);

      if (!model) {
        throw new Error(`Model not found: ${id}`);
      }

      // 配置优先级：数据库 > 环境变量 > 配置文件
      const config = { ...model.config };

      // 解密数据库中的 API Key
      if (config.apiKey) {
        config.apiKey = this.encryption.decrypt(config.apiKey);
      }

      // 如果数据库没有 API Key，尝试从环境变量获取
      if (!config.apiKey) {
        const envConfig = this._getEnvConfig(model.provider);
        if (envConfig.apiKey) {
          config.apiKey = envConfig.apiKey;
        }
      }

      // 如果还是没有，从默认配置获取
      if (!config.apiKey) {
        const defaultConfig = this.app.config.aiAssistant[model.provider.toLowerCase()];
        if (defaultConfig && defaultConfig.apiKey) {
          config.apiKey = defaultConfig.apiKey;
        }
      }

      return {
        ...model,
        config,
      };
    } catch (error) {
      this.logger.error('[AIModelManager] getActualConfig failed:', error);
      throw error;
    }
  }

  /**
   * 从环境变量获取配置
   * @param {String} provider - 提供商
   * @return {Object} 配置对象
   * @private
   */
  _getEnvConfig(provider) {
    const config = {};

    switch (provider.toLowerCase()) {
      case 'openai':
        config.apiKey = process.env.OPENAI_API_KEY;
        config.apiEndpoint = process.env.OPENAI_API_ENDPOINT;
        break;
      case 'deepseek':
        config.apiKey = process.env.DEEPSEEK_API_KEY;
        config.apiEndpoint = process.env.DEEPSEEK_API_ENDPOINT;
        break;
      case 'anthropic':
      case 'claude':
        config.apiKey = process.env.ANTHROPIC_API_KEY;
        config.apiEndpoint = process.env.ANTHROPIC_API_ENDPOINT;
        break;
      case 'ollama':
        config.apiEndpoint = process.env.OLLAMA_API_ENDPOINT || 'http://localhost:11434';
        break;
      case 'doubao':
        config.apiKey = process.env.DOUBAO_API_KEY || process.env.ARK_API_KEY;
        config.apiEndpoint = process.env.DOUBAO_API_ENDPOINT || process.env.ARK_API_ENDPOINT;
        break;
      default:
        break;
    }

    return config;
  }

  /**
   * 测试 API Key 是否有效
   * @param {String} provider - 提供商
   * @param {String} apiKey - API Key
   * @param {String} apiEndpoint - API 端点（可选）
   * @return {Promise<Boolean>} 是否有效
   */
  async testApiKey(provider, apiKey, apiEndpoint = null) {
    try {
      // 创建临时配置
      const tempConfig = {
        provider,
        apiKey,
        apiEndpoint: apiEndpoint || this._getDefaultEndpoint(provider),
        modelName: this._getDefaultModel(provider),
      };

      // 创建适配器
      const adapter = this._createAdapterFromConfig(tempConfig);

      // 执行健康检查
      const health = await adapter.healthCheck();

      return health.healthy;
    } catch (error) {
      this.logger.error('[AIModelManager] testApiKey failed:', error);
      return false;
    }
  }

  /**
   * 获取默认端点
   * @param {String} provider - 提供商
   * @return {String} 默认端点
   * @private
   */
  _getDefaultEndpoint(provider) {
    const endpoints = {
      openai: 'https://api.openai.com/v1',
      deepseek: 'https://api.deepseek.com/v1',
      anthropic: 'https://api.anthropic.com',
      claude: 'https://api.anthropic.com',
      ollama: 'http://localhost:11434',
      doubao: 'https://ark.cn-beijing.volces.com/api/v3',
    };

    return endpoints[provider.toLowerCase()] || '';
  }

  /**
   * 获取默认模型
   * @param {String} provider - 提供商
   * @return {String} 默认模型
   * @private
   */
  _getDefaultModel(provider) {
    const models = {
      openai: 'gpt-3.5-turbo',
      deepseek: 'deepseek-chat',
      anthropic: 'claude-3-haiku',
      claude: 'claude-3-haiku',
      ollama: 'qwen2:7b',
      doubao: 'doubao-seedream-4-0-250828',
    };

    return models[provider.toLowerCase()] || '';
  }

  /**
   * 从配置创建适配器
   * @param {Object} config - 配置
   * @return {Object} 适配器实例
   * @private
   */
  _createAdapterFromConfig(config) {
    const adapterConfig = {
      provider: config.provider,
      apiKey: config.apiKey,
      apiEndpoint: config.apiEndpoint,
      defaultModel: config.modelName,
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 30000,
    };

    // 根据提供商创建对应的适配器
    switch (config.provider.toLowerCase()) {
      case 'openai': {
        const OpenAIAdapter = require('../../lib/adapters/openai/OpenAIAdapter');
        return new OpenAIAdapter(this.app, adapterConfig);
      }

      case 'deepseek': {
        const DeepSeekAdapter = require('../../lib/adapters/deepseek/DeepSeekAdapter');
        return new DeepSeekAdapter(this.app, adapterConfig);
      }

      case 'ollama': {
        const OllamaAdapter = require('../../lib/adapters/ollama/OllamaAdapter');
        return new OllamaAdapter(this.app, adapterConfig);
      }

      case 'doubao': {
        const DoubaoAdapter = require('../../lib/adapters/doubao/DoubaoAdapter');
        return new DoubaoAdapter(this.app, adapterConfig);
      }

      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * 获取模型列表（支持分页和过滤）
   * @param {Object} options - 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async getModelList(options = {}) {
    try {
      const { page = 1, pageSize = 20, filters = {}, maskApiKey = true } = options;

      const result = await this.aiModelRepo.find(
        {
          isPaging: '1',
          page: page.toString(),
          pageSize: pageSize.toString(),
        },
        {
          filters,
          populate: [], // 🔥 修复：禁用关联查询，避免表别名问题
          sort: [
            { field: 'priority', order: 'desc' },
            { field: 'createdAt', order: 'desc' },
          ],
        }
      );

      // 掩码 API Key
      if (maskApiKey && result.docs) {
        result.docs = result.docs.map(model => {
          if (model.config && model.config.apiKey) {
            const decrypted = this.encryption.decrypt(model.config.apiKey);
            model.config.apiKey = this.encryption.mask(decrypted);
          }
          return model;
        });
      }

      return result;
    } catch (error) {
      this.logger.error('[AIModelManager] getModelList failed:', error);
      throw error;
    }
  }
}

module.exports = AIModelManagerService;
