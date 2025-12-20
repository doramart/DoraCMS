/**
 * Template Hooks Service
 * 模板安装生命周期钩子系统
 */
'use strict';

const Service = require('egg').Service;
const EventEmitter = require('events');

class TemplateHooksService extends Service {
  constructor(ctx) {
    super(ctx);
    this.eventEmitter = new EventEmitter();
    this.hooks = new Map();
    this.initializeDefaultHooks();
  }

  /**
   * 初始化默认钩子
   */
  initializeDefaultHooks() {
    // 安装前钩子 - 验证和预处理
    this.registerHook('before:install', async (theme, options) => {
      this.ctx.logger.info(`[Hook] Before install: ${theme.slug}`);

      // 验证主题配置
      await this._validateThemeConfig(theme, options);

      // 检查系统兼容性
      await this._checkSystemCompatibility(theme);

      // 备份现有主题（如果存在）
      await this._backupExistingTheme(theme.slug);
    });

    // 安装后钩子 - 自动生成和优化
    this.registerHook('after:install', async (theme, options) => {
      this.ctx.logger.info(`[Hook] After install: ${theme.slug}`);

      // 触发自动生成
      if (options.autoGenerate !== false) {
        await this._triggerAutoGeneration(theme, options);
      }

      // 优化主题资源
      await this._optimizeThemeAssets(theme);

      // 创建主题使用统计
      await this._initializeThemeStats(theme);
    });

    // 激活前钩子
    this.registerHook('before:activate', async (theme, options) => {
      this.ctx.logger.info(`[Hook] Before activate: ${theme.slug}`);

      // 检查主题完整性
      const integrityCheck = await this.ctx.service.templateManager.checkThemeIntegrity(theme.id);
      if (!integrityCheck.overall) {
        throw new Error(`主题 "${theme.name}" 文件不完整，无法激活`);
      }

      // 预编译模板
      await this._precompileTemplates(theme);
    });

    // 激活后钩子
    this.registerHook('after:activate', async (theme, options) => {
      this.ctx.logger.info(`[Hook] After activate: ${theme.slug}`);

      // 清除相关缓存
      await this._clearRelatedCache(theme);

      // 记录激活日志
      await this._logThemeActivation(theme, options.operatorId);

      // 发送激活通知
      await this._sendActivationNotification(theme);
    });

    // 更新前钩子
    this.registerHook('before:update', async (theme, updateData, options) => {
      this.ctx.logger.info(`[Hook] Before update: ${theme.slug}`);

      // 备份当前版本
      await this._backupCurrentVersion(theme);

      // 验证更新数据
      await this._validateUpdateData(updateData, theme);
    });

    // 更新后钩子
    this.registerHook('after:update', async (theme, options) => {
      this.ctx.logger.info(`[Hook] After update: ${theme.slug}`);

      // 检查并生成缺失文件
      if (options.autoGenerate !== false) {
        await this._generateMissingFiles(theme, options);
      }

      // 更新版本统计
      await this._updateVersionStats(theme);
    });

    // 卸载前钩子
    this.registerHook('before:uninstall', async (theme, options) => {
      this.ctx.logger.info(`[Hook] Before uninstall: ${theme.slug}`);

      // 检查依赖关系
      await this._checkDependencies(theme);

      // 备份用户自定义内容
      await this._backupUserCustomizations(theme);
    });

    // 卸载后钩子
    this.registerHook('after:uninstall', async (theme, options) => {
      this.ctx.logger.info(`[Hook] After uninstall: ${theme.slug}`);

      // 清理相关缓存
      await this._cleanupThemeCache(theme);

      // 记录卸载日志
      await this._logThemeUninstall(theme, options.operatorId);
    });
  }

