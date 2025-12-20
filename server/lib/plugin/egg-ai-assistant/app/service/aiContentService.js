/**
 * AI 内容服务
 * 提供统一的 AI 内容生成接口
 * 集成 PromptManager、ModelSelector 和 AI Adapters
 */
'use strict';

const Service = require('egg').Service;

class AIContentService extends Service {
  constructor(ctx) {
    super(ctx);

    // 缓存配置
    this.cachePrefix = 'ai_content:';
    this.cacheTTL = 3600; // 1 小时（秒）
  }

  /**
   * 生成文章标题
   * @param {String} content - 文章内容
   * @param {Object} options - 选项
   * @return {Promise<Object>} 生成结果
   */
  async generateTitle(content, options = {}) {
    const { style = null, keywords = null, language = 'zh-CN', useCache = true, strategy = 'balanced' } = options;

    try {
      const cacheKey = this._getCacheKey('title', content, options);

      // 使用统一缓存的 getOrSet 方法
      if (useCache) {
        const cached = await this.app.cache.get(cacheKey);
        if (cached) {
          this.logger.debug('[AIContent] Using cached title');
          return { ...cached, fromCache: true };
        }
      }

      // 生成逻辑
      const result = await this._generateTitle(content, { style, keywords, language, strategy });

      // 缓存结果
      if (useCache && result.success) {
        await this.app.cache.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error('[AIContent] generateTitle failed:', error);
      return this._handleError('title_generation', error, { content, ...options });
    }
  }

  /**
   * 生成标题的核心逻辑
   * @param content
   * @param root0
   * @param root0.style
   * @param root0.keywords
   * @param root0.language
   * @param root0.strategy
   * @private
   */
  async _generateTitle(content, { style, keywords, language, strategy }) {
    // 1. 渲染提示词
    const prompt = await this.service.promptManager.renderPrompt(
      'title_generation',
      {
        content: this._truncateContent(content, 2000),
        style,
        keywords,
      },
      { language }
    );

    // 2. 调用 AI
    const aiResult = await this._callAI(prompt, {
      taskType: 'title_generation',
      strategy,
      maxTokens: 100,
      temperature: 0.8,
    });

    if (!aiResult.success) {
      throw new Error(aiResult.error);
    }

    // 3. 构建结果
    return {
      success: true,
      title: aiResult.content.trim(),
      metadata: {
        provider: aiResult.metadata.provider,
        model: aiResult.metadata.model,
        cost: aiResult.cost,
        responseTime: aiResult.responseTime,
        language,
      },
    };
  }

  /**
   * 提取文章标签
   * @param {String} content - 文章内容
   * @param {Object} options - 选项
   * @return {Promise<Object>} 提取结果
   */
  async extractTags(content, options = {}) {
    const { maxTags = 8, category = null, language = 'zh-CN', useCache = true, strategy = 'cost_optimal' } = options;

    try {
      // 1. 检查缓存
      const cacheKey = this._getCacheKey('tags', content, options);
      if (useCache) {
        const cached = await this.app.cache.get(cacheKey);
        if (cached) {
          this.logger.debug('[AIContent] Using cached tags');
          return { ...cached, fromCache: true };
        }
      }

      // 2. 渲染提示词
      const prompt = await this.service.promptManager.renderPrompt(
        'tag_extraction',
        {
          content: this._truncateContent(content, 3000),
          maxTags,
          category,
        },
        { language }
      );

      // 3. 调用 AI
      const aiResult = await this._callAI(prompt, {
        taskType: 'tag_extraction',
        strategy,
        maxTokens: 100,
        temperature: 0.3,
      });

      if (!aiResult.success) {
        throw new Error(aiResult.error);
      }

      // 4. 解析标签
      const tags = aiResult.content
        .split(/[,，、]/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, maxTags);

      // 5. 构建结果
      const result = {
        success: true,
        tags,
        metadata: {
          provider: aiResult.metadata.provider,
          model: aiResult.metadata.model,
          cost: aiResult.cost,
          responseTime: aiResult.responseTime,
          language,
        },
      };

      // 6. 缓存结果
      if (useCache && result.success) {
        await this.app.cache.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error('[AIContent] extractTags failed:', error);
      return this._handleError('tag_extraction', error, { content, ...options });
    }
  }

  /**
   * 生成文章摘要
   * @param {String} content - 文章内容
   * @param {Object} options - 选项
   * @return {Promise<Object>} 生成结果
   */
  async generateSummary(content, options = {}) {
    const {
      maxLength = 200,
      style = null,
      language = 'zh-CN',
      useCache = true,
      strategy = 'performance_optimal',
    } = options;

    try {
      // 1. 检查缓存
      const cacheKey = this._getCacheKey('summary', content, options);
      if (useCache) {
        const cached = await this.app.cache.get(cacheKey);
        if (cached) {
          this.logger.debug('[AIContent] Using cached summary');
          return { ...cached, fromCache: true };
        }
      }

      // 2. 渲染提示词
      const prompt = await this.service.promptManager.renderPrompt(
        'summary_generation',
        {
          content: this._truncateContent(content, 4000),
          maxLength,
          style,
        },
        { language }
      );

      // 3. 调用 AI
      const aiResult = await this._callAI(prompt, {
        taskType: 'summary_generation',
        strategy,
        maxTokens: Math.ceil(maxLength / 1.5),
        temperature: 0.5,
      });

      if (!aiResult.success) {
        throw new Error(aiResult.error);
      }

      // 4. 构建结果
      const result = {
        success: true,
        summary: aiResult.content.trim(),
        metadata: {
          provider: aiResult.metadata.provider,
          model: aiResult.metadata.model,
          cost: aiResult.cost,
          responseTime: aiResult.responseTime,
          language,
        },
      };

      // 5. 缓存结果
      if (useCache && result.success) {
        await this.app.cache.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error('[AIContent] generateSummary failed:', error);
      return this._handleError('summary_generation', error, { content, ...options });
    }
  }

  /**
   * 提取 SEO 关键词
   * @param {String} content - 文章内容
   * @param {Object} options - 选项
   * @return {Promise<Object>} 提取结果
   */
  async extractKeywords(content, options = {}) {
    const {
      maxKeywords = 8,
      category = null,
      title = null,
      language = 'zh-CN',
      useCache = true,
      strategy = 'cost_optimal',
    } = options;

    try {
      // 1. 检查缓存
      const cacheKey = this._getCacheKey('keywords', content, options);
      if (useCache) {
        const cached = await this.app.cache.get(cacheKey);
        if (cached) {
          this.logger.debug('[AIContent] Using cached keywords');
          return { ...cached, fromCache: true };
        }
      }

      // 2. 渲染提示词
      const prompt = await this.service.promptManager.renderPrompt(
        'keyword_extraction',
        {
          content: this._truncateContent(content, 3000),
          maxKeywords,
          category,
          title,
        },
        { language }
      );

      // 3. 调用 AI
      const aiResult = await this._callAI(prompt, {
        taskType: 'keyword_extraction',
        strategy,
        maxTokens: 100,
        temperature: 0.3,
      });

      if (!aiResult.success) {
        throw new Error(aiResult.error);
      }

      // 4. 解析关键词
      const keywords = aiResult.content
        .split(/[,，、]/)
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0)
        .slice(0, maxKeywords);

      // 5. 构建结果
      const result = {
        success: true,
        keywords,
        metadata: {
          provider: aiResult.metadata.provider,
          model: aiResult.metadata.model,
          cost: aiResult.cost,
          responseTime: aiResult.responseTime,
          language,
        },
      };

      // 6. 缓存结果
      if (useCache && result.success) {
        await this.app.cache.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error('[AIContent] extractKeywords failed:', error);
      return this._handleError('keyword_extraction', error, { content, ...options });
    }
  }

  /**
   * 匹配文章分类
   * @param {String} content - 文章内容
   * @param {Array} categories - 可用分类列表
   * @param {Object} options - 选项
   * @return {Promise<Object>} 匹配结果
   */
  async matchCategory(content, categories, options = {}) {
    const { language = 'zh-CN', useCache = true, strategy = 'balanced' } = options;

    try {
      // 1. 检查缓存
      const cacheKey = this._getCacheKey('category', content, { categories, ...options });
      if (useCache) {
        const cached = await this.app.cache.get(cacheKey);
        if (cached) {
          this.logger.debug('[AIContent] Using cached category');
          return { ...cached, fromCache: true };
        }
      }

      // 2. 渲染提示词
      const prompt = await this.service.promptManager.renderPrompt(
        'category_matching',
        {
          content: this._truncateContent(content, 2000),
          categories,
        },
        { language }
      );

      // 3. 调用 AI
      const aiResult = await this._callAI(prompt, {
        taskType: 'category_matching',
        strategy,
        maxTokens: 50,
        temperature: 0.3,
      });

      if (!aiResult.success) {
        throw new Error(aiResult.error);
      }

      // 4. 解析分类
      const matchedCategories = aiResult.content
        .split(/[,，、]/)
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0);

      // 5. 构建结果
      const result = {
        success: true,
        categories: matchedCategories,
        metadata: {
          provider: aiResult.metadata.provider,
          model: aiResult.metadata.model,
          cost: aiResult.cost,
          responseTime: aiResult.responseTime,
          language,
        },
      };

      // 6. 缓存结果
      if (useCache) {
        await this.app.cache.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error('[AIContent] matchCategory failed:', error);
      return this._handleError('category_matching', error, { content, categories, ...options });
    }
  }

  /**
   * SEO 优化建议
   * @param {String} title - 文章标题
   * @param {String} content - 文章内容
   * @param {Object} options - 选项
   * @return {Promise<Object>} 优化建议
   */
  async optimizeSEO(title, content, options = {}) {
    const { keywords = null, language = 'zh-CN', useCache = true, strategy = 'balanced' } = options;

    try {
      // 1. 检查缓存
      const cacheKey = this._getCacheKey('seo', title + content, options);
      if (useCache) {
        const cached = await this.app.cache.get(cacheKey);
        if (cached) {
          this.logger.debug('[AIContent] Using cached SEO suggestions');
          return { ...cached, fromCache: true };
        }
      }

      // 2. 渲染提示词
      const prompt = await this.service.promptManager.renderPrompt(
        'seo_optimization',
        {
          title,
          content: this._truncateContent(content, 3000),
          keywords,
        },
        { language }
      );

      // 3. 调用 AI
      const aiResult = await this._callAI(prompt, {
        taskType: 'seo_optimization',
        strategy,
        maxTokens: 500,
        temperature: 0.5,
      });

      if (!aiResult.success) {
        throw new Error(aiResult.error);
      }

      // 4. 解析 JSON 结果（清理 markdown 代码块）
      let suggestions;
      try {
        suggestions = this._parseAIJsonResponse(aiResult.content);
      } catch (parseError) {
        this.logger.warn('[AIContent] Failed to parse SEO suggestions as JSON:', parseError.message);
        suggestions = { rawSuggestions: aiResult.content };
      }

      // 5. 规范化 SEO 建议格式
      const normalizedSuggestions = this._normalizeSEOSuggestions(suggestions);

      // 6. 构建结果
      const result = {
        success: true,
        suggestions: normalizedSuggestions,
        metadata: {
          provider: aiResult.metadata.provider,
          model: aiResult.metadata.model,
          cost: aiResult.cost,
          responseTime: aiResult.responseTime,
          language,
        },
      };

      // 7. 缓存结果
      if (useCache) {
        await this.app.cache.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error('[AIContent] optimizeSEO failed:', error);
      return this._handleError('seo_optimization', error, { title, content, ...options });
    }
  }

  /**
   * 检查内容质量
   * @param {String} title - 文章标题
   * @param {String} content - 文章内容
   * @param {Object} options - 选项
   * @return {Promise<Object>} 质量评估
   */
  async checkQuality(title, content, options = {}) {
    const { language = 'zh-CN', useCache = true, strategy = 'performance_optimal' } = options;

    try {
      // 1. 检查缓存
      const cacheKey = this._getCacheKey('quality', title + content, options);
      if (useCache) {
        const cached = await this.app.cache.get(cacheKey);
        if (cached) {
          this.logger.debug('[AIContent] Using cached quality check');
          return { ...cached, fromCache: true };
        }
      }

      // 2. 渲染提示词
      const prompt = await this.service.promptManager.renderPrompt(
        'content_quality_check',
        {
          title,
          content: this._truncateContent(content, 4000),
        },
        { language }
      );

      // 3. 调用 AI
      const aiResult = await this._callAI(prompt, {
        taskType: 'content_quality_check',
        strategy,
        maxTokens: 800,
        temperature: 0.3,
      });

      if (!aiResult.success) {
        throw new Error(aiResult.error);
      }

      // 4. 解析 JSON 结果（清理 markdown 代码块）
      let assessment;
      try {
        assessment = this._parseAIJsonResponse(aiResult.content);
      } catch (parseError) {
        this.logger.warn('[AIContent] Failed to parse quality assessment as JSON:', parseError.message);
        assessment = { rawAssessment: aiResult.content };
      }

      // 5. 构建结果
      const result = {
        success: true,
        assessment,
        metadata: {
          provider: aiResult.metadata.provider,
          model: aiResult.metadata.model,
          cost: aiResult.cost,
          responseTime: aiResult.responseTime,
          language,
        },
      };

      // 6. 缓存结果
      if (useCache) {
        await this.app.cache.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      this.logger.error('[AIContent] checkQuality failed:', error);
      return this._handleError('content_quality_check', error, { title, content, ...options });
    }
  }

  /**
   * 批量生成内容（标题、标签、摘要）
   * @param {String} content - 文章内容
   * @param {Object} options - 选项
   * @return {Promise<Object>} 批量生成结果
   */
  async generateBatch(content, options = {}) {
    const { language = 'zh-CN', strategy = 'balanced' } = options;

    try {
      this.logger.info('[AIContent] Starting batch content generation');

      const results = await Promise.allSettled([
        this.generateTitle(content, { language, strategy, ...options.title }),
        this.extractTags(content, { language, strategy, ...options.tags }),
        this.generateSummary(content, { language, strategy, ...options.summary }),
      ]);

      return {
        success: true,
        title:
          results[0].status === 'fulfilled' ? results[0].value : { success: false, error: results[0].reason?.message },
        tags:
          results[1].status === 'fulfilled' ? results[1].value : { success: false, error: results[1].reason?.message },
        summary:
          results[2].status === 'fulfilled' ? results[2].value : { success: false, error: results[2].reason?.message },
      };
    } catch (error) {
      this.logger.error('[AIContent] generateBatch failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 调用 AI（内部方法）
   * @param {String} prompt - 提示词
   * @param {Object} options - 选项
   * @return {Promise<Object>} AI 调用结果
   * @private
   */
  async _callAI(prompt, options = {}) {
    const { taskType, strategy = 'balanced', maxTokens = 500, temperature = 0.7 } = options;

    try {
      // 1. 选择最优模型
      const { model, adapter } = await this.service.modelSelector.selectWithFallback({
        taskType,
        strategy,
        maxFallbackAttempts: 3,
      });

      // 2. 调用 AI
      const result = await adapter.generateWithRetry(prompt, {
        model: model.modelName,
        maxTokens,
        temperature,
      });

      // 3. 记录统计
      if (result.success) {
        await this.service.aiModelManager.recordModelUsage(model.id || model._id, {
          tokens: result.usage.totalTokens,
          cost: result.cost,
          responseTime: result.responseTime,
          success: true,
        });
      }

      return result;
    } catch (error) {
      this.logger.error('[AIContent] _callAI failed:', error);
      throw error;
    }
  }

  /**
   * 截断内容到指定长度
   * @param {String} content - 内容
   * @param {Number} maxLength - 最大长度
   * @return {String} 截断后的内容
   * @private
   */
  _truncateContent(content, maxLength) {
    if (!content || content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  /**
   * 生成缓存键
   * @param {String} type - 类型
   * @param {String} content - 内容
   * @param {Object} options - 选项
   * @return {String} 缓存键
   * @private
   */
  _getCacheKey(type, content, options) {
    const crypto = require('crypto');
    const hash = crypto
      .createHash('md5')
      .update(content + JSON.stringify(options))
      .digest('hex');
    return `${this.cachePrefix}${type}:${hash}`;
  }

  /**
   * 解析 AI 返回的 JSON 响应（处理 markdown 代码块）
   * @param {String} content - AI 返回的内容
   * @return {Object} 解析后的 JSON 对象
   * @private
   */
  _parseAIJsonResponse(content) {
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content for JSON parsing');
    }

    // 清理 markdown 代码块标记
    let cleanedContent = content.trim();

    // 移除开头的 ```json 或 ```
    cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/i, '');

    // 移除结尾的 ```
    cleanedContent = cleanedContent.replace(/\n?```\s*$/i, '');

    // 再次 trim
    cleanedContent = cleanedContent.trim();

    // 尝试解析 JSON
    try {
      return JSON.parse(cleanedContent);
    } catch (error) {
      this.logger.error('[AIContent] JSON parse error after cleanup:', error);
      this.logger.debug('[AIContent] Cleaned content:', cleanedContent.substring(0, 500));
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  /**
   * 规范化 SEO 建议格式
   * 从 AI 返回的描述性文本中提取实际的值
   * @param {Object} suggestions - 原始建议对象
   * @return {Object} 规范化后的建议对象
   * @private
   */
  _normalizeSEOSuggestions(suggestions) {
    if (!suggestions || typeof suggestions !== 'object') {
      return {};
    }

    // 如果已经有规范化的字段，直接返回
    if (suggestions.keywords && suggestions.optimizedTitle && suggestions.optimizedDescription) {
      return suggestions;
    }

    const normalized = {
      keywords: [],
      optimizedTitle: '',
      optimizedDescription: '',
      score: 0,
      analysis: {},
    };

    // 提取关键词
    if (suggestions.keywords) {
      normalized.keywords = Array.isArray(suggestions.keywords)
        ? suggestions.keywords
        : suggestions.keywords
            .split(/[,，、]/)
            .map(k => k.trim())
            .filter(Boolean);
    } else if (suggestions.keywordDensity) {
      // 从关键词密度分析中提取关键词
      const keywordMatches = suggestions.keywordDensity.match(/['']([^'']+)['']/g);
      if (keywordMatches) {
        normalized.keywords = keywordMatches.map(k => k.replace(/['']/g, '').trim());
      }
    }

    // 提取优化后的标题
    if (suggestions.optimizedTitle) {
      normalized.optimizedTitle = suggestions.optimizedTitle;
    } else if (suggestions.titleSuggestion) {
      // 从标题建议中提取实际标题
      // 匹配模式如: "建议优化为：'标题内容'" 或 "建议优化为："标题内容""
      const titleMatch = suggestions.titleSuggestion.match(/[：:][''""]([^''""\n]+)[''""][。，,]?/);
      if (titleMatch && titleMatch[1]) {
        normalized.optimizedTitle = titleMatch[1].trim();
      }
    }

    // 提取优化后的描述
    if (suggestions.optimizedDescription) {
      normalized.optimizedDescription = suggestions.optimizedDescription;
    } else if (suggestions.metaDescription) {
      normalized.optimizedDescription = suggestions.metaDescription;
    }

    // 提取评分
    if (typeof suggestions.score === 'number') {
      normalized.score = suggestions.score;
    } else if (typeof suggestions.score === 'string') {
      normalized.score = parseInt(suggestions.score, 10) || 0;
    }

    // 保存原始分析数据
    normalized.analysis = {
      keywordDensity: suggestions.keywordDensity || '',
      titleSuggestion: suggestions.titleSuggestion || '',
      metaDescription: suggestions.metaDescription || '',
      linkSuggestions: suggestions.linkSuggestions || '',
      structureTips: suggestions.structureTips || '',
    };

    // 如果仍然没有提取到关键信息，保留原始数据
    if (!normalized.optimizedTitle && !normalized.optimizedDescription) {
      normalized.rawSuggestions = suggestions;
    }

    return normalized;
  }

  /**
   * 处理错误（降级策略）
   * @param {String} taskType - 任务类型
   * @param {Error} error - 错误
   * @param {Object} context - 上下文
   * @return {Object} 错误结果
   * @private
   */
  _handleError(taskType, error, context) {
    // 根据不同任务类型返回降级结果
    const fallbacks = {
      title_generation: {
        success: false,
        title: '未命名文章',
        error: error.message,
        fallback: true,
      },
      tag_extraction: {
        success: false,
        tags: [],
        error: error.message,
        fallback: true,
      },
      keyword_extraction: {
        success: false,
        keywords: [],
        error: error.message,
        fallback: true,
      },
      summary_generation: {
        success: false,
        summary: '',
        error: error.message,
        fallback: true,
      },
      category_matching: {
        success: false,
        categories: [],
        error: error.message,
        fallback: true,
      },
      seo_optimization: {
        success: false,
        suggestions: {},
        error: error.message,
        fallback: true,
      },
      content_quality_check: {
        success: false,
        assessment: {},
        error: error.message,
        fallback: true,
      },
    };

    return fallbacks[taskType] || { success: false, error: error.message, fallback: true };
  }

  /**
   * 清除缓存
   * @param {String} type - 类型（可选）
   */
  async clearCache(type = null) {
    if (type) {
      // 注意：UnifiedCache 暂不支持按前缀删除，这里记录日志
      this.logger.warn(`[AIContent] Partial cache clear not fully supported for type: ${type}`);
      // 如果需要按类型清除，需要在 UnifiedCache 中实现
    } else {
      await this.app.cache.clear();
      this.logger.info('[AIContent] All AI content cache cleared');
    }
  }

  /**
   * 获取缓存统计
   * @return {Object} 缓存统计
   */
  getCacheStats() {
    const info = this.app.cache.getInfo();
    return {
      type: info.type,
      ttl: this.cacheTTL,
      stats: info.stats,
    };
  }
}

module.exports = AIContentService;
