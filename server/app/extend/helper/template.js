'use strict';

const path = require('path');
const fs = require('fs');
const tagsRegistry = require('./tags');
const { contextManager } = require('./tags/context');

module.exports = {
  /**
   * Initialize template system
   * @param {Object} app - Egg.js app instance
   */
  initializeTemplateSystem(app) {
    // 初始化标签
    this.initializeTags(app);

    // 初始化过滤器
    this.initializeFilters(app);

    // 在两个生命周期钩子中尝试加载
    app.beforeStart(async () => {
      // app.logger.info('Template system initializing in beforeStart');
      // await this.tryLoadingContext(app);
    });

    // 应用完全初始化后的最后尝试
    app.ready(async () => {
      app.logger.info('Template system initializing in ready');
      if (!contextManager.initialized) {
        await this.tryLoadingContext(app);
        // 在上下文加载完成后初始化全局变量
        this.initializeGlobals(app);
      }
    });
  },

  /**
   * 使用默认值初始化上下文
   * @param {Object} app - Egg.js app instance
   */
  async initializeContextWithDefaults(app) {
    try {
      const ctx = app.createAnonymousContext();
      await contextManager.initialize(ctx);
      app.logger.info('Template context initialized with defaults');
    } catch (error) {
      app.logger.error('Failed to initialize template context with defaults:', error);
    }
  },

  /**
   * 尝试使用服务加载上下文
   * @param {Object} app - Egg.js app instance
   */
  async tryLoadingContext(app) {
    try {
      const ctx = app.createAnonymousContext();
      // 使用服务加载
      await contextManager.initialize(ctx);
      app.logger.info('Template context loaded with service');
    } catch (error) {
      app.logger.error('Failed to load template context:', error);
    }
  },

  /**
   * Initialize template tags
   * @param {Object} app - Egg.js app instance
   */
  initializeTags(app) {
    tagsRegistry.initializeAll(app);
  },

  /**
   * Initialize filters for templates
   * @param {Object} app - Egg.js app instance
   */
  initializeFilters(app) {
    // Initialize Nunjucks filters
    // These can be used like {{ content | excerpt(30) }}
    const filters = require('./tags/filters');
    const ctx = app.createAnonymousContext();

    // Add date filter
    app.nunjucks.addFilter('date', (str, format) => {
      const dateFilter = new filters.DateFilter(ctx);
      return dateFilter._process({}, str, { format });
    });

    // Add excerpt filter
    app.nunjucks.addFilter('excerpt', (str, length) => {
      const excerptFilter = new filters.ExcerptFilter(ctx);
      return excerptFilter._process({}, str, { words: length });
    });

    // Add imgurl filter
    app.nunjucks.addFilter('imgurl', (str, size) => {
      const imgUrlFilter = new filters.ImgUrlFilter(ctx);
      return imgUrlFilter._process({}, str, { size });
    });

    // Add readingtime filter
    app.nunjucks.addFilter('readingtime', str => {
      const readingTimeFilter = new filters.ReadingTimeFilter(ctx);
      return readingTimeFilter._process({}, str);
    });

    // Add encode filter
    app.nunjucks.addFilter('encode', str => {
      const encodeFilter = new filters.EncodeFilter(ctx);
      return encodeFilter._process({}, str);
    });

    // Add striphtml filter
    app.nunjucks.addFilter('striphtml', str => {
      const stripHtmlFilter = new filters.StripHtmlFilter(ctx);
      return stripHtmlFilter._process({}, str);
    });

    // Add json filter for debugging purposes
    app.nunjucks.addFilter('json', (obj, indent = 2) => {
      try {
        return JSON.stringify(obj, null, indent);
      } catch (error) {
        return `[JSON Error: ${error.message}]`;
      }
    });

    // Add str filter for string formatting (Python-like)
    app.nunjucks.addFilter('str', (num, format) => {
      if (format === '02d') {
        // 格式化为两位数字，不足补0
        return String(num).padStart(2, '0');
      }
      if (format === '03d') {
        // 格式化为三位数字，不足补0
        return String(num).padStart(3, '0');
      }
      // 默认直接转字符串
      return String(num);
    });
  },

  /**
   * Initialize global template variables
   * @param {Object} app - Egg.js app instance
   */
  initializeGlobals(app) {
    // console.log('Initializing globals...');
    // 确保在上下文更新时更新全局变量
    app.messenger.on('context-updated', () => {
      // console.log('Context updated', contextManager.site);
      app.nunjucks.addGlobal('site', contextManager.site || {});
      app.nunjucks.addGlobal('config', contextManager.config || {});
      app.nunjucks.addGlobal('custom', contextManager.custom || {});
      app.nunjucks.addGlobal('member', contextManager.member || null);
    });

    // 初始设置全局变量
    // console.log('Setting initial globals...');
    app.nunjucks.addGlobal('site', contextManager.site || {});
    app.nunjucks.addGlobal('themeConfig', this.loadThemeConfig(app));
    app.nunjucks.addGlobal('config', contextManager.config || {});
    app.nunjucks.addGlobal('custom', contextManager.custom || {});
    app.nunjucks.addGlobal('member', contextManager.member || null);
    // console.log('Globals initialized');
  },

  /**
   * Load theme configuration
   * @param {Object} app - Egg.js app instance
   * @return {Object} Theme configuration
   */
  loadThemeConfig(app) {
    const theme = contextManager.custom.theme || 'default';
    const configPath = path.join(app.config.view.root[0], theme, 'theme.json');

    try {
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configContent);
      }
    } catch (error) {
      app.logger.error('Failed to load theme config:', error);
    }

    return {};
  },
};
