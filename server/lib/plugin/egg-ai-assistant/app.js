/**
 * egg-ai-assistant Plugin Entry
 * AI 助手插件入口文件
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const BaseRepositoryLoader = require('./app/repository/base/BaseRepositoryLoader');

class AIAssistantAppBootHook {
  constructor(app) {
    this.app = app;
  }

  /**
   * 插件配置加载完成后执行
   * 注意：此时主项目的 RepositoryFactory 可能还未初始化
   */
  async didLoad() {
    // 静默加载
  }

  /**
   * 应用启动完成后执行
   * 在此阶段注册 Repository 并初始化数据库
   */
  async didReady() {
    const { app } = this;

    // 1. 首先注册 Repository（确保在使用前注册）
    if (!app.repositoryFactory) {
      app.logger.error('[egg-ai-assistant] RepositoryFactory not found!');
      return;
    }

    try {
      // 初始化 BaseRepositoryLoader（预加载基类）
      BaseRepositoryLoader.initialize(app);

      // 根据数据库类型注册 Models
      const dbType = app.config.repository?.databaseType || 'mongodb';
      if (dbType === 'mongodb') {
        this.registerMongoDBModels();
      } else if (dbType === 'mariadb') {
        await this.registerMariaDBModels();
      }

      // 动态注册 AI 相关的 Repository 配置
      this.registerRepositories();
    } catch (error) {
      app.logger.error('[egg-ai-assistant] Failed to register repositories:', error);
      throw error;
    }

    // 2. 运行数据库初始化脚本
    const config = app.config.aiAssistant || {};
    if (config.autoInit !== false) {
      try {
        await this.initDatabase();
      } catch (error) {
        app.logger.error('[egg-ai-assistant] Database initialization failed:', error);
      }
    }

    // 3. 扩展静态资源配置
    this.extendStaticConfig();

    // 4. 注册路由
    this.registerRoutes();

    // 5. 输出插件状态
    this.printPluginStatus();
  }

  /**
   * 应用即将关闭前执行
   * 清理 AI Repository 相关的缓存和资源
   */
  async beforeClose() {
    const { app } = this;

    try {
      // 清理 Repository 缓存
      if (app.repositoryFactory) {
        const aiRepoNames = ['AIModel', 'PromptTemplate', 'AIUsageLog'];
        aiRepoNames.forEach(name => {
          try {
            app.repositoryFactory.clearCache(name);
          } catch (e) {
            // 忽略清理错误
          }
        });
      }

      // 清理 BaseRepositoryLoader 缓存
      if (app._baseMongoRepository) delete app._baseMongoRepository;
      if (app._baseMariaRepository) delete app._baseMariaRepository;
      if (app._repositoryExceptions) delete app._repositoryExceptions;
    } catch (error) {
      app.logger.error('[egg-ai-assistant] Error during cleanup:', error);
    }
  }

  /**
   * 注册 MongoDB 模型
   * @private
   */
  registerMongoDBModels() {
    const { app } = this;

    try {
      const AIModelSchema = require('./app/model/aiModel');
      app.model.AIModel = AIModelSchema(app);

      const PromptTemplateSchema = require('./app/model/promptTemplate');
      app.model.PromptTemplate = PromptTemplateSchema(app);

      const AIUsageLogSchema = require('./app/model/aiUsageLog');
      app.model.AIUsageLog = AIUsageLogSchema(app);
    } catch (error) {
      app.logger.error('[egg-ai-assistant] Failed to register MongoDB models:', error);
      throw error;
    }
  }

  /**
   * 注册 MariaDB Models 到连接管理器
   * @private
   */
  async registerMariaDBModels() {
    const { app } = this;

    try {
      const ConnectionLoader = require('./app/repository/base/ConnectionLoader');
      const connection = ConnectionLoader.getMariaDBConnectionInstance(app);
      await connection.initialize();

      const sequelize = connection.sequelize;

      // 加载并注册模型
      const AIModelSchema = require('./app/repository/schemas/mariadb/AIModelSchema');
      const AIModel = AIModelSchema(sequelize, app);
      connection.models.set('AIModel', AIModel);

      const PromptTemplateSchema = require('./app/repository/schemas/mariadb/PromptTemplateSchema');
      const PromptTemplate = PromptTemplateSchema(sequelize, app);
      connection.models.set('PromptTemplate', PromptTemplate);

      const AIUsageLogSchema = require('./app/repository/schemas/mariadb/AIUsageLogSchema');
      const AIUsageLog = AIUsageLogSchema(sequelize, app);
      connection.models.set('AIUsageLog', AIUsageLog);

      // 建立模型关联关系
      const pluginModels = { AIModel, PromptTemplate, AIUsageLog };
      if (typeof AIModel.associate === 'function') AIModel.associate(pluginModels);
      if (typeof PromptTemplate.associate === 'function') PromptTemplate.associate(pluginModels);
      if (typeof AIUsageLog.associate === 'function') AIUsageLog.associate(pluginModels);
    } catch (error) {
      app.logger.error('[egg-ai-assistant] Failed to register MariaDB models:', error);
      throw error;
    }
  }

  /**
   * 注册 Repository 到主项目的 RepositoryFactory
   * @private
   */
  registerRepositories() {
    const { app } = this;
    const repositoryFactory = app.repositoryFactory;

    repositoryFactory.addRepositoryConfig('AIModel', {
      mongodb: () => require('./app/repository/adapters/mongodb/AIModelMongoRepository')(app),
      mariadb: () => require('./app/repository/adapters/mariadb/AIModelMariaRepository')(app),
    });

    repositoryFactory.addRepositoryConfig('PromptTemplate', {
      mongodb: () => require('./app/repository/adapters/mongodb/PromptTemplateMongoRepository')(app),
      mariadb: () => require('./app/repository/adapters/mariadb/PromptTemplateMariaRepository')(app),
    });

    repositoryFactory.addRepositoryConfig('AIUsageLog', {
      mongodb: () => require('./app/repository/adapters/mongodb/AIUsageLogMongoRepository')(app),
      mariadb: () => require('./app/repository/adapters/mariadb/AIUsageLogMariaRepository')(app),
    });
  }

  /**
   * 初始化数据库
   * @private
   */
  async initDatabase() {
    const { app } = this;

    try {
      const initScript = require('./migrations/scripts/init-database');
      await initScript(app);
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        app.logger.warn('[egg-ai-assistant] Database already initialized');
      } else {
        app.logger.error('[egg-ai-assistant] Database initialization error:', error);
        throw error;
      }
    }
  }

  /**
   * 扩展静态资源配置
   * @private
   */
  extendStaticConfig() {
    const { app } = this;
    const pluginStaticConfig = app.config.aiAssistantStatic;

    if (!pluginStaticConfig || !pluginStaticConfig.enabled) return;

    try {
      const currentStaticConfig = app.config.static || {};
      const currentDirs = currentStaticConfig.dir || [];
      const staticDirs = Array.isArray(currentDirs) ? [...currentDirs] : [currentDirs];

      const pluginStaticDir = pluginStaticConfig.dir;
      if (pluginStaticDir && !staticDirs.includes(pluginStaticDir)) {
        staticDirs.push(pluginStaticDir);
      }

      app.config.static = { ...currentStaticConfig, dir: staticDirs };
      this.registerPluginStaticRoute(pluginStaticConfig);
    } catch (error) {
      app.logger.error('[egg-ai-assistant] Failed to extend static configuration:', error);
    }
  }

  /**
   * 注册插件特定的静态资源路由
   * @param pluginStaticConfig
   * @private
   */
  registerPluginStaticRoute(pluginStaticConfig) {
    const { app } = this;
    const fs = require('fs');
    const path = require('path');

    // 创建静态资源路由处理器
    const staticHandler = async (ctx, next) => {
      const requestPath = ctx.path;
      const prefix = pluginStaticConfig.prefix;

      if (requestPath.startsWith(prefix)) {
        // 移除前缀，获取实际文件路径
        const relativePath = requestPath.substring(prefix.length);
        const filePath = path.join(pluginStaticConfig.dir, relativePath);

        try {
          // 检查文件是否存在
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            // 设置正确的 Content-Type
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
              '.css': 'text/css',
              '.js': 'application/javascript',
              '.html': 'text/html',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.gif': 'image/gif',
              '.svg': 'image/svg+xml',
              '.woff': 'font/woff',
              '.woff2': 'font/woff2',
              '.ttf': 'font/ttf',
              '.eot': 'application/vnd.ms-fontobject',
            };

            ctx.type = mimeTypes[ext] || 'application/octet-stream';
            ctx.body = fs.readFileSync(filePath);
            return;
          }
        } catch (error) {
          app.logger.error(`[egg-ai-assistant] Error serving static file ${filePath}:`, error);
        }
      }

      await next();
    };

    // 注册中间件
    app.use(staticHandler);
  }

  /**
   * 注册路由
   * @private
   */
  registerRoutes() {
    const { app } = this;

    try {
      require('./app/router/manage/v1/ai')(app);
      require('./app/router/api/v1/ai')(app);

      // app.logger.debug('[egg-ai-assistant] Routes registered successfully');
      // app.logger.debug('[egg-ai-assistant] === AI 模型配置管理 ===');
      // app.logger.debug('[egg-ai-assistant]   - GET    /manage/ai/models');
      // app.logger.debug('[egg-ai-assistant]   - GET    /manage/ai/models/:id');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/models');
      // app.logger.debug('[egg-ai-assistant]   - PUT    /manage/ai/models/:id');
      // app.logger.debug('[egg-ai-assistant]   - DELETE /manage/ai/models/:id');
      // app.logger.debug('[egg-ai-assistant]   - PUT    /manage/ai/models/:id/toggle');
      // app.logger.debug('[egg-ai-assistant]   - GET    /manage/ai/models/:id/stats');
      // app.logger.debug('[egg-ai-assistant]   - DELETE /manage/ai/models/batch');
      // app.logger.debug('[egg-ai-assistant]   - GET    /manage/ai/providers');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/test-api-key');
      // app.logger.debug('[egg-ai-assistant] === AI 内容生成 ===');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/content/generate-title');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/content/generate-summary');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/content/extract-tags');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/content/match-category');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/content/optimize-seo');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/content/check-quality');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/content/generate-batch');
      // app.logger.debug('[egg-ai-assistant]   - DELETE /manage/ai/content/cache');
      // app.logger.debug('[egg-ai-assistant]   - GET    /manage/ai/content/cache/stats');
      // app.logger.debug('[egg-ai-assistant] === 内容发布（AI 辅助） ===');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/content/publish');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/content/batch-publish');
      // app.logger.debug('[egg-ai-assistant]   - POST   /manage/ai/content/preview');
      // app.logger.debug('[egg-ai-assistant]   - GET    /manage/ai/content/publish-modes');
      // app.logger.debug('[egg-ai-assistant]   - GET    /manage/ai/content/enhancement-options');
    } catch (error) {
      app.logger.error('[egg-ai-assistant] Failed to register routes:', error);
      throw error;
    }
  }

  /**
   * 输出插件状态信息
   * @private
   */
  printPluginStatus() {
    const { app } = this;
    const dbType = app.config.repository?.databaseType || 'mongodb';
    app.logger.info(`[egg-ai-assistant] 插件已初始化 (${dbType}, 3 repositories)`);
  }
}

module.exports = AIAssistantAppBootHook;
