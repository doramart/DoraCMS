/**
 * Base Repository Loader
 * 动态加载主项目的 Repository 基类
 * 解决 npm 发布后的路径问题
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const path = require('path');

class BaseRepositoryLoader {
  /**
   * 获取 BaseMongoRepository
   * @param {Application} app EggJS app 实例
   * @return {Class} BaseMongoRepository 类
   */
  static getBaseMongoRepository(app) {
    // 尝试多种加载方式
    const loadStrategies = [
      // 策略1: 从主项目的 baseDir 加载
      () => require(path.join(app.config.baseDir, 'app/repository/base/BaseMongoRepository')),

      // 策略2: 从缓存中获取（如果已经加载过）
      () => {
        if (app._baseMongoRepository) {
          return app._baseMongoRepository;
        }
        throw new Error('Not cached');
      },

      // 策略3: 尝试从包名加载（适用于主项目作为依赖的情况）
      () => require('egg-cms/app/repository/base/BaseMongoRepository'),
    ];

    for (const strategy of loadStrategies) {
      try {
        const BaseClass = strategy();
        // 缓存到 app 实例
        app._baseMongoRepository = BaseClass;
        return BaseClass;
      } catch (e) {
        // 继续尝试下一个策略
        continue;
      }
    }

    throw new Error(
      '[egg-ai-assistant] BaseMongoRepository not found. ' +
        'Please ensure the main project has the repository structure at app/repository/base/BaseMongoRepository'
    );
  }

  /**
   * 获取 BaseMariaRepository
   * @param {Application} app EggJS app 实例
   * @return {Class} BaseMariaRepository 类
   */
  static getBaseMariaRepository(app) {
    const loadStrategies = [
      () => require(path.join(app.config.baseDir, 'app/repository/base/BaseMariaRepository')),
      () => {
        if (app._baseMariaRepository) {
          return app._baseMariaRepository;
        }
        throw new Error('Not cached');
      },
      () => require('egg-cms/app/repository/base/BaseMariaRepository'),
    ];

    for (const strategy of loadStrategies) {
      try {
        const BaseClass = strategy();
        app._baseMariaRepository = BaseClass;
        return BaseClass;
      } catch (e) {
        continue;
      }
    }

    throw new Error(
      '[egg-ai-assistant] BaseMariaRepository not found. ' +
        'Please ensure the main project has the repository structure at app/repository/base/BaseMariaRepository'
    );
  }

  /**
   * 获取 RepositoryExceptions
   * @param {Application} app EggJS app 实例
   * @return {Object} RepositoryExceptions 对象
   */
  static getRepositoryExceptions(app) {
    const loadStrategies = [
      () => require(path.join(app.config.baseDir, 'app/repository/base/RepositoryExceptions')),
      () => {
        if (app._repositoryExceptions) {
          return app._repositoryExceptions;
        }
        throw new Error('Not cached');
      },
      () => require('egg-cms/app/repository/base/RepositoryExceptions'),
    ];

    for (const strategy of loadStrategies) {
      try {
        const Exceptions = strategy();
        app._repositoryExceptions = Exceptions;
        return Exceptions;
      } catch (e) {
        continue;
      }
    }

    throw new Error(
      '[egg-ai-assistant] RepositoryExceptions not found. ' +
        'Please ensure the main project has the repository structure at app/repository/base/RepositoryExceptions'
    );
  }

  /**
   * 创建 Repository 实例的工厂方法
   * @param {Class} RepositoryClass Repository 类
   * @param {Context} ctx EggJS context
   * @param {String} dbType 数据库类型 (mongodb/mariadb)
   * @return {Object} Repository 实例
   */
  static createRepository(RepositoryClass, ctx, dbType = 'mongodb') {
    const app = ctx.app;

    // 获取对应的基类
    const BaseClass = dbType === 'mongodb' ? this.getBaseMongoRepository(app) : this.getBaseMariaRepository(app);

    // 设置原型链
    if (!RepositoryClass.prototype.__baseSet) {
      Object.setPrototypeOf(RepositoryClass.prototype, BaseClass.prototype);
      RepositoryClass.prototype.__baseSet = true;
    }

    // 创建实例
    return new RepositoryClass(ctx);
  }

  /**
   * 初始化插件的 Repository 基类
   * 在插件启动时调用一次
   * @param {Application} app EggJS app 实例
   */
  static initialize(app) {
    try {
      // 预加载基类到缓存
      this.getBaseMongoRepository(app);
      this.getBaseMariaRepository(app);
      this.getRepositoryExceptions(app);

      app.logger.debug('[egg-ai-assistant] Repository base classes loaded successfully');
    } catch (error) {
      app.logger.error('[egg-ai-assistant] Failed to load repository base classes:', error);
      throw error;
    }
  }
}

module.exports = BaseRepositoryLoader;
