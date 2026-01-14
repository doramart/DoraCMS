'use strict';

// const BaseTag = require('./base');
const { renderSystemConfig } = require('./utils');
const path = require('path');
/**
 * Singleton Context Manager for DoraCMS
 * This manages global data that can be accessed from templates
 */
class ContextManager {
  constructor() {
    this._site = {};
    this._page = {};
    this._custom = {};
    this._config = {};
    this._member = null;
    this._initialized = false;
    this._initPromise = null;
    this._retryCount = 0;
    this._maxRetries = 3;
  }

  // Site data getters/setters
  get site() {
    return this._site;
  }

  setSite(data) {
    this._site = data || {};
  }

  // Page data getters/setters
  get page() {
    return this._page;
  }

  setPage(data) {
    this._page = data || {};
  }

  // Custom theme data getters/setters
  get custom() {
    return this._custom;
  }

  setCustom(data) {
    this._custom = data || {};
  }

  // Config data getters/setters
  get config() {
    return this._config;
  }

  setConfig(data) {
    this._config = data || {};
  }

  // Member data getters/setters
  get member() {
    return this._member;
  }

  setMember(data) {
    this._member = data;
  }

  get initialized() {
    return this._initialized;
  }

  // Initialize all context data
  async initialize(ctx, options = {}) {
    // 避免重复初始化
    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = this._doInitialize(ctx, options);
    return this._initPromise;
  }

  /**
   * 执行实际的初始化逻辑
   * @param {Object} ctx - 应用上下文
   * @param {Object} options - 初始化选项
   */
  async _doInitialize(ctx, options = {}) {
    console.log('ContextManager initialize called');

    try {
      // 首先设置默认值，确保基本功能可用
      this._setDefaults(ctx);

      // 尝试加载动态配置
      const loadSuccess = await this._loadDynamicConfig(ctx);

      if (loadSuccess || this._retryCount >= this._maxRetries) {
        this._initialized = true;

        // 通知其他组件初始化完成
        if (ctx.app && ctx.app.messenger) {
          ctx.app.messenger.emit('context-initialized', this);
        }

        console.log('ContextManager initialized successfully');
      } else {
        // 如果失败且未达到最大重试次数，则重试
        this._retryCount++;
        console.warn(`ContextManager initialization failed, retrying... (${this._retryCount}/${this._maxRetries})`);

        // 延迟重试
        setTimeout(() => {
          this._initPromise = null;
          this.initialize(ctx, options);
        }, 1000 * this._retryCount);
      }
    } catch (error) {
      console.error('Error initializing context:', error);

      // 即使出错也标记为已初始化，使用默认值
      this._initialized = true;

      if (ctx.logger) {
        ctx.logger.error('ContextManager initialization error:', error);
      }
    }
  }

  /**
   * 设置默认值
   * @param {Object} ctx - 应用上下文
   */
  _setDefaults(ctx) {
    // 设置基本的站点信息
    this.setSite({
      title: 'DoraCMS',
      description: 'Content Management System',
      version: require('../../../../package.json').version || '1.0.0',
      logo: '',
      icon: '',
      url: '',
      keywords: '',
      lang: 'zh-CN',
    });

    // 设置基本的主题信息
    this.setCustom({
      theme: 'default',
    });

    // 设置基本的配置信息
    const staticPrefix = ctx.app?.config?.static?.prefix || '/public';
    this.setConfig({
      environment: process.env.NODE_ENV || 'development',
      staticRootPath: this._normalizePath(staticPrefix),
      staticThemePath: this._buildThemePath(staticPrefix, 'default'),
    });
  }

  /**
   * 加载动态配置
   * @param {Object} ctx - 应用上下文
   * @return {boolean} - 是否加载成功
   */
  async _loadDynamicConfig(ctx) {
    try {
      // 检查服务是否可用
      if (!this._isServiceAvailable(ctx)) {
        console.warn('Services not available for dynamic config loading');
        return false;
      }

      // 加载系统配置
      const systemConfig = await renderSystemConfig(ctx);
      // console.log("🚀 ~ ContextManager ~ _loadDynamicConfig ~ systemConfig:", systemConfig)
      if (systemConfig) {
        this.setSite({ ...this._site, ...systemConfig });
      }

      // 加载主题配置
      const themeConfig = await this._loadThemeConfig(ctx);
      if (themeConfig) {
        this.setCustom({ ...this._custom, ...themeConfig });

        // 更新静态资源路径
        this.setConfig({
          ...this._config,
          staticThemePath: this._buildThemePath(this._config.staticRootPath, themeConfig.theme),
        });
      }

      return true;
    } catch (error) {
      console.error('Error loading dynamic config:', error);
      return false;
    }
  }

