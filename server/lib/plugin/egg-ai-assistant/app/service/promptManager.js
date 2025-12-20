/**
 * 提示词管理服务
 * 负责提示词模板的加载、渲染、版本管理和 A/B 测试
 */
'use strict';

const Service = require('egg').Service;
const path = require('path');
const fs = require('fs');
const TemplateRenderer = require('../../lib/utils/templateRenderer');

class PromptManagerService extends Service {
  constructor(ctx) {
    super(ctx);

    // 缓存配置
    this.cachePrefix = 'prompt:';
    this.cacheTTL = 7200; // 2 小时（提示词变化较少，可以缓存更久）

    // A/B 测试配置（保留 Map，这是运行时配置，不是缓存）
    this.abTestConfig = new Map();
  }

  /**
   * 获取 Prompt Template Repository
   */
  get promptRepo() {
    return this.app.repositoryFactory.createRepository('PromptTemplate', this.ctx);
  }

  /**
   * 根据任务类型和语言获取提示词模板
   * @param {String} taskType - 任务类型
   * @param {String} language - 语言代码（默认 zh-CN）
   * @param {Object} options - 选项
   * @return {Promise<Object>} 提示词模板
   */
  async getPrompt(taskType, language = 'zh-CN', options = {}) {
    const { version = 'latest', useCache = true } = options;

    try {
      // 1. 生成缓存键
      const cacheKey = this._getCacheKey(taskType, language, version);

      // 2. 检查缓存
      if (useCache) {
        const cached = await this.app.cache.get(cacheKey);
        if (cached) {
          this.logger.debug(`[PromptManager] Using cached prompt: ${cacheKey}`);
          return cached;
        }
      }

      // 3. 从数据库查询
      let prompt = await this._findPromptInDatabase(taskType, language, version);

      // 4. 如果数据库中没有，尝试从内置模板加载
      if (!prompt) {
        this.logger.info('[PromptManager] Prompt not found in database, trying built-in templates');
        prompt = await this._loadBuiltInPrompt(taskType, language);

        // 如果找到内置模板，保存到数据库
        if (prompt) {
          await this._savePromptToDatabase(prompt);
        }
      }

      if (!prompt) {
        throw new Error(`Prompt template not found for taskType: ${taskType}, language: ${language}`);
      }

      // 5. 缓存提示词
      if (useCache) {
        await this.app.cache.set(cacheKey, prompt, this.cacheTTL);
      }

      return prompt;
    } catch (error) {
      this.logger.error('[PromptManager] getPrompt failed:', error);
      throw error;
    }
  }

  /**
   * 渲染提示词模板
   * @param {String} taskType - 任务类型
   * @param {Object} variables - 变量对象
   * @param {Object} options - 选项
   * @return {Promise<String>} 渲染后的提示词
   */
  async renderPrompt(taskType, variables = {}, options = {}) {
    const { language = 'zh-CN', version = 'latest', strict = false } = options;

    try {
      // 1. 获取提示词模板
      const prompt = await this.getPrompt(taskType, language, { version });

      // 2. 检查 A/B 测试
      const selectedTemplate = this._selectABTestTemplate(prompt, taskType);

      // 3. 渲染模板
      const rendered = TemplateRenderer.render(selectedTemplate.template, variables, { strict });

      // 4. 记录使用情况
      await this._recordPromptUsage(prompt.id || prompt._id, selectedTemplate.variant);

      this.logger.debug(`[PromptManager] Rendered prompt for ${taskType}:`, rendered.substring(0, 100));

      return rendered;
    } catch (error) {
      this.logger.error('[PromptManager] renderPrompt failed:', error);
      throw error;
    }
  }

  /**
   * 批量渲染提示词
   * @param {Array} tasks - 任务数组 [{taskType, variables, options}]
   * @return {Promise<Array>} 渲染结果数组
   */
  async renderPromptBatch(tasks) {
    const results = await Promise.all(
      tasks.map(async ({ taskType, variables, options }) => {
        try {
          const rendered = await this.renderPrompt(taskType, variables, options);
          return { success: true, taskType, rendered };
        } catch (error) {
          return { success: false, taskType, error: error.message };
        }
      })
    );

    return results;
  }

