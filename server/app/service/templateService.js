/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Description: 模板服务 - 为模板标签提供统一的数据获取服务
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 */

'use strict';

const Service = require('egg').Service;
const _ = require('lodash');

class TemplateService extends Service {
  constructor(ctx) {
    super(ctx);

    // 增强的缓存策略配置
    this.cacheConfig = {
      content: {
        recommend: {
          ttl: 600,
          key: 'template:content:recommend',
          preload: true,
          priority: 'high',
          warmupInterval: 300, // 5分钟预热一次
          emptyTtl: 10, // 空数据短缓存，避免启动期空缓存长时间驻留
          refreshOnEmpty: true,
          minItems: 1,
        },
        hot: {
          ttl: 300,
          key: 'template:content:hot',
          preload: true,
          priority: 'high',
          warmupInterval: 150, // 2.5分钟预热一次
          emptyTtl: 10,
          refreshOnEmpty: true,
          minItems: 1,
        },
        news: {
          ttl: 180,
          key: 'template:content:news',
          preload: true,
          priority: 'high',
          warmupInterval: 90, // 1.5分钟预热一次
          emptyTtl: 10,
          refreshOnEmpty: true,
          minItems: 1,
        },
        random: {
          ttl: 60,
          key: 'template:content:random',
          preload: false, // 随机内容不需要预热
          priority: 'low',
        },
        nearpost: {
          ttl: 1800,
          key: 'template:content:nearpost',
          preload: false, // 个性化内容不预热
          priority: 'medium',
        },
        nearby: {
          ttl: 1800,
          key: 'template:content:nearby',
          preload: false,
          priority: 'medium',
        },
      },
      taxonomy: {
        navtree: {
          ttl: 3600,
          key: 'template:category:tree',
          preload: true,
          priority: 'critical', // 导航是关键数据
          warmupInterval: 1800, // 30分钟预热一次
        },
        categoryTree: {
          ttl: 3600,
          key: 'template:category:tree',
          preload: true,
          priority: 'critical',
          warmupInterval: 1800,
        },
        tags: {
          ttl: 1800,
          key: 'template:tags:list',
          preload: true,
          priority: 'medium',
          warmupInterval: 900, // 15分钟预热一次
        },
        hottags: {
          ttl: 600,
          key: 'template:tags:hot',
          preload: true,
          priority: 'high',
          warmupInterval: 300, // 5分钟预热一次
        },
        childnav: {
          ttl: 1800,
          key: 'template:category:children',
          preload: false,
          priority: 'medium',
        },
        categoryStats: {
          ttl: 600,
          key: 'template:category:stats',
          preload: true,
          priority: 'medium',
          warmupInterval: 300,
        },
      },
      ads: {
        default: {
          ttl: 1800,
          key: 'template:ads',
          preload: false,
          priority: 'low',
        },
      },
    };

    // 初始化全局缓存统计（如果不存在）
    this._initGlobalCacheStats();

    // 预热状态
    this.isWarmingUp = false;
    this.warmupQueue = new Map();

    // 后台刷新队列
    this.refreshQueue = new Set();
  }

  /**
   * 初始化全局缓存统计
   * @private
   */
  _initGlobalCacheStats() {
    if (!this.app._templateServiceCacheStats) {
      this.app._templateServiceCacheStats = {
        hits: 0,
        misses: 0,
        errors: 0,
        totalRequests: 0,
        avgResponseTime: 0,
        lastResetTime: Date.now(),
      };
    }
  }

  /**
   * 获取全局缓存统计对象
   * @return {Object} 全局缓存统计
   * @private
   */
  get _globalCacheStats() {
    return this.app._templateServiceCacheStats;
  }

