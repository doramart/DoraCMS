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
    const { app } = this;
    app.logger.info('[egg-ai-assistant] Plugin loading...');
  }

  /**
   * 应用启动完成后执行
   * 在此阶段注册 Repository 并初始化数据库
   *
   * 注意：必须在 didReady 中注册，因为主项目的 RepositoryFactory 也在 willReady 中初始化
   * 插件的 willReady 可能在主项目的 willReady 之前执行，导致 RepositoryFactory 还不存在
   */
  async didReady() {
    const { app } = this;

    app.logger.info('[egg-ai-assistant] Plugin ready, starting initialization...');

    // 1. 首先注册 Repository（确保在使用前注册）
    if (!app.repositoryFactory) {
      app.logger.error(
        '[egg-ai-assistant] RepositoryFactory not found! Plugin cannot work without Repository pattern.'
      );
      app.logger.error('[egg-ai-assistant] Please ensure the main project has initialized RepositoryFactory.');
      return;
    }

    try {
      app.logger.info('[egg-ai-assistant] Registering repositories...');

      // 初始化 BaseRepositoryLoader（预加载基类）
      BaseRepositoryLoader.initialize(app);

      // 根据数据库类型注册 Models
      const dbType = app.config.repository?.databaseType || 'mongodb';
      if (dbType === 'mongodb') {
        // MongoDB 模式：加载 Mongoose Models
        this.registerMongoDBModels();
      } else if (dbType === 'mariadb') {
        // MariaDB 模式：注册 Sequelize Models
        await this.registerMariaDBModels();
      }

      // 动态注册 AI 相关的 Repository 配置
      this.registerRepositories();

      app.logger.info('[egg-ai-assistant] Repositories registered successfully');
    } catch (error) {
      app.logger.error('[egg-ai-assistant] Failed to register repositories:', error);
      throw error;
    }

    // 2. 运行数据库初始化脚本
    const config = app.config.aiAssistant || {};
    if (config.autoInit !== false) {
      try {
        await this.initDatabase();
        app.logger.info('[egg-ai-assistant] Database initialized successfully');
      } catch (error) {
        app.logger.error('[egg-ai-assistant] Database initialization failed:', error);
        // 不抛出错误，允许应用继续启动
      }
    } else {
      app.logger.info('[egg-ai-assistant] Auto-init disabled, skipping database initialization');
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

    app.logger.info('[egg-ai-assistant] Plugin closing, cleaning up...');

    try {
      // 清理 Repository 缓存
      if (app.repositoryFactory) {
        // 清理 AI 相关的 Repository 缓存
        const aiRepoNames = ['AIModel', 'PromptTemplate', 'AIUsageLog'];
        aiRepoNames.forEach(name => {
          try {
            app.repositoryFactory.clearCache(name);
          } catch (e) {
            // 忽略清理错误
          }
        });
        app.logger.info('[egg-ai-assistant] Repository cache cleared');
      }

      // 清理 BaseRepositoryLoader 缓存
      if (app._baseMongoRepository) {
        delete app._baseMongoRepository;
      }
      if (app._baseMariaRepository) {
        delete app._baseMariaRepository;
      }
      if (app._repositoryExceptions) {
        delete app._repositoryExceptions;
      }

      app.logger.info('[egg-ai-assistant] Plugin closed successfully');
    } catch (error) {
      app.logger.error('[egg-ai-assistant] Error during cleanup:', error);
    }
  }

  /**
   * 注册 MongoDB 模型
   * 需要在注册 Repository 之前执行
   * @private
   */
  registerMongoDBModels() {
    const { app } = this;

    app.logger.info('[egg-ai-assistant] Registering MongoDB models...');

    try {
      // 加载并注册 AIModel Schema
      const AIModelSchema = require('./app/model/aiModel');
      app.model.AIModel = AIModelSchema(app);
      app.logger.info('[egg-ai-assistant] AIModel registered');

      // 加载并注册 PromptTemplate Schema
      const PromptTemplateSchema = require('./app/model/promptTemplate');
      app.model.PromptTemplate = PromptTemplateSchema(app);
      app.logger.info('[egg-ai-assistant] PromptTemplate registered');

      // 加载并注册 AIUsageLog Schema
      const AIUsageLogSchema = require('./app/model/aiUsageLog');
      app.model.AIUsageLog = AIUsageLogSchema(app);
      app.logger.info('[egg-ai-assistant] AIUsageLog registered');

      app.logger.info('[egg-ai-assistant] All MongoDB models registered successfully');
    } catch (error) {
      app.logger.error('[egg-ai-assistant] Failed to register MongoDB models:', error);
      throw error;
    }
  }

  /**
   * 注册 MariaDB Models 到连接管理器
   * 需要在注册 Repository 之前执行
   * @private
   */
  async registerMariaDBModels() {
    const { app } = this;

    app.logger.info('[egg-ai-assistant] Registering MariaDB models...');

    try {
      // 动态获取 MariaDB 连接管理器（支持 npm 发布）
      const ConnectionLoader = require('./app/repository/base/ConnectionLoader');
      const connection = ConnectionLoader.getMariaDBConnectionInstance(app);

      // 确保连接已初始化
      await connection.initialize();

      const sequelize = connection.sequelize;

      // 加载并注册 AIModel Schema
      const AIModelSchema = require('./app/repository/schemas/mariadb/AIModelSchema');
      const AIModel = AIModelSchema(sequelize, app);
      connection.models.set('AIModel', AIModel);
      app.logger.info('[egg-ai-assistant] AIModel registered');

      // 加载并注册 PromptTemplate Schema
      const PromptTemplateSchema = require('./app/repository/schemas/mariadb/PromptTemplateSchema');
      const PromptTemplate = PromptTemplateSchema(sequelize, app);
      connection.models.set('PromptTemplate', PromptTemplate);
      app.logger.info('[egg-ai-assistant] PromptTemplate registered');

      // 加载并注册 AIUsageLog Schema
      const AIUsageLogSchema = require('./app/repository/schemas/mariadb/AIUsageLogSchema');
      const AIUsageLog = AIUsageLogSchema(sequelize, app);
      connection.models.set('AIUsageLog', AIUsageLog);
      app.logger.info('[egg-ai-assistant] AIUsageLog registered');

      // 调用 associate() 建立模型关联关系
      // 构建 models 对象供 associate() 使用
      const pluginModels = {
        AIModel,
        PromptTemplate,
        AIUsageLog,
      };

      if (typeof AIModel.associate === 'function') {
        AIModel.associate(pluginModels);
        app.logger.info('[egg-ai-assistant] AIModel associations established');
      }
      if (typeof PromptTemplate.associate === 'function') {
        PromptTemplate.associate(pluginModels);
        app.logger.info('[egg-ai-assistant] PromptTemplate associations established');
      }
      if (typeof AIUsageLog.associate === 'function') {
        AIUsageLog.associate(pluginModels);
        app.logger.info('[egg-ai-assistant] AIUsageLog associations established');
      }

      app.logger.info('[egg-ai-assistant] All MariaDB models registered successfully');
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

    // 获取数据库类型配置
    const dbType = app.config.repository?.databaseType || 'mongodb';

    app.logger.info(`[egg-ai-assistant] Registering repositories for database type: ${dbType}`);

    // 注册 AI Model Repository
    // 注意：MongoDB 和 MariaDB 都使用工厂函数模式
    repositoryFactory.addRepositoryConfig('AIModel', {
      mongodb: () => require('./app/repository/adapters/mongodb/AIModelMongoRepository')(app),
      mariadb: () => require('./app/repository/adapters/mariadb/AIModelMariaRepository')(app),
    });

    // 注册 Prompt Template Repository
    repositoryFactory.addRepositoryConfig('PromptTemplate', {
      mongodb: () => require('./app/repository/adapters/mongodb/PromptTemplateMongoRepository')(app),
      mariadb: () => require('./app/repository/adapters/mariadb/PromptTemplateMariaRepository')(app),
    });

    // 注册 AI Usage Log Repository
    repositoryFactory.addRepositoryConfig('AIUsageLog', {
      mongodb: () => require('./app/repository/adapters/mongodb/AIUsageLogMongoRepository')(app),
      mariadb: () => require('./app/repository/adapters/mariadb/AIUsageLogMariaRepository')(app),
    });

    app.logger.info('[egg-ai-assistant] 3 repositories registered (AIModel, PromptTemplate, AIUsageLog)');
  }

  /**
   * 初始化数据库
   * 自动检测数据库类型并执行相应的初始化操作
   * @private
   */
  async initDatabase() {
    const { app } = this;
    const dbType = app.config.repository?.databaseType || 'mongodb';

    app.logger.info(`[egg-ai-assistant] Initializing database (${dbType})...`);

    try {
      // 加载并执行初始化脚本
      const initScript = require('./migrations/scripts/init-database');
      await initScript(app);

      app.logger.info('[egg-ai-assistant] Database initialization completed');
    } catch (error) {
      // 如果是因为数据已存在导致的错误，只是警告
      if (error.message && error.message.includes('already exists')) {
        app.logger.warn('[egg-ai-assistant] Database already initialized, skipping...');
      } else {
        app.logger.error('[egg-ai-assistant] Database initialization error:', error);
        throw error;
      }
    }
  }

  /**
   * 扩展静态资源配置
   * 将插件的静态资源目录添加到主应用的静态资源配置中
   * @private
   */
  extendStaticConfig() {
    const { app } = this;
    const pluginStaticConfig = app.config.aiAssistantStatic;

    if (!pluginStaticConfig || !pluginStaticConfig.enabled) {
      app.logger.info('[egg-ai-assistant] Plugin static resources disabled');
      return;
    }

    try {
      // 获取当前的静态资源配置
      const currentStaticConfig = app.config.static || {};
      const currentDirs = currentStaticConfig.dir || [];

      // 确保 dir 是数组格式
      const staticDirs = Array.isArray(currentDirs) ? [...currentDirs] : [currentDirs];

      // 添加插件的静态资源目录
      const pluginStaticDir = pluginStaticConfig.dir;
      if (pluginStaticDir && !staticDirs.includes(pluginStaticDir)) {
        staticDirs.push(pluginStaticDir);
        app.logger.info(`[egg-ai-assistant] Added plugin static directory: ${pluginStaticDir}`);
      }

      // 更新应用的静态资源配置
      app.config.static = {
        ...currentStaticConfig,
        dir: staticDirs,
      };

      // 注册插件特定的静态资源路由
      this.registerPluginStaticRoute(pluginStaticConfig);

      app.logger.info('[egg-ai-assistant] Static resources configuration extended successfully');
      app.logger.info(`[egg-ai-assistant] Plugin static resources accessible at: ${pluginStaticConfig.prefix}`);
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
    app.logger.info(`[egg-ai-assistant] Registered static route handler for ${pluginStaticConfig.prefix}`);
  }

  /**
   * 注册路由
   * @private
   */
  registerRoutes() {
    const { app } = this;

    app.logger.info('[egg-ai-assistant] Registering routes...');

    try {
      // 加载管理后台路由（需要管理员权限）
      require('./app/router/manage/ai')(app);

      // 加载 API 路由（普通用户可用）
      require('./app/router/api/ai')(app);

      // app.logger.info('[egg-ai-assistant] Routes registered successfully');
      // app.logger.info('[egg-ai-assistant] === AI 模型配置管理 ===');
      // app.logger.info('[egg-ai-assistant]   - GET    /manage/ai/models');
      // app.logger.info('[egg-ai-assistant]   - GET    /manage/ai/models/:id');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/models');
      // app.logger.info('[egg-ai-assistant]   - PUT    /manage/ai/models/:id');
      // app.logger.info('[egg-ai-assistant]   - DELETE /manage/ai/models/:id');
      // app.logger.info('[egg-ai-assistant]   - PUT    /manage/ai/models/:id/toggle');
      // app.logger.info('[egg-ai-assistant]   - GET    /manage/ai/models/:id/stats');
      // app.logger.info('[egg-ai-assistant]   - DELETE /manage/ai/models/batch');
      // app.logger.info('[egg-ai-assistant]   - GET    /manage/ai/providers');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/test-api-key');
      // app.logger.info('[egg-ai-assistant] === AI 内容生成 ===');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/content/generate-title');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/content/generate-summary');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/content/extract-tags');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/content/match-category');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/content/optimize-seo');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/content/check-quality');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/content/generate-batch');
      // app.logger.info('[egg-ai-assistant]   - DELETE /manage/ai/content/cache');
      // app.logger.info('[egg-ai-assistant]   - GET    /manage/ai/content/cache/stats');
      // app.logger.info('[egg-ai-assistant] === 内容发布（AI 辅助） ===');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/content/publish');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/content/batch-publish');
      // app.logger.info('[egg-ai-assistant]   - POST   /manage/ai/content/preview');
      // app.logger.info('[egg-ai-assistant]   - GET    /manage/ai/content/publish-modes');
      // app.logger.info('[egg-ai-assistant]   - GET    /manage/ai/content/enhancement-options');
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
    const config = app.config.aiAssistant || {};
    const dbType = app.config.repository?.databaseType || 'mongodb';

    app.logger.info('[egg-ai-assistant] ========================================');
    app.logger.info('[egg-ai-assistant] AI Assistant Plugin Status:');
    app.logger.info('[egg-ai-assistant] ----------------------------------------');
    app.logger.info(`[egg-ai-assistant] Database Type: ${dbType}`);
    app.logger.info(`[egg-ai-assistant] Auto Init: ${config.autoInit !== false ? 'Enabled' : 'Disabled'}`);
    app.logger.info(`[egg-ai-assistant] Default Provider: ${config.defaultProvider || 'openai'}`);
    app.logger.info(`[egg-ai-assistant] Default Model: ${config.defaultModel || 'gpt-3.5-turbo'}`);
    app.logger.info(`[egg-ai-assistant] Fallback Enabled: ${config.fallbackEnabled !== false ? 'Yes' : 'No'}`);
    app.logger.info(`[egg-ai-assistant] Rate Limit: ${config.rateLimit?.enable ? 'Enabled' : 'Disabled'}`);
    app.logger.info(`[egg-ai-assistant] Cache: ${config.cache?.enable ? 'Enabled' : 'Disabled'}`);
    app.logger.info('[egg-ai-assistant] ----------------------------------------');
    app.logger.info('[egg-ai-assistant] Repositories:');
    app.logger.info('[egg-ai-assistant]   - AIModel');
    app.logger.info('[egg-ai-assistant]   - PromptTemplate');
    app.logger.info('[egg-ai-assistant]   - AIUsageLog');
    app.logger.info('[egg-ai-assistant] ========================================');
  }
}

module.exports = AIAssistantAppBootHook;