  /**
   * 注册钩子
   * @param {String} hookName 钩子名称
   * @param {Function} handler 处理函数
   * @param {Object} options 选项
   */
  registerHook(hookName, handler, options = {}) {
    const { priority = 0, once = false } = options;

    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hookConfig = {
      handler,
      priority,
      once,
      id: `${hookName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.hooks.get(hookName).push(hookConfig);

    // 按优先级排序（优先级高的先执行）
    this.hooks.get(hookName).sort((a, b) => b.priority - a.priority);

    return hookConfig.id;
  }

  /**
   * 取消注册钩子
   * @param {String} hookName 钩子名称
   * @param {String} hookId 钩子ID
   */
  unregisterHook(hookName, hookId) {
    if (!this.hooks.has(hookName)) {
      return false;
    }

    const hooks = this.hooks.get(hookName);
    const index = hooks.findIndex(hook => hook.id === hookId);

    if (index !== -1) {
      hooks.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * 执行钩子
   * @param {String} hookName 钩子名称
   * @param {...any} args 参数
   */
  async executeHook(hookName, ...args) {
    if (!this.hooks.has(hookName)) {
      return;
    }

    const hooks = this.hooks.get(hookName);
    const toRemove = [];

    for (const hookConfig of hooks) {
      try {
        await hookConfig.handler.call(this, ...args);

        // 如果是一次性钩子，标记为删除
        if (hookConfig.once) {
          toRemove.push(hookConfig.id);
        }
      } catch (error) {
        this.ctx.logger.error(`Hook execution failed [${hookName}]:`, error);

        // 根据配置决定是否抛出错误
        const config = this.app.config.templateHooks || {};
        if (config.stopOnError !== false) {
          throw error;
        }
      }
    }

    // 移除一次性钩子
    toRemove.forEach(id => this.unregisterHook(hookName, id));

    // 触发事件
    this.eventEmitter.emit(hookName, ...args);
  }

  /**
   * 监听钩子事件
   * @param {String} hookName 钩子名称
   * @param {Function} listener 监听器
   */
  onHook(hookName, listener) {
    this.eventEmitter.on(hookName, listener);
  }

  /**
   * 移除钩子事件监听器
   * @param {String} hookName 钩子名称
   * @param {Function} listener 监听器
   */
  offHook(hookName, listener) {
    this.eventEmitter.off(hookName, listener);
  }

  // ===== 私有方法 =====

  /**
   * 验证主题配置
   * @param {Object} theme 主题对象
   * @param {Object} options 选项
   * @private
   */
  async _validateThemeConfig(theme, options) {
    if (!theme.config) {
      throw new Error(`主题 "${theme.name}" 缺少配置信息`);
    }

    // 检查必需的配置字段
    const requiredFields = ['layouts', 'templates'];
    for (const field of requiredFields) {
      if (!theme.config[field] || !Array.isArray(theme.config[field])) {
        throw new Error(`主题配置缺少必需字段: ${field}`);
      }
    }
  }

  /**
   * 检查系统兼容性
   * @param {Object} theme 主题对象
   * @private
   */
  async _checkSystemCompatibility(theme) {
    // 检查EggJS版本兼容性
    const eggVersion = require('egg/package.json').version;
    const compatibility = theme.config.compatibility;

    if (compatibility && compatibility.minEggVersion) {
      const semver = require('semver');
      if (!semver.gte(eggVersion, compatibility.minEggVersion)) {
        throw new Error(`主题要求EggJS版本 >= ${compatibility.minEggVersion}，当前版本: ${eggVersion}`);
      }
    }
  }

  /**
   * 备份现有主题
   * @param {String} themeSlug 主题标识
   * @private
   */
  async _backupExistingTheme(themeSlug) {
    const existingTheme = await this.ctx.service.template.findBySlug(themeSlug);
    if (existingTheme) {
      this.ctx.logger.info(`Backing up existing theme: ${themeSlug}`);
      // 这里可以实现备份逻辑
    }
  }

  /**
   * 触发自动生成
   * @param {Object} theme 主题对象
   * @param {Object} options 选项
   * @private
   */
  async _triggerAutoGeneration(theme, options) {
    try {
      const genOptions = {
        ...options,
        verbose: false, // 钩子中不显示详细日志
      };

      const result = await this.ctx.service.templateManager.checkAndGenerateMissingTemplates(theme.id, genOptions);

      if (result.generated > 0) {
        this.ctx.logger.info(`Auto-generated ${result.generated} missing files for theme: ${theme.slug}`);
      }
    } catch (error) {
      this.ctx.logger.warn(`Auto-generation failed in hook for theme: ${theme.slug}`, error);
    }
  }

  /**
   * 优化主题资源
   * @param {Object} theme 主题对象
   * @private
   */
  async _optimizeThemeAssets(theme) {
    // 这里可以实现资源优化逻辑，如压缩CSS、JS等
    this.ctx.logger.debug(`Optimizing assets for theme: ${theme.slug}`);
  }

  /**
   * 初始化主题统计
   * @param {Object} theme 主题对象
   * @private
   */
  async _initializeThemeStats(theme) {
    const stats = {
      installTime: new Date(),
      usageCount: 0,
      lastActivated: null,
    };

    // 这里可以保存到数据库或缓存
    this.ctx.logger.debug(`Initialized stats for theme: ${theme.slug}`);
  }

  /**
   * 预编译模板
   * @param {Object} theme 主题对象
   * @private
   */
  async _precompileTemplates(theme) {
    // 这里可以实现模板预编译逻辑
    this.ctx.logger.debug(`Precompiling templates for theme: ${theme.slug}`);
  }

  /**
   * 清除相关缓存
   * @param {Object} theme 主题对象
   * @private
   */
  async _clearRelatedCache(theme) {
    try {
      await this.ctx.service.templateManager._clearTemplateCache();
      this.ctx.logger.debug(`Cleared cache for theme: ${theme.slug}`);
    } catch (error) {
      this.ctx.logger.warn(`Failed to clear cache for theme: ${theme.slug}`, error);
    }
  }

  /**
   * 记录激活日志
   * @param {Object} theme 主题对象
   * @param {String} operatorId 操作者ID
   * @private
   */
  async _logThemeActivation(theme, operatorId) {
    // 这里可以记录到系统日志表
    this.ctx.logger.info(`Theme activated: ${theme.slug} by ${operatorId || 'system'}`);
  }

  /**
   * 发送激活通知
   * @param {Object} theme 主题对象
   * @private
   */
  async _sendActivationNotification(theme) {
    // 这里可以发送通知给管理员
    this.ctx.logger.debug(`Sending activation notification for theme: ${theme.slug}`);
  }

  /**
   * 备份当前版本
   * @param {Object} theme 主题对象
   * @private
   */
  async _backupCurrentVersion(theme) {
    this.ctx.logger.debug(`Backing up current version of theme: ${theme.slug}`);
  }

  /**
   * 验证更新数据
   * @param {Object} updateData 更新数据
   * @param {Object} theme 主题对象
   * @private
   */
  async _validateUpdateData(updateData, theme) {
    if (updateData.slug && updateData.slug !== theme.slug) {
      // 检查新的slug是否已存在
      const existing = await this.ctx.service.template.findBySlug(updateData.slug);
      if (existing && existing.id !== theme.id) {
        throw new Error(`主题标识符 "${updateData.slug}" 已存在`);
      }
    }
  }

  /**
   * 生成缺失文件
   * @param {Object} theme 主题对象
   * @param {Object} options 选项
   * @private
   */
  async _generateMissingFiles(theme, options) {
    try {
      const result = await this.ctx.service.templateManager.checkAndGenerateMissingTemplates(theme.id, {
        ...options,
        overwrite: false, // 更新时不覆盖现有文件
      });

      if (result.generated > 0) {
        this.ctx.logger.info(`Generated ${result.generated} missing files after update for theme: ${theme.slug}`);
      }
    } catch (error) {
      this.ctx.logger.warn(`Failed to generate missing files after update for theme: ${theme.slug}`, error);
    }
  }

  /**
   * 更新版本统计
   * @param {Object} theme 主题对象
   * @private
   */
  async _updateVersionStats(theme) {
    // 更新版本相关统计信息
    this.ctx.logger.debug(`Updated version stats for theme: ${theme.slug}`);
  }

  /**
   * 检查依赖关系
   * @param {Object} theme 主题对象
   * @private
   */
  async _checkDependencies(theme) {
    // 检查是否有其他主题依赖于此主题
    this.ctx.logger.debug(`Checking dependencies for theme: ${theme.slug}`);
  }

  /**
   * 备份用户自定义内容
   * @param {Object} theme 主题对象
   * @private
   */
  async _backupUserCustomizations(theme) {
    // 备份用户对主题的自定义修改
    this.ctx.logger.debug(`Backing up user customizations for theme: ${theme.slug}`);
  }

  /**
   * 清理主题缓存
   * @param {Object} theme 主题对象
   * @private
   */
  async _cleanupThemeCache(theme) {
    try {
      await this.ctx.service.templateManager._clearTemplateCache();
      this.ctx.logger.debug(`Cleaned up cache for theme: ${theme.slug}`);
    } catch (error) {
      this.ctx.logger.warn(`Failed to cleanup cache for theme: ${theme.slug}`, error);
    }
  }

  /**
   * 记录卸载日志
   * @param {Object} theme 主题对象
   * @param {String} operatorId 操作者ID
   * @private
   */
  async _logThemeUninstall(theme, operatorId) {
    this.ctx.logger.info(`Theme uninstalled: ${theme.slug} by ${operatorId || 'system'}`);
  }
}

module.exports = TemplateHooksService;