  /**
   * 获取内容数据 - 统一入口（增强版）
   * @param {String} actionType 操作类型
   * @param {Object} args 参数
   * @return {Promise<*>} 数据结果
   */
  async fetchContent(actionType, args = {}) {
    const startTime = Date.now();
    this._globalCacheStats.totalRequests++;

    try {
      const cacheConfig = this._getCacheConfig(actionType);
      if (!cacheConfig) {
        throw new Error(`No cache config for action: ${actionType}`);
      }

      const cacheKey = this._buildCacheKey(cacheConfig.key, args);
      // 1. 尝试从缓存获取
      const cachedResult = await this._getFromCache(cacheKey);
      if (cachedResult !== null) {
        this._globalCacheStats.hits++;
        this._recordResponseTime(startTime);

        // 空数据快速刷新，避免启动期空缓存长时间停留
        if (this._isEmptyResult(cachedResult) && cacheConfig.refreshOnEmpty) {
          this._refreshCacheAsync(cacheKey, cacheConfig, actionType, args, 'empty-cache');
        }

        // 异步检查是否需要后台更新
        this._checkBackgroundRefresh(cacheKey, cacheConfig, actionType, args);

        return cachedResult;
      }

      // 2. 缓存未命中，从数据源获取
      this._globalCacheStats.misses++;
      const result = await this._fetchFromDataSource(actionType, args);

      // 3. 写入缓存（空数据采用短 TTL 或跳过缓存）
      const cacheDecision = this._getCacheDecision(result, cacheConfig);
      if (cacheDecision.shouldCache) {
        await this._setCache(cacheKey, result, cacheDecision.ttl);
      } else {
        this.ctx.logger.debug(`[TemplateService] Skip caching empty result: ${cacheKey}`);
      }

      // 4. 记录性能指标
      this._recordResponseTime(startTime);

      return result || [];
    } catch (error) {
      this._globalCacheStats.errors++;
      this._recordResponseTime(startTime);
      this.ctx.logger.error(`[TemplateService] ${actionType} failed:`, error);
      return [];
    }
  }

  /**
   * 从数据源获取数据
   * @param {String} actionType 操作类型
   * @param {Object} args 参数
   * @return {Promise<*>} 数据结果
   */
  async _fetchFromDataSource(actionType, args = {}) {
    let result;

    switch (actionType) {
      case 'recommend':
      case 'hot':
      case 'news':
      case 'random':
      case 'nearpost':
      case 'nearby':
        result = await this._fetchContentData(actionType, args);
        break;

      case 'tags':
      case 'hottags':
      case 'hotTags':
        result = await this._fetchTagData(actionType, args);
        break;

      case 'navtree':
      case 'childnav':
      case 'categoryTree':
      case 'categoryStats':
        result = await this._fetchCategoryData(actionType, args);
        break;

      case 'ads':
        result = await this._fetchAdsData(args);
        break;

      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }

    return result;
  }

  /**
   * 获取内容数据
   * @param {String} actionType 操作类型
   * @param {Object} args 参数
   * @return {Promise<*>} 内容数据
   * @private
   */
  async _fetchContentData(actionType, args) {
    const query = this._buildContentQuery(actionType, args);
    const userInfo = this.ctx.session.user || {};

    switch (actionType) {
      case 'recommend':
      case 'hot':
      case 'news':
        return await this.ctx.service.content.getContentList(query, userInfo);

      case 'random':
        return await this._getRandomContent(args);

      case 'nearpost':
        return await this._getPrevNextPosts(args);

      case 'nearby':
        return await this._getNearbyContent(args);

      default:
        throw new Error(`Unsupported content action: ${actionType}`);
    }
  }

  /**
   * 获取标签数据
   * @param {String} actionType 操作类型
   * @param {Object} args 参数
   * @return {Promise<*>} 标签数据
   * @private
   */
  async _fetchTagData(actionType, args) {
    switch (actionType) {
      case 'tags':
        return await this._getTagList(args);

      case 'hottags':
      case 'hotTags':
        return await this._getHotTags(args);

      default:
        throw new Error(`Unsupported tag action: ${actionType}`);
    }
  }

