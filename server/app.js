'use strict';
const path = require('path');
const fs = require('fs');
const UnifiedCache = require('./app/utils/unifiedCache');
const PermissionRegistry = require('./app/core/permission/PermissionRegistry');
const PermissionDefinitionManager = require('./app/core/permission/PermissionDefinitionManager');
const { pruneModuleData } = require('./app/utils/moduleDataPruner');
const DatabaseInitializer = require('./lib/dbInitializer');

class AppBootHook {
  constructor(app) {
    this.app = app;
    this.templateInitialized = false;
    this.permissionDefinitionManagerCleanupRegistered = false;
    // 性能监控
    this.performanceStats = {
      startTime: Date.now(),
      configLoadTime: 0,
      templateInitTime: 0,
      prewarmTime: 0,
      repositoryInitTime: 0,
      dbInitTime: 0,
      cacheWarmupTime: 0,
      totalStartupTime: 0,
    };
  }

  beforeStart() {
    this.app.runSchedule('backup_data');
  }

  configWillLoad() {
    const configStartTime = Date.now();
    try {
      this.app.logger.info('Loading bootstrap files...');
      this.app.loader.loadFile(path.join(this.app.config.baseDir, 'app/bootstrap/index.js'));

      // 加载传统扩展以保持向后兼容性
      const ctx = this.app.createAnonymousContext();

      // 这些是必须保留的传统扩展
      if (global.HeaderExtension) {
        this.app.nunjucks.addExtension('HeaderExtension', new HeaderExtension(ctx));
      }

      if (global.AssetsExtension) {
        this.app.nunjucks.addExtension('AssetsExtension', new AssetsExtension(ctx));
      }

      if (global.PluginsExtension) {
        this.app.nunjucks.addExtension('PluginsExtension', new PluginsExtension(ctx));
      }

      // 🚀 统一初始化模板系统（包含优化后的标签系统）
      this.initializeTemplateSystem();

      // 记录配置加载时间
      this.performanceStats.configLoadTime = Date.now() - configStartTime;
    } catch (error) {
      this.app.logger.error('Error in configWillLoad:', error);
    }
  }

  initializeTemplateSystem() {
    const templateStartTime = Date.now();
    try {
      if (this.templateInitialized) return;

      // 统一初始化模板系统（包含标签系统、过滤器等）
      const templateHelper = require('./app/extend/helper/template');
      templateHelper.initializeTemplateSystem(this.app);

      this.templateInitialized = true;
      this.performanceStats.templateInitTime = Date.now() - templateStartTime;
      this.app.logger.info(`🎉 模板系统初始化成功，耗时: ${this.performanceStats.templateInitTime}ms`);
    } catch (error) {
      this.app.logger.error('❌ 模板系统初始化失败:', error);
    }
  }

  async willReady() {
    // 请将你的应用项目中 app.beforeStart 中的代码置于此处。
    // 再次确保模板系统已初始化
    if (!this.templateInitialized) {
      this.initializeTemplateSystem();
    }

    // 🔥 优化：应用预热逻辑 - 预先初始化数据库连接和Repository
    const prewarmStartTime = Date.now();
    await this.prewarmApplication();
    this.performanceStats.prewarmTime = Date.now() - prewarmStartTime;

    // 初始化 Repository/Adapter 系统
    const repositoryStartTime = Date.now();
    try {
      const { initializeRepositorySystem } = require('./app/bootstrap/repository');
      await initializeRepositorySystem(this.app);
      this.performanceStats.repositoryInitTime = Date.now() - repositoryStartTime;
    } catch (error) {
      this.app.logger.error('Repository 系统初始化失败:', error);
    }

    // 🔧 数据库自动初始化（开发模式下检测空数据库并导入种子数据）
    const dbInitStartTime = Date.now();
    await this.initializeDatabaseIfEmpty();
    this.performanceStats.dbInitTime = Date.now() - dbInitStartTime;
  }

  /**
   * 🔧 数据库自动初始化
   * 检测数据库是否为空，如果为空则自动导入初始化数据
   * 支持环境变量控制：
   * - DB_SKIP_INIT=true  跳过初始化
   * - DB_FORCE_INIT=true 强制重新初始化
   */
  async initializeDatabaseIfEmpty() {
    try {
      const initializer = new DatabaseInitializer(this.app);
      const result = await initializer.initialize();

      if (result.skipped) {
        this.app.logger.info(`🔧 数据库初始化跳过: ${result.reason}`);
      } else if (result.success) {
        this.app.logger.info('🎉 数据库初始化成功:', result);
      }
    } catch (error) {
      this.app.logger.error('❌ 数据库初始化失败:', error);
      // 不阻止应用启动，让用户可以手动处理
    }
  }