  /**
   * 检查服务是否可用
   * @param {Object} ctx - 应用上下文
   * @return {boolean} - 服务是否可用
   */
  _isServiceAvailable(ctx) {
    return (
      ctx &&
      ctx.service &&
      typeof ctx.service.systemConfig === 'object' &&
      typeof ctx.service.systemConfig.find === 'function'
    );
  }

  /**
   * 加载主题配置 - 使用新的模板服务
   * @param {Object} ctx - 应用上下文
   * @return {Object|null} - 主题配置
   */
  async _loadThemeConfig(ctx) {
    try {
      // 检查模板模块是否启用
      const modulesConfig = ctx.app.config.modulesConfig || {};
      const templateModule = modulesConfig.business?.template;
      if (!templateModule || !templateModule.enabled) {
        return null;
      }

      // 使用新的模板服务获取激活的主题
      const activeTheme = await ctx.service.template.getActiveTheme();

      if (activeTheme) {
        return {
          // 基础主题信息
          theme: activeTheme.slug || activeTheme.alias || 'default',
          templateId: activeTheme._id || activeTheme.id,
          templateName: activeTheme.name,

          // 主题详细配置
          name: activeTheme.name,
          version: activeTheme.version || '1.0.0',
          author: activeTheme.author || 'Unknown',
          description: activeTheme.description || '',

          // 主题配置选项
          primaryColor: activeTheme.primaryColor || '#3b82f6',
          layout: activeTheme.layout || 'default',
          customCSS: activeTheme.customCSS || false,

          // 主题状态
          active: activeTheme.active || false,
          status: activeTheme.status || '0',

          // 安装信息
          installTime: activeTheme.installTime,
          lastModified: activeTheme.lastModified,

          // 主题文件路径
          slug: activeTheme.slug || activeTheme.alias,
          templatePath: activeTheme.templatePath,

          // 主题配置扩展
          config: activeTheme.config || {},
          themeConfig: activeTheme.themeConfig || {},

          // 兼容旧版本字段
          alias: activeTheme.alias || activeTheme.slug,
          using: activeTheme.active || false,
        };
      }
    } catch (error) {
      console.error('Error loading theme config:', error);
      ctx.logger.error('Failed to load theme config:', error);
    }

    return null;
  }

  /**
   * 重置上下文管理器
   */
  reset() {
    this._site = {};
    this._page = {};
    this._custom = {};
    this._config = {};
    this._member = null;
    this._initialized = false;
    this._initPromise = null;
    this._retryCount = 0;
  }

  /**
   * 获取完整的上下文数据
   * @return {Object} - 完整的上下文数据
   */
  getFullContext() {
    return {
      site: this._site,
      page: this._page,
      custom: this._custom,
      config: this._config,
      member: this._member,
      initialized: this._initialized,
    };
  }

  /**
   * 规范化路径
   * @param {string} inputPath - 输入路径
   * @return {string} - 规范化后的路径
   */
  _normalizePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      return '/public';
    }

    // 确保路径以 / 开头
    let normalized = inputPath.startsWith('/') ? inputPath : '/' + inputPath;

    // 移除尾部斜杠（除非是根路径）
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    // 移除重复的斜杠
    normalized = normalized.replace(/\/+/g, '/');

    return normalized;
  }

  /**
   * 构建主题路径
   * @param {string} staticPath - 静态资源路径
   * @param {string} themeName - 主题名称
   * @return {string} - 主题路径
   */
  _buildThemePath(staticPath, themeName) {
    const baseStaticPath = this._normalizePath(staticPath || '/public');
    const cleanThemeName = this._sanitizeThemeName(themeName || 'default');

    return path.posix.join(baseStaticPath, 'themes', cleanThemeName);
  }

  /**
   * 清理主题名称
   * @param {string} themeName - 主题名称
   * @return {string} - 清理后的主题名称
   */
  _sanitizeThemeName(themeName) {
    if (!themeName || typeof themeName !== 'string') {
      return 'default';
    }

    // 移除危险字符，只保留字母、数字、连字符和下划线
    const cleaned = themeName.replace(/[^a-zA-Z0-9\-_]/g, '').trim();

    return cleaned || 'default';
  }
}

// Export singleton instance
const contextManager = new ContextManager();
module.exports.contextManager = contextManager;