  /**
   * 获取分类数据
   * @param {String} actionType 操作类型
   * @param {Object} args 参数
   * @return {Promise<*>} 分类数据
   * @private
   */
  async _fetchCategoryData(actionType, args) {
    switch (actionType) {
      case 'navtree':
      case 'categoryTree':
        return await this._getCategoryTree(args);

      case 'childnav':
        return await this._getChildCategories(args);

      case 'categoryStats':
        return await this._getCategoryStats(args);

      default:
        throw new Error(`Unsupported category action: ${actionType}`);
    }
  }

  /**
   * 获取广告数据
   * @param {Object} args 参数
   * @return {Promise<*>} 广告数据
   * @private
   */
  async _fetchAdsData(args) {
    if (!args.name) {
      throw new Error('Ads name is required');
    }

    return await this.ctx.service.ads.getAdsByNameForTemplate(args.name);
  }

  /**
   * 构建内容查询参数
   * @param {String} actionType 操作类型
   * @param {Object} args 参数
   * @return {Object} 查询参数
   * @private
   */
  _buildContentQuery(actionType, args) {
    const baseQuery = {
      typeId: args.typeId,
      pageSize: args.pageSize || 10,
      current: 1,
      isPaging: args.isPaging || '0',
    };

    switch (actionType) {
      case 'recommend':
        return { ...baseQuery, model: '1' };

      case 'hot':
        return { ...baseQuery, sortby: '1' };

      case 'news':
        return { ...baseQuery };

      default:
        return baseQuery;
    }
  }


  /**
   * 获取随机内容 - 兼容MongoDB和MariaDB
   * @param {Object} args 参数
   * @return {Promise<*>} 随机内容
   * @private
   */
  async _getRandomContent(args) {
    // 构建查询参数，使用兼容的方式
    const baseFilters = {
      state: '2', // 已发布状态
      draft: '0',
    };

    if (args.typeId) {
      baseFilters.categories = args.typeId;
    }

    const options = {
      filters: baseFilters,
      sort: [{ field: 'createdAt', order: 'desc' }],
      fields: getContentListFields('simple').split(' ').filter(Boolean),
    };

    // 使用兼容的Service方法
    const result = await this.ctx.service.content.find({ isPaging: '0' }, options);

    // 获取数据数组
    const allContent = Array.isArray(result) ? result : result.docs || [];

    // 随机排序并取指定数量
    const shuffled = _.shuffle(allContent);
    const pageSize = parseInt(args.pageSize) || 5;

    return shuffled.slice(0, pageSize);
  }

  /**
   * 获取相关内容 - 兼容MongoDB和MariaDB
   * @param {Object} args 参数
   * @return {Promise<*>} 相关内容
   * @private
   */
  async _getNearbyContent(args) {
    if (!args.id) {
      return [];
    }

    // 获取当前内容
    const currentContent = await this.ctx.service.content.findOne({
      id: args.id,
    });

    if (!currentContent) {
      return [];
    }

    const query = {
      pageSize: args.pageSize || 5,
      current: 1,
    };

    // 构建查询参数，使用兼容的方式
    const baseFilters = {
      state: '2', // 已发布状态
      draft: '0',
    };

    // 如果有分类信息，按分类查找相关内容
    if (currentContent.categories && currentContent.categories.length > 0) {
      // 使用第一个分类作为查询条件
      baseFilters.categories = Array.isArray(currentContent.categories)
        ? currentContent.categories[0]
        : currentContent.categories;
    }

    const options = {
      filters: baseFilters,
      sort: [{ field: 'createdAt', order: 'desc' }],
      fields: getContentListFields('simple').split(' ').filter(Boolean),
    };

    const result = await this.ctx.service.content.find(query, options);

    // 获取数据数组并排除当前文章
    const allContent = Array.isArray(result) ? result : result.docs || [];
    const relatedContent = allContent.filter(item => item.id !== args.id);

    return relatedContent;
  }