  /**
   * 🔥 应用预热逻辑 - 提前初始化关键组件
   * 移除MariaDB连接预热，避免与Repository系统重复初始化
   */
  async prewarmApplication() {
    try {
      this.app.logger.info('🚀 开始应用预热...');

      // 只进行基础的应用级预热，数据库连接由Repository系统统一管理
      // 预热一些不依赖数据库的核心组件

      // 预热模板系统相关组件
      if (this.app.nunjucks) {
        this.app.logger.info('✅ 模板引擎预热完成');
      }

      // 预热缓存系统
      if (this.app.cache) {
        this.app.logger.info('✅ 缓存系统预热完成');
      }

      this.app.logger.info('🎉 应用预热完成（数据库连接将由Repository系统统一初始化）');
    } catch (error) {
      this.app.logger.error('❌ 应用预热失败:', error);
    }
  }

  async didReady() {
    const _theApp = this.app;

    // 初始化统一缓存系统
    _theApp.cache = new UnifiedCache(_theApp);
    _theApp.logger.info('🚀 统一缓存系统已初始化:', _theApp.cache.getInfo());

    // 🔥 初始化 Webhook 队列
    try {
      const WebhookQueue = require('./app/lib/webhookQueue');
      _theApp.webhookQueue = new WebhookQueue(_theApp);
      await _theApp.webhookQueue.init();
      _theApp.logger.info('✅ Webhook 队列初始化成功');
    } catch (error) {
      _theApp.logger.error('❌ Webhook 队列初始化失败:', error);
      // 不阻止应用启动，Webhook 功能可选
    }

    // 初始化权限注册表
    await this.initializePermissionRegistry();
    try {
      this.app.permissionWhiteList = this.app.getPermissionWhiteList();
      this.app.logger.info(
        '✅ 权限白名单初始化完成，当前全局白名单: %d 条',
        Array.isArray(this.app.permissionWhiteList) ? this.app.permissionWhiteList.length : 0
      );
    } catch (error) {
      this.app.logger.warn('⚠️ 权限白名单初始化失败: %s', error.message);
    }

    // 按模块裁剪初始化数据（菜单等）
    // 仅在开启模块裁剪开关时执行（CLI 生成的模板默认开启，源码默认关闭）
    if (this.app.config.modulePrune?.enabled) {
      await this.pruneDataByModules();
    }

    // 🚀 应用启动后进行缓存预热
    const cacheWarmupStartTime = Date.now();
    await this.initializeCacheWarmup();
    this.performanceStats.cacheWarmupTime = Date.now() - cacheWarmupStartTime;

    // 计算总启动时间并输出性能报告
    this.performanceStats.totalStartupTime = Date.now() - this.performanceStats.startTime;
    this.logPerformanceReport();

    // 缓存设置
    _theApp.messenger.on('refreshCache', by => {
      // _theApp.logger.info('start update by %s', by);
      const ctx = _theApp.createAnonymousContext();
      ctx.runInBackground(async () => {
        const { key, value, time } = by;
        await _theApp.cache.set(key, value, time ? Math.floor(time / 1000) : null);
      });
    });
    // 缓存清除
    _theApp.messenger.on('clearCache', by => {
      _theApp.logger.info('start clear by %s', by);
      const ctx = _theApp.createAnonymousContext();
      ctx.runInBackground(async () => {
        const { key } = by;
        if (key) {
          await _theApp.cache.delete(key);
        }
      });
    });
    // 应用初始化
    const thisCtx = this.app.createAnonymousContext();
    this.app.init(thisCtx);
  }

  /**
   * 根据 modules.config.js 禁用未启用模块的初始化数据
   */
  async pruneDataByModules() {
    try {
      const repoConfig = this.app.config.repository || {};
      if (repoConfig.enabled !== true) {
        this.app.logger.info('🧹 模块数据裁剪已跳过：Repository 模式未启用');
        return;
      }

      const result = await pruneModuleData(this.app);
      if (result.skipped) {
        this.app.logger.info('🧹 模块数据裁剪已跳过：%s', result.reason || '无可裁剪项');
        return;
      }

      this.app.logger.info(
        '🧹 模块数据裁剪完成，禁用模块: %s，菜单更新: %d',
        (result.disabledModules || []).join(', ') || '无',
        result.menuUpdated || 0
      );
    } catch (error) {
      this.app.logger.warn('⚠️ 模块数据裁剪失败: %s', error.message);
    }
  }