  /**
   * 创建新的提示词模板
   * @param {Object} promptData - 提示词数据
   * @return {Promise<Object>} 创建的提示词
   */
  async createPrompt(promptData) {
    try {
      // 验证模板语法
      const validation = TemplateRenderer.validate(promptData.template);
      if (!validation.valid) {
        throw new Error(`Invalid template syntax: ${validation.errors.join(', ')}`);
      }

      // 检查是否已存在
      const existing = await this._findPromptInDatabase(
        promptData.taskType,
        promptData.language,
        promptData.version || '1.0.0'
      );

      if (existing) {
        throw new Error(`Prompt already exists for taskType: ${promptData.taskType}, language: ${promptData.language}`);
      }

      // 创建提示词
      const prompt = await this.promptRepo.create({
        ...promptData,
        version: promptData.version || '1.0.0',
        isEnabled: promptData.isEnabled !== false, // 🔥 修复: 使用正确的字段名 isEnabled
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 清除相关缓存
      this._clearPromptCache(promptData.taskType, promptData.language);

      this.logger.info(`[PromptManager] Prompt created: ${promptData.taskType}/${promptData.language}`);

      return prompt;
    } catch (error) {
      this.logger.error('[PromptManager] createPrompt failed:', error);
      throw error;
    }
  }

  /**
   * 更新提示词模板
   * @param {String} id - 提示词 ID
   * @param {Object} updates - 更新数据
   * @return {Promise<Object>} 更新后的提示词
   */
  async updatePrompt(id, updates) {
    try {
      // 如果更新了模板，验证语法
      if (updates.template) {
        const validation = TemplateRenderer.validate(updates.template);
        if (!validation.valid) {
          throw new Error(`Invalid template syntax: ${validation.errors.join(', ')}`);
        }
      }

      const prompt = await this.promptRepo.update(id, {
        ...updates,
        updatedAt: new Date(),
      });

      // 清除相关缓存
      this._clearPromptCache(prompt.taskType, prompt.language);

      this.logger.info(`[PromptManager] Prompt updated: ${id}`);

      return prompt;
    } catch (error) {
      this.logger.error('[PromptManager] updatePrompt failed:', error);
      throw error;
    }
  }

  /**
   * 删除提示词模板
   * @param {String} id - 提示词 ID
   * @return {Promise<Boolean>} 是否删除成功
   */
  async deletePrompt(id) {
    try {
      const prompt = await this.promptRepo.findById(id);

      if (!prompt) {
        throw new Error(`Prompt not found: ${id}`);
      }

      await this.promptRepo.delete(id);

      // 清除相关缓存
      this._clearPromptCache(prompt.taskType, prompt.language);

      this.logger.info(`[PromptManager] Prompt deleted: ${id}`);

      return true;
    } catch (error) {
      this.logger.error('[PromptManager] deletePrompt failed:', error);
      throw error;
    }
  }

  /**
   * 获取所有任务类型
   * @return {Promise<Array>} 任务类型列表
   */
  async getTaskTypes() {
    try {
      const prompts = await this.promptRepo.find({ isPaging: '0' }, {});

      const taskTypes = new Set();
      prompts.forEach(prompt => {
        if (prompt.taskType) {
          taskTypes.add(prompt.taskType);
        }
      });

      return Array.from(taskTypes).sort();
    } catch (error) {
      this.logger.error('[PromptManager] getTaskTypes failed:', error);
      throw error;
    }
  }

  /**
   * 配置 A/B 测试
   * @param {String} taskType - 任务类型
   * @param {Object} config - A/B 测试配置
   * @return {void}
   */
  configureABTest(taskType, config) {
    this.abTestConfig.set(taskType, config);
    this.logger.info(`[PromptManager] A/B test configured for ${taskType}`);
  }

  /**
   * 获取提示词统计
   * @param {String} taskType - 任务类型（可选）
   * @return {Promise<Object>} 统计信息
   */
  async getPromptStats(taskType = null) {
    try {
      const filters = taskType ? { taskType: { $eq: taskType } } : {};

      const prompts = await this.promptRepo.find({ isPaging: '0' }, { filters });

      const stats = {
        totalPrompts: prompts.length,
        byTaskType: {},
        byLanguage: {},
        totalUsage: 0,
      };

      prompts.forEach(prompt => {
        // 按任务类型统计
        if (!stats.byTaskType[prompt.taskType]) {
          stats.byTaskType[prompt.taskType] = {
            count: 0,
            usage: 0,
            languages: new Set(),
          };
        }
        stats.byTaskType[prompt.taskType].count++;
        stats.byTaskType[prompt.taskType].usage += prompt.usageCount || 0;
        stats.byTaskType[prompt.taskType].languages.add(prompt.language);

        // 按语言统计
        if (!stats.byLanguage[prompt.language]) {
          stats.byLanguage[prompt.language] = {
            count: 0,
            usage: 0,
          };
        }
        stats.byLanguage[prompt.language].count++;
        stats.byLanguage[prompt.language].usage += prompt.usageCount || 0;

        // 总使用次数
        stats.totalUsage += prompt.usageCount || 0;
      });

      // 转换 Set 为 Array
      Object.keys(stats.byTaskType).forEach(key => {
        stats.byTaskType[key].languages = Array.from(stats.byTaskType[key].languages);
      });

      return stats;
    } catch (error) {
      this.logger.error('[PromptManager] getPromptStats failed:', error);
      throw error;
    }
  }

  /**
   * 清除缓存
   * @param {String} taskType - 任务类型（可选）
   * @param {String} language - 语言（可选）
   * @return {void}
   */
  async clearCache(taskType = null, language = null) {
    if (taskType || language) {
      // 注意：UnifiedCache 暂不支持按前缀删除
      this.logger.warn(
        `[PromptManager] Partial cache clear not fully supported for taskType: ${taskType}, language: ${language}`
      );
      // 如果需要按类型清除，需要在 UnifiedCache 中实现 deleteByPrefix
    } else {
      // 清除所有缓存
      await this.app.cache.clear();
      this.logger.info('[PromptManager] All prompt cache cleared');
    }
  }

  /**
   * 从数据库查找提示词
   * @param {String} taskType - 任务类型
   * @param {String} language - 语言
   * @param {String} version - 版本
   * @return {Promise<Object|null>} 提示词
   * @private
   */
  async _findPromptInDatabase(taskType, language, version) {
    try {
      const filters = {
        taskType: { $eq: taskType },
        language: { $eq: language },
        isEnabled: { $eq: true },
      };

      if (version && version !== 'latest') {
        filters.version = { $eq: version };
      }

      // 🔥 修复: findOne 的第一个参数应该直接是查询条件，不要包在 options.filters 里
      const result = await this.promptRepo.findOne(filters, {
        sort: [{ field: 'version', order: 'desc' }],
      });

      return result;
    } catch (error) {
      this.logger.error('[PromptManager] _findPromptInDatabase failed:', error);
      return null;
    }
  }

  /**
   * 从内置模板加载提示词
   * @param {String} taskType - 任务类型
   * @param {String} language - 语言
   * @return {Promise<Object|null>} 提示词
   * @private
   */
  async _loadBuiltInPrompt(taskType, language) {
    try {
      const configPath = path.join(__dirname, '../../config/prompts', `${taskType}.${language}.json`);

      if (!fs.existsSync(configPath)) {
        return null;
      }

      const promptData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      return {
        taskType,
        language,
        ...promptData,
        isBuiltIn: true,
      };
    } catch (error) {
      this.logger.warn(`[PromptManager] Failed to load built-in prompt: ${taskType}/${language}`);
      return null;
    }
  }

  /**
   * 保存提示词到数据库
   * @param {Object} promptData - 提示词数据
   * @return {Promise<Object>} 保存的提示词
   * @private
   */
  async _savePromptToDatabase(promptData) {
    try {
      const { isBuiltIn: _isBuiltIn, ...data } = promptData;

      return await this.promptRepo.create({
        ...data,
        version: data.version || '1.0.0',
        isEnabled: true, // 🔥 修复: 使用正确的字段名 isEnabled
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.warn('[PromptManager] Failed to save prompt to database:', error.message);
      return null;
    }
  }

  /**
   * 选择 A/B 测试模板
   * @param {Object} prompt - 提示词对象
   * @param {String} taskType - 任务类型
   * @return {Object} 选中的模板 {template, variant}
   * @private
   */
  _selectABTestTemplate(prompt, taskType) {
    const abConfig = this.abTestConfig.get(taskType);

    if (!abConfig || !abConfig.enabled || !prompt.variants || prompt.variants.length === 0) {
      return { template: prompt.template, variant: 'default' };
    }

    // 简单的随机分配策略
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const variant of prompt.variants) {
      cumulativeProbability += variant.probability || 0.5;
      if (random < cumulativeProbability) {
        return { template: variant.template, variant: variant.name };
      }
    }

    // 默认返回主模板
    return { template: prompt.template, variant: 'default' };
  }

  /**
   * 记录提示词使用情况
   * @param {String} id - 提示词 ID
   * @param {String} variant - 变体名称
   * @return {Promise<void>}
   * @private
   */
  async _recordPromptUsage(id, variant) {
    try {
      const prompt = await this.promptRepo.findById(id);

      if (!prompt) {
        return;
      }

      const usageCount = (prompt.usageCount || 0) + 1;

      await this.promptRepo.update(id, {
        usageCount,
        lastUsedAt: new Date(),
      });

      this.logger.debug(`[PromptManager] Usage recorded for prompt ${id}, variant: ${variant}`);
    } catch (error) {
      this.logger.warn('[PromptManager] Failed to record prompt usage:', error.message);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 获取缓存键
   * @param {String} taskType - 任务类型
   * @param {String} language - 语言
   * @param {String} version - 版本
   * @return {String} 缓存键
   * @private
   */
  _getCacheKey(taskType, language, version) {
    return `${this.cachePrefix}${taskType}:${language}:${version}`;
  }

  /**
   * 清除特定提示词的缓存
   * @param {String} taskType - 任务类型
   * @param {String} language - 语言
   * @return {Promise<void>}
   * @private
   */
  async _clearPromptCache(taskType, language) {
    try {
      // 清除 'latest' 版本的缓存（最常用）
      const latestKey = this._getCacheKey(taskType, language, 'latest');
      await this.app.cache.delete(latestKey);

      // 注意：由于 UnifiedCache 不支持按前缀批量删除，
      // 其他版本的缓存会通过 TTL 自动过期
      // 如需立即清除所有缓存，可调用 clearCache()

      this.logger.debug(`[PromptManager] Cleared cache for ${taskType}/${language}`);
    } catch (error) {
      this.logger.warn('[PromptManager] Failed to clear prompt cache:', error.message);
      // 不抛出错误，避免影响主流程
    }
  }
}

module.exports = PromptManagerService;