  /**
   * 获取上一篇和下一篇文章
   * @param {Object} args 参数 { id: 当前文章ID, typeId?: 分类ID }
   * @return {Promise<{prePost: Object|null, nextPost: Object|null}>} 上一篇和下一篇文章
   * @private
   */
  async _getPrevNextPosts(args) {
    if (!args.id) {
      return { prePost: null, nextPost: null };
    }

    try {
      // 获取当前内容
      const currentContent = await this.ctx.service.content.findOne({
        id: args.id,
      });

      if (!currentContent) {
        return { prePost: null, nextPost: null };
      }

      // 构建基础查询条件
      const baseFilters = {
        state: '2', // 已发布状态
        draft: '0',
      };

      const baseQuery = {
        pageSize: 1,
        current: 1,
      };

      // 如果指定了分类或当前文章有分类，按分类查找
      if (args.typeId || (currentContent.categories && currentContent.categories.length > 0)) {
        baseFilters.categories =
          args.typeId ||
          (Array.isArray(currentContent.categories) ? currentContent.categories[0].id : currentContent.categories?.id);
      }

      const options = {
        filters: baseFilters,
        fields: getContentListFields('simple').split(' ').filter(Boolean),
      };

      // 获取上一篇文章 (发布时间早于当前文章的最新一篇)
      const prevQuery = {
        ...baseQuery,
        createdAt: { $lt: currentContent.createdAt }, // 时间小于当前文章
      };

      const prevOptions = {
        ...options,
        sort: [{ field: 'createdAt', order: 'desc' }], // 按时间降序，取最新的一篇
      };

      // 获取下一篇文章 (发布时间晚于当前文章的最早一篇)
      const nextQuery = {
        ...baseQuery,
        createdAt: { $gt: currentContent.createdAt }, // 时间大于当前文章
      };

      const nextOptions = {
        ...options,
        sort: [{ field: 'createdAt', order: 'asc' }], // 按时间升序，取最早的一篇
      };

      // 并行查询上一篇和下一篇
      const [prevResult, nextResult] = await Promise.all([
        this.ctx.service.content.find(prevQuery, prevOptions),
        this.ctx.service.content.find(nextQuery, nextOptions),
      ]);

      // 处理查询结果
      const prevArray = Array.isArray(prevResult) ? prevResult : prevResult.docs || [];
      const nextArray = Array.isArray(nextResult) ? nextResult : nextResult.docs || [];

      const prePost = prevArray.length > 0 ? prevArray[0] : null;
      const nextPost = nextArray.length > 0 ? nextArray[0] : null;

      return {
        prePost,
        nextPost,
      };
    } catch (error) {
      this.ctx.logger.error('获取上下篇文章失败:', error);
      return { prePost: null, nextPost: null };
    }
  }

  /**
   * 获取标签列表
   * @param {Object} args 参数
   * @return {Promise<*>} 标签列表
   * @private
   */
  async _getTagList(args) {
    return await this.ctx.service.contentTag.getTagsForTemplate(args);
  }

  /**
   * 获取热门标签
   * @param {Object} args 参数
   * @return {Promise<*>} 热门标签
   * @private
   */
  async _getHotTags(args) {
    return await this.ctx.service.contentTag.getHotTagsForTemplate(args);
  }

  /**
   * 获取分类树
   * @param {Object} args 参数
   * @return {Promise<*>} 分类树
   * @private
   */
  async _getCategoryTree(args) {
    return await this.ctx.service.contentCategory.getCategoryTreeForTemplate(args);
  }

  /**
   * 获取子分类
   * @param {Object} args 参数
   * @return {Promise<*>} 子分类列表
   * @private
   */
  async _getChildCategories(args) {
    return await this.ctx.service.contentCategory.getChildCategoriesForTemplate(args);
  }

  /**
   * 获取分类统计信息
   * @param {Object} args 参数
   * @return {Promise<*>} 分类统计信息
   * @private
   */
  async _getCategoryStats(args) {
    return await this.ctx.service.contentCategory.getCategoryStatsForTemplate(args);
  }

  /**
   * 构建缓存键
   * @param {String} prefix 前缀
   * @param {Object} args 参数
   * @return {String} 缓存键
   * @private
   */
  _buildCacheKey(prefix, args) {
    const keyParts = [prefix];

    // 添加关键参数到缓存键
    if (args.typeId) keyParts.push(`type:${args.typeId}`);
    if (args.pageSize) keyParts.push(`size:${args.pageSize}`);
    if (args.name) keyParts.push(`name:${args.name}`);
    if (args.id) keyParts.push(`id:${args.id}`);
    if (args.parentId) keyParts.push(`parent:${args.parentId}`);

    return keyParts.join(':');
  }