  /**
   * 🚀 初始化缓存预热 - 优化时机和策略
   */
  async initializeCacheWarmup() {
    try {
      this.app.logger.info('🔥 开始模板缓存预热...');

      // 改为立即执行，不延迟，提升首次访问体验
      const ctx = this.app.createAnonymousContext();

      // 检查TemplateService是否可用
      if (ctx.service && ctx.service.templateService) {
        // 阻塞式关键缓存预热，保证首屏不空白
        await ctx.service.templateService.warmupCriticalCache({
          maxRetries: 6,
          retryDelay: 1000,
        });

        // 异步执行完整缓存预热，不阻塞应用启动
        ctx.runInBackground(async () => {
          try {
            await ctx.service.templateService.warmupCache({
              batchSize: 1, // 减少并发度，避免启动时数据库压力
              batchDelay: 100, // 减少延迟，加快预热速度
            });
            // 🔥 优化：移除重复日志，templateService 中已经输出
          } catch (error) {
            this.app.logger.warn('⚠️ 模板缓存预热失败:', error.message);
          }
        });
      } else {
        this.app.logger.warn('⚠️ TemplateService 未就绪，跳过缓存预热');
      }
    } catch (error) {
      this.app.logger.error('❌ 缓存预热初始化失败:', error);
    }
  }

  /**
   * 📊 输出性能报告
   */
  logPerformanceReport() {
    const stats = this.performanceStats;
    const report = {
      '🚀 应用启动性能报告': '========================',
      配置加载时间: `${stats.configLoadTime}ms`,
      模板初始化时间: `${stats.templateInitTime}ms`,
      应用预热时间: `${stats.prewarmTime}ms`,
      Repository初始化时间: `${stats.repositoryInitTime}ms`,
      数据库初始化时间: `${stats.dbInitTime}ms`,
      缓存预热时间: `${stats.cacheWarmupTime}ms`,
      总启动时间: `${stats.totalStartupTime}ms`,
      启动完成时间: new Date().toISOString(),
    };

    this.app.logger.info('📊 启动性能报告:', report);

    // 性能警告
    if (stats.totalStartupTime > 30000) {
      this.app.logger.warn('⚠️ 应用启动时间超过30秒，建议优化');
    } else if (stats.totalStartupTime > 15000) {
      this.app.logger.warn('⚠️ 应用启动时间超过15秒，可考虑优化');
    } else {
      this.app.logger.info('✅ 应用启动性能良好');
    }
  }

  async initializePermissionRegistry() {
    try {
      const permissionConfig = this.app.config.permission || {};
      this.app.permissionRegistry = new PermissionRegistry(this.app.logger, {
        enableDebugLog: permissionConfig.debug === true,
      });

      const registryFiles = this.collectPermissionDefinitionFiles(permissionConfig);
      const repositoryEnabled = this.app.config.repository?.enabled && this.app.repositoryFactory;

      if (repositoryEnabled) {
        this.permissionDefinitionManager = new PermissionDefinitionManager(this.app, {
          hotReload: permissionConfig.hotReload || {},
        });
        await this.permissionDefinitionManager.initialize(this.app.permissionRegistry, registryFiles);
        this.app.permissionDefinitionManager = this.permissionDefinitionManager;
        if (!this.permissionDefinitionManagerCleanupRegistered) {
          this.permissionDefinitionManagerCleanupRegistered = true;
          this.app.beforeClose(async () => {
            // 关闭 Webhook 队列
            if (this.app.webhookQueue) {
              try {
                await this.app.webhookQueue.close();
                this.app.logger.info('✅ Webhook 队列已关闭');
              } catch (error) {
                this.app.logger.error('❌ Webhook 队列关闭失败:', error);
              }
            }

            // 关闭权限定义管理器
            if (this.permissionDefinitionManager) {
              await this.permissionDefinitionManager.dispose();
            }
          });
        }
      } else {
        registryFiles.forEach(filePath => {
          try {
            const definitions = require(filePath); // eslint-disable-line global-require
            if (Array.isArray(definitions) && definitions.length > 0) {
              this.app.permissionRegistry.register(definitions);
            }
          } catch (error) {
            this.app.logger.warn('权限定义加载失败: %s -> %s', filePath, error.message);
          }
        });
        this.app.logger.warn('⚠️ Repository 模式未启用，权限定义热加载功能已禁用');
      }

      this.app.logger.info(
        '✅ 权限注册表初始化完成，当前已注册 %d 条权限',
        this.app.permissionRegistry.getAll().length
      );
    } catch (error) {
      this.app.logger.error('❌ 权限注册表初始化失败:', error);
    }
  }

  collectPermissionDefinitionFiles(permissionConfig = {}) {
    const fileSet = new Set(
      Array.isArray(permissionConfig.registryFiles) ? permissionConfig.registryFiles.filter(Boolean) : []
    );

    const loadUnits = (this.app.loader && this.app.loader.getLoadUnits ? this.app.loader.getLoadUnits() : []) || [];
    loadUnits.forEach(unit => {
      if (!unit || !unit.path) return;
      const candidate = path.join(unit.path, 'app/permission/definitions/manage.js');
      if (fs.existsSync(candidate)) {
        fileSet.add(candidate);
      }
    });

    return Array.from(fileSet);
  }
}

module.exports = AppBootHook;
