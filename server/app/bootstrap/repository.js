/*
 * @Author: AI Assistant
 * @Date: 2024-01-XX
 * @Last Modified by: AI Assistant
 * @Last Modified time: 2024-01-XX
 * @Description: Repository/Adapter 系统初始化
 */
'use strict';

const RepositoryFactory = require('../repository/factories/RepositoryFactory');
const MariaDBConnection = require('../repository/connections/MariaDBConnection');

/**
 * 初始化 Repository/Adapter 系统
 * @param {Application} app EggJS 应用实例
 */
async function initializeRepositorySystem(app) {
  try {
    app.logger.info('🔧 开始初始化 Repository/Adapter 系统...');

    // 检查是否启用 Repository 模式
    const repositoryConfig = app.config.repository;
    if (!repositoryConfig || !repositoryConfig.enabled) {
      app.logger.info('📝 Repository 模式未启用，跳过初始化');
      return;
    }

    // 获取数据库类型配置
    const databaseType = repositoryConfig.databaseType || 'mongodb';
    app.logger.info(`📊 当前数据库类型: ${databaseType}`);

    // 初始化数据库连接管理器
    await initializeDatabaseConnections(app, databaseType);

    // 初始化 Repository 工厂
    initializeRepositoryFactory(app);

    // 注册全局 Repository 访问器
    registerGlobalAccessors(app);

    // 添加应用退出时的清理
    registerCleanupHandlers(app);

    app.logger.info('✅ Repository/Adapter 系统初始化完成');
  } catch (error) {
    app.logger.error('❌ Repository/Adapter 系统初始化失败:', error);
    throw error;
  }
}

/**
 * 初始化数据库连接管理器
 * @param {Application} app EggJS 应用实例
 * @param {String} databaseType 数据库类型
 */
async function initializeDatabaseConnections(app, databaseType) {
  app.logger.info('🔗 初始化数据库连接管理器...');

  // MongoDB 连接 - 使用 EggJS 的 mongoose 连接
  if (databaseType === 'mongodb' || app.config.repository.mongodb?.useExistingConnection) {
    if (app.mongoose) {
      app.logger.info('✅ MongoDB 连接已通过 egg-mongoose 插件提供');
    } else {
      app.logger.warn('⚠️ MongoDB 连接未找到，请确保 egg-mongoose 插件已启用');
    }
  }

  // 初始化 MariaDB 连接管理器
  if (databaseType === 'mariadb') {
    try {
      app.mariaDB = new MariaDBConnection(app);
      await app.mariaDB.initialize();
      app.logger.info('✅ MariaDB 连接管理器初始化成功');
    } catch (error) {
      app.logger.error('❌ MariaDB 连接管理器初始化失败:', error);
      throw error;
    }
  }
}

/**
 * 初始化 Repository 工厂
 * @param {Application} app EggJS 应用实例
 */
function initializeRepositoryFactory(app) {
  app.logger.info('🏭 初始化 Repository 工厂...');

  // 创建全局 Repository 工厂实例
  app.repositoryFactory = new RepositoryFactory(app);

  // 预热 Repository 缓存（可选）
  if (app.config.repository.cache?.enabled) {
    app.logger.info('🔥 预热 Repository 缓存...');
    // 这里可以预先创建一些常用的 Repository 实例
  }

  app.logger.info('✅ Repository 工厂初始化完成');
}

/**
 * 注册全局访问器
 * @param {Application} app EggJS 应用实例
 */
function registerGlobalAccessors(app) {
  app.logger.info('🌐 注册全局 Repository 访问器...');

  // 在 Application 上添加便捷方法
  app.getRepository = function (repositoryName, ctx) {
    if (!this.repositoryFactory) {
      throw new Error('Repository 工厂未初始化');
    }

    const methodName = `create${repositoryName}Repository`;
    if (typeof this.repositoryFactory[methodName] !== 'function') {
      throw new Error(`Repository 方法 ${methodName} 不存在`);
    }

    return this.repositoryFactory[methodName](ctx);
  };

  // 在 Context 上添加便捷方法
  const ContextRepository = {
    getRepository(repositoryName) {
      return this.app.getRepository(repositoryName, this);
    },
  };

  // 扩展 Context 原型
  Object.assign(app.context, ContextRepository);

  app.logger.info('✅ 全局访问器注册完成');
}

/**
 * 注册清理处理器
 * @param {Application} app EggJS 应用实例
 */
function registerCleanupHandlers(app) {
  app.logger.info('🧹 注册应用退出清理处理器...');

  // 注册进程退出事件处理
  const cleanup = async () => {
    app.logger.info('🔄 开始清理 Repository 系统...');

    try {
      // 清理 Repository 工厂缓存
      if (app.repositoryFactory && typeof app.repositoryFactory.clearCache === 'function') {
        app.repositoryFactory.clearCache();
        app.logger.info('✅ Repository 缓存已清理');
      }

      // 关闭数据库连接
      if (app.mariaDB && typeof app.mariaDB.close === 'function') {
        await app.mariaDB.close();
        app.logger.info('✅ MariaDB 连接已关闭');
      }

      if (app.mongoose) {
        app.logger.info('✅ MongoDB 连接已关闭');
      }
    } catch (error) {
      app.logger.error('❌ Repository 系统清理失败:', error);
    }
  };

  // 绑定退出事件
  app.beforeClose(cleanup);

  app.logger.info('✅ 清理处理器注册完成');
}

/**
 * 获取 Repository 系统状态
 * @param {Application} app EggJS 应用实例
 * @return {Object} 系统状态信息
 */
function getRepositorySystemStatus(app) {
  const status = {
    enabled: app.config.repository?.enabled || false,
    databaseType: app.config.repository?.databaseType || 'unknown',
    connections: {},
    factory: {
      initialized: !!app.repositoryFactory,
      cacheEnabled: app.config.repository?.cache?.enabled || false,
    },
  };

  // 检查数据库连接状态
  if (app.mongoose) {
    status.connections.mongodb = {
      connected: true, // 使用 egg-mongoose 时，连接状态通常是 true
      models: app.mongoose.models.size,
    };
  }

  if (app.mariaDB) {
    status.connections.mariadb = {
      connected: app.mariaDB.isConnectedStatus(),
      models: app.mariaDB.models.size,
    };
  }

  return status;
}

// 导出初始化函数和工具函数
module.exports = {
  initializeRepositorySystem,
  getRepositorySystemStatus,
};

// 如果在 bootstrap 中直接运行，则执行初始化
if (typeof global !== 'undefined' && global.app) {
  initializeRepositorySystem(global.app).catch(error => {
    console.error('Repository 系统初始化失败:', error);
  });
}