  /**
   * 构建分类树
   * @param {Array} categories 分类列表
   * @return {Array} 树形结构
   * @private
   */
  _buildCategoryTree(categories) {
    const tree = [];
    const map = {};

    // 创建映射
    categories.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });

    // 构建树形结构
    categories.forEach(item => {
      if (item.parentId === '0' || !item.parentId) {
        tree.push(map[item.id]);
      } else if (map[item.parentId]) {
        map[item.parentId].children.push(map[item.id]);
      }
    });

    return tree;
  }

  /**
   * 清除指定类型的缓存
   * @param {String} type 类型
   * @param {Object} args 参数
   * @return {Promise<boolean>} 是否成功
   */
  async clearCache(type, args = {}) {
    try {
      const cacheKeys = [];

      switch (type) {
        case 'content':
          Object.values(this.cacheConfig.content).forEach(config => {
            cacheKeys.push(this._buildCacheKey(config.key, args));
          });
          break;

        case 'taxonomy':
          Object.values(this.cacheConfig.taxonomy).forEach(config => {
            cacheKeys.push(this._buildCacheKey(config.key, args));
          });
          break;

        case 'ads':
          cacheKeys.push(this._buildCacheKey(this.cacheConfig.ads.default.key, args));
          break;

        case 'all':
          // 清除所有模板缓存
          Object.values(this.cacheConfig.content).forEach(config => {
            cacheKeys.push(this._buildCacheKey(config.key, {}));
          });
          Object.values(this.cacheConfig.taxonomy).forEach(config => {
            cacheKeys.push(this._buildCacheKey(config.key, {}));
          });
          cacheKeys.push(this._buildCacheKey(this.cacheConfig.ads.default.key, {}));
          break;
      }

      // 批量删除缓存
      const deletePromises = cacheKeys.map(key => this.ctx.app.cache.delete(key));
      await Promise.all(deletePromises);

      this.ctx.logger.info(`[TemplateService] Cleared ${cacheKeys.length} cache keys for type: ${type}`);
      return true;
    } catch (error) {
      this.ctx.logger.error(`[TemplateService] Failed to clear cache for type: ${type}`, error);
      return false;
    }
  }

  /**
   * 后台刷新检查 - 防止缓存雪崩
   * @param {String} cacheKey 缓存键
   * @param {Object} cacheConfig 缓存配置
   * @param {String} actionType 操作类型
   * @param {Object} args 参数
   */
  async _checkBackgroundRefresh(cacheKey, cacheConfig, actionType, args) {
    try {
      // 避免重复刷新
      if (this.refreshQueue.has(cacheKey)) {
        return;
      }

      // 检查缓存剩余时间
      const cacheInfo = await this._getCacheTTL(cacheKey);
      const remainingTTL = cacheInfo ? cacheInfo : 0;

      // 当缓存剩余时间少于总时间的30%时，后台刷新
      const refreshThreshold = cacheConfig.ttl * 0.3;

      if (remainingTTL > 0 && remainingTTL < refreshThreshold) {
        // 标记为正在刷新
        this.refreshQueue.add(cacheKey);

        // 异步后台刷新，不阻塞当前请求
        setImmediate(async () => {
          try {
            const freshData = await this._fetchFromDataSource(actionType, args);
            await this._setCache(cacheKey, freshData, cacheConfig.ttl);
            this.ctx.logger.info(`[TemplateService] Background refreshed: ${cacheKey}`);
          } catch (error) {
            this.ctx.logger.error(`[TemplateService] Background refresh failed: ${cacheKey}`, error);
          } finally {
            this.refreshQueue.delete(cacheKey);
          }
        });
      }
    } catch (error) {
      // 静默处理后台刷新错误
      this.ctx.logger.debug(`[TemplateService] Background refresh check failed: ${cacheKey}`, error);
    }
  }

  /**
   * 空缓存快速刷新（不依赖 TTL 阈值）
   * @param {String} cacheKey 缓存键
   * @param {Object} cacheConfig 缓存配置
   * @param {String} actionType 操作类型
   * @param {Object} args 参数
   * @param {String} reason 触发原因
   */
  _refreshCacheAsync(cacheKey, cacheConfig, actionType, args, reason = 'manual') {
    if (this.refreshQueue.has(cacheKey)) {
      return;
    }

    this.refreshQueue.add(cacheKey);
    setImmediate(async () => {
      try {
        const freshData = await this._fetchFromDataSource(actionType, args);
        const cacheDecision = this._getCacheDecision(freshData, cacheConfig);
        if (cacheDecision.shouldCache) {
          await this._setCache(cacheKey, freshData, cacheDecision.ttl);
          this.ctx.logger.info(`[TemplateService] Background refreshed (${reason}): ${cacheKey}`);
        } else {
          this.ctx.logger.debug(`[TemplateService] Skip caching empty result (${reason}): ${cacheKey}`);
        }
      } catch (error) {
        this.ctx.logger.error(`[TemplateService] Background refresh failed (${reason}): ${cacheKey}`, error);
      } finally {
        this.refreshQueue.delete(cacheKey);
      }
    });
  }

  /**
   * 判断是否为空数据
   * @param {*} result 结果
   * @return {Boolean} 是否为空
   */
  _isEmptyResult(result) {
    return this._getResultSize(result) === 0;
  }

  /**
   * 获取结果数量（兼容数组/分页对象）
   * @param {*} result 结果
   * @return {Number} 结果数量
   */
  _getResultSize(result) {
    if (Array.isArray(result)) {
      return result.length;
    }
    if (result && Array.isArray(result.docs)) {
      return result.docs.length;
    }
    if (result === null || result === undefined) {
      return 0;
    }
    return 1;
  }

  /**
   * 计算缓存决策（处理空数据短缓存）
   * @param {*} result 结果
   * @param {Object} cacheConfig 缓存配置
   * @return {{shouldCache: boolean, ttl: number}} 缓存决策
   */
  _getCacheDecision(result, cacheConfig) {
    const hasEmptyStrategy =
      typeof cacheConfig.emptyTtl === 'number' ||
      typeof cacheConfig.minItems === 'number' ||
      cacheConfig.refreshOnEmpty;

    if (!hasEmptyStrategy) {
      return { shouldCache: true, ttl: cacheConfig.ttl };
    }

    const size = this._getResultSize(result);
    const minItems = typeof cacheConfig.minItems === 'number' ? cacheConfig.minItems : 0;
    const isEmpty = size <= minItems - 1 || size === 0;

    if (isEmpty) {
      const emptyTtl = Number(cacheConfig.emptyTtl) || 0;
      if (emptyTtl > 0) {
        return { shouldCache: true, ttl: emptyTtl };
      }
      return { shouldCache: false, ttl: cacheConfig.ttl };
    }

    return { shouldCache: true, ttl: cacheConfig.ttl };
  }

  /**
   * 智能缓存预热
   * @param {Object} options 预热选项
   */
  async warmupCache(options = {}) {
    if (this.isWarmingUp) {
      this.ctx.logger.warn('[TemplateService] Cache warmup already in progress');
      return;
    }

    this.isWarmingUp = true;
    const warmupStartTime = Date.now();

    try {
      // 🔥 优化：简化启动日志，详细信息改为 DEBUG 级别
      this.ctx.logger.debug('[TemplateService] Starting cache warmup...', {
        batchSize: options.batchSize || 3,
        batchDelay: options.batchDelay || 100,
        timestamp: new Date().toISOString(),
      });

      const warmupTasks = [];

      // 收集需要预热的缓存配置
      Object.entries(this.cacheConfig).forEach(([category, configs]) => {
        Object.entries(configs).forEach(([actionType, config]) => {
          if (config.preload) {
            // 根据优先级决定预热参数
            const warmupArgs = this._getWarmupArgs(actionType, config.priority);
            warmupArgs.forEach(args => {
              warmupTasks.push({
                actionType,
                args,
                priority: config.priority,
                config,
              });
            });
          }
        });
      });

      // 按优先级排序
      warmupTasks.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // 分批预热，避免系统压力过大
      const batchSize = options.batchSize || 3;
      for (let i = 0; i < warmupTasks.length; i += batchSize) {
        const batch = warmupTasks.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async task => {
            try {
              this.ctx.logger.debug(`[TemplateService] Warming up: ${task.actionType}`, task.args);
              await this.fetchContent(task.actionType, task.args);
              this.ctx.logger.debug(`[TemplateService] Warmed up: ${task.actionType}`);
            } catch (error) {
              this.ctx.logger.warn(`[TemplateService] Warmup failed: ${task.actionType}`, error.message);
            }
          })
        );

        // 批次间短暂延迟
        if (i + batchSize < warmupTasks.length) {
          await new Promise(resolve => setTimeout(resolve, options.batchDelay || 100));
        }
      }

      const warmupDuration = Date.now() - warmupStartTime;
      this.ctx.logger.info(`✅ 模板缓存预热完成，耗时: ${warmupDuration}ms`);
    } finally {
      this.isWarmingUp = false;
    }
  }

  /**
   * 阻塞式关键缓存预热（用于保证首屏不空白）
   * @param {Object} options 预热选项
   */
  async warmupCriticalCache(options = {}) {
    const startTime = Date.now();
    const maxRetries = Number(options.maxRetries ?? 6);
    const retryDelay = Number(options.retryDelay ?? 1000);

    this.ctx.logger.info('[TemplateService] Starting critical cache warmup...');

    const tasks = [
      { actionType: 'navtree', args: {} },
      { actionType: 'categoryTree', args: {} },
      { actionType: 'tags', args: {} },
      { actionType: 'hottags', args: {} },
      { actionType: 'news', args: { pageSize: 10, isPaging: '0' } },
      { actionType: 'news', args: { pageSize: 5, isPaging: '0' } },
      { actionType: 'recommend', args: { pageSize: 10, isPaging: '0' } },
      { actionType: 'recommend', args: { pageSize: 5, isPaging: '0' } },
      { actionType: 'hot', args: { pageSize: 10, isPaging: '0' } },
      { actionType: 'hot', args: { pageSize: 5, isPaging: '0' } },
    ];

    for (const task of tasks) {
      if (['news', 'recommend', 'hot'].includes(task.actionType)) {
        await this._fetchWithRetry(task.actionType, task.args, { maxRetries, retryDelay });
      } else {
        await this.fetchContent(task.actionType, task.args);
      }
    }

    const duration = Date.now() - startTime;
    this.ctx.logger.info(`[TemplateService] Critical cache warmup completed in ${duration}ms`);
  }

  /**
   * 带重试的数据获取（用于首屏关键内容）
   * @param {String} actionType 操作类型
   * @param {Object} args 参数
   * @param {Object} options 重试选项
   * @return {Promise<*>} 结果
   * @private
   */
  async _fetchWithRetry(actionType, args, options = {}) {
    const maxRetries = Number(options.maxRetries ?? 6);
    const retryDelay = Number(options.retryDelay ?? 1000);
    let lastResult = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      lastResult = await this.fetchContent(actionType, args);
      if (this._getResultSize(lastResult) > 0) {
        return lastResult;
      }
      if (attempt < maxRetries) {
        await this._delay(retryDelay);
      }
    }

    return lastResult;
  }

  /**
   * 简单延时
   * @param {Number} ms 毫秒
   * @return {Promise<void>}
   * @private
   */
  async _delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取预热参数
   * @param {String} actionType 操作类型
   * @param {String} priority 优先级
   * @return {Array} 参数数组
   */
  _getWarmupArgs(actionType, priority) {
    const baseArgs = { pageSize: 10, isPaging: '0' };

    switch (actionType) {
      case 'recommend':
      case 'hot':
      case 'news':
        return [baseArgs, { ...baseArgs, pageSize: 5 }]; // 常用参数组合，覆盖首页侧边栏

      case 'navtree':
      case 'categoryTree':
      case 'tags':
      case 'hottags':
      case 'hotTags':
        return [{}]; // 全局数据，无需特殊参数

      case 'categoryStats':
        // categoryStats 需要具体的分类ID，跳过预热
        return [];

      default:
        return [baseArgs];
    }
  }

  /**
   * 获取缓存配置
   * @param {String} actionType 操作类型
   * @return {Object|null} 缓存配置
   */
  _getCacheConfig(actionType) {
    // 特殊处理 ads 类型
    if (actionType === 'ads') {
      return this.cacheConfig.ads.default;
    }

    for (const category of Object.values(this.cacheConfig)) {
      if (category[actionType]) {
        return category[actionType];
      }
    }
    return null;
  }

  /**
   * 从缓存获取数据
   * @param {String} cacheKey 缓存键
   * @return {Promise<*>} 缓存数据
   */
  async _getFromCache(cacheKey) {
    try {
      return await this.ctx.app.cache.get(cacheKey);
    } catch (error) {
      this.ctx.logger.warn(`[TemplateService] Cache get error: ${cacheKey}`, error);
      return null;
    }
  }

  /**
   * 设置缓存数据
   * @param {String} cacheKey 缓存键
   * @param {*} data 数据
   * @param {Number} ttl 过期时间
   */
  async _setCache(cacheKey, data, ttl) {
    try {
      await this.ctx.app.cache.set(cacheKey, data, ttl);
    } catch (error) {
      this.ctx.logger.warn(`[TemplateService] Cache set error: ${cacheKey}`, error);
    }
  }

  /**
   * 获取缓存TTL
   * @param {String} cacheKey 缓存键
   * @return {Promise<Number>} TTL秒数
   */
  async _getCacheTTL(cacheKey) {
    try {
      // 如果是Redis缓存
      if (this.ctx.app.cache.cacheType === 'redis') {
        return await this.ctx.app.cache.cache.redis.ttl(cacheKey);
      }

      // 如果是内存缓存，需要手动计算
      const item = this.ctx.app.cache.cache.cache.get(cacheKey);
      if (item && item.expiredAt) {
        return Math.max(0, Math.floor((item.expiredAt - Date.now()) / 1000));
      }

      return 0;
    } catch (error) {
      this.ctx.logger.debug(`[TemplateService] Get TTL error: ${cacheKey}`, error);
      return 0;
    }
  }

  /**
   * 记录响应时间
   * @param {Number} startTime 开始时间
   */
  _recordResponseTime(startTime) {
    const duration = Date.now() - startTime;
    const stats = this._globalCacheStats;
    stats.avgResponseTime = (stats.avgResponseTime * (stats.totalRequests - 1) + duration) / stats.totalRequests;
  }

  /**
   * 获取增强的缓存统计信息
   * @return {Object} 缓存统计
   */
  getEnhancedCacheStats() {
    const stats = this._globalCacheStats;
    const hitRate = stats.totalRequests > 0 ? ((stats.hits / stats.totalRequests) * 100).toFixed(2) : 0;

    return {
      ...stats,
      hitRate: `${hitRate}%`,
      uptime: Date.now() - stats.lastResetTime,
      memoryUsage: process.memoryUsage(),
      cacheConfig: this.cacheConfig,
      systemCacheInfo: this.ctx.app.cache.getInfo(),
    };
  }

  /**
   * 重置缓存统计信息
   */
  resetCacheStats() {
    this.app._templateServiceCacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      lastResetTime: Date.now(),
    };
  }

  /**
   * 获取缓存统计信息（保持向后兼容）
   * @return {Object} 缓存统计
   */
  getCacheStats() {
    return {
      config: this.cacheConfig,
      info: this.ctx.app.cache.getInfo(),
      enhanced: this.getEnhancedCacheStats(),
    };
  }
}

module.exports = TemplateService;
