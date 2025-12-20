'use strict';

const _ = require('lodash');
const pkg = require('../../../../package.json');
const securityValidator = require('./security');
/**
 * Utility functions for template tags
 */
const utils = {
  /**
   * 🚀 优化版：统一数据获取方法 - 使用TemplateService和缓存
   * @param {Object} ctx - Application context
   * @param {Object} context - Template context
   * @param {Object} args - Template arguments
   * @param {String} actionType - Type of action/content to fetch
   */
  async fetchContent(ctx, context, args, actionType) {
    const startTime = Date.now();
    const key = _.isEmpty(args.key) ? actionType : args.key;

    try {
      // 🔥 统一参数处理
      const templateArgs = {
        typeId: args.typeId,
        isPaging: args.isPaging || '0',
        name: args.name,
        id: args.id || context.ctx.post?.id,
        parentId: args.parentId,
        ...args, // 包含其他可能的参数
        current: args.current ? Number(args.current) : 1,
        pageSize: args.pageSize ? Number(args.pageSize) : 10,
      };

      // 🚀 使用TemplateService获取数据
      const apiData = await ctx.service.templateService.fetchContent(actionType, templateArgs);

      // 设置模板上下文
      context.ctx[key] = apiData || [];

      // 📊 性能监控
      const duration = Date.now() - startTime;
      if (duration > 100) {
        // 超过100ms记录慢查询
        ctx.logger.warn(`[Template] Slow query detected: ${actionType} took ${duration}ms`);
      }

      return apiData;
    } catch (error) {
      const duration = Date.now() - startTime;
      context.ctx[key] = [];
      ctx.logger.error(`[${actionType}] Error fetching data in ${duration}ms:`, error);

      // 🔧 优雅降级：返回空数组而不是抛出异常
      return [];
    }
  },

  /**
   * Executes a custom API request with security validation
   * @param {Object} ctx - Application context
   * @param {Object} context - Template context
   * @param {Object} args - Template arguments
   */
  async fetchCustomData(ctx, context, args) {
    try {
      // 参数验证
      const validation = securityValidator.validateTagArgs(args, {
        required: ['key', 'api'],
        strict: true, // 🔒 重新启用严格模式
        properties: {
          key: { type: 'string', maxLength: 50 },
          api: { type: 'string', maxLength: 100 },
          query: { type: 'string', maxLength: 1000 },
          pageSize: { type: 'string', maxLength: 10 },
          isPaging: { type: 'string', enum: ['0', '1'] },
          __keywords: { type: 'boolean' }, // 🔧 允许 nunjucks 内部参数
        },
      });

      if (!validation.valid) {
        const error = new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
        error.name = 'ValidationError';
        error.code = 'INVALID_PARAMS';
        throw error;
      }

      const { key, api, query, pageSize, isPaging = '1' } = args;

      // API路径安全验证
      if (!securityValidator.isValidApiPath(api)) {
        throw new Error(`Unauthorized API path: ${api}`);
      }

      // 安全解析查询参数
      let queryObj = {};
      if (query) {
        const parseResult = securityValidator.safeJsonParse(query);
        if (!parseResult.success) {
          throw new Error(`Invalid query: ${parseResult.error}`);
        }
        queryObj = parseResult.data;
      }

      // 构建payload
      const payload = {};
      if (pageSize) payload.pageSize = Number(pageSize) || 10;
      if (isPaging) payload.isPaging = isPaging;
      if (queryObj && Object.keys(queryObj).length > 0) {
        _.assign(payload, queryObj);
      }

      try {
        const apiData = await ctx.helper.reqJsonData(api, payload);
        context.ctx[key] = apiData;
        return apiData;
      } catch (error) {
        context.ctx[key] = [];
        ctx.logger.error('[remote] Error fetching data:', {
          error: error.message,
          api,
          payload: JSON.stringify(payload),
        });
        return [];
      }
    } catch (outerError) {
      // 重新抛出错误，让 BaseTag 处理
      throw outerError;
    }
  },

  async renderSystemConfig(ctx) {
    console.log('renderSystemConfig called');
    try {
      const configs = await ctx.service.systemConfig.find(
        {
          isPaging: '0',
          lean: '1',
        },
        {
          query: {
            type: { $ne: 'password' },
            public: true,
          },
          files: '-date',
        }
      );
      // Convert array to key-value object
      const configObj = {};
      configs.forEach(item => {
        configObj[item.key] = item.value;
      });
      const { siteName, siteDiscription, siteKeywords, siteAltKeywords, ogTitle, siteLogo, siteDomain } = configObj;

      // Return data in the format expected by templates
      return {
        ...configObj,
        title: siteName || 'DoraCMS',
        description: siteDiscription || '',
        logo: siteLogo || '',
        icon: '', // 如果需要可以从配置中获取
        url: siteDomain || '',
        navigation: [], // 如果需要可以从配置中获取
        keywords: siteKeywords || '',
        altKeywords: siteAltKeywords || '',
        ogTitle: ogTitle || '',
        version: pkg.version,
        lang: ctx.session.locale,
      };
    } catch (error) {
      console.error('Error in renderSystemConfig:', error);
      return null;
    }
  },
};

module.exports = utils;
