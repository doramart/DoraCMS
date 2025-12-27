/**
 * Connection Loader
 * 动态加载主项目的数据库连接管理器
 *
 * 解决 npm 发布后相对路径问题
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const path = require('path');

/**
 * 动态加载 MariaDB 连接管理器
 * @param {Application} app Egg Application 实例
 * @return {MariaDBConnection} MariaDB 连接管理器实例
 */
function getMariaDBConnection(app) {
  // 如果已缓存，直接返回
  if (app._mariaDBConnection) {
    return app._mariaDBConnection;
  }

  const strategies = [
    // 策略 1: 从主项目的 baseDir 加载
    () => {
      const connectionPath = path.join(app.config.baseDir, 'app/repository/connections/MariaDBConnection');
      return require(connectionPath);
    },
    // 策略 2: 从 egg-cms 包加载（如果主项目是其他项目）
    () => {
      return require('egg-cms/app/repository/connections/MariaDBConnection');
    },
    // 策略 3: 从 node_modules 加载
    () => {
      const connectionPath = path.join(
        process.cwd(),
        'node_modules/egg-cms/app/repository/connections/MariaDBConnection'
      );
      return require(connectionPath);
    },
  ];

  let MariaDBConnection = null;
  let lastError = null;

  for (const strategy of strategies) {
    try {
      MariaDBConnection = strategy();
      if (MariaDBConnection) {
        app.logger.debug('[ConnectionLoader] MariaDB Connection loaded successfully');
        break;
      }
    } catch (error) {
      lastError = error;
      // 继续尝试下一个策略
    }
  }

  if (!MariaDBConnection) {
    const errorMsg =
      '[ConnectionLoader] Failed to load MariaDB Connection. ' +
      'Please ensure egg-cms is properly installed. ' +
      `Last error: ${lastError?.message || 'Unknown'}`;
    app.logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // 缓存到 app 实例
  app._mariaDBConnection = MariaDBConnection;

  return MariaDBConnection;
}

/**
 * 获取 MariaDB 连接实例（单例）
 * @param {Application} app Egg Application 实例
 * @return {Object} MariaDB 连接实例
 */
function getMariaDBConnectionInstance(app) {
  const MariaDBConnection = getMariaDBConnection(app);
  return MariaDBConnection.getInstance(app);
}

module.exports = {
  getMariaDBConnection,
  getMariaDBConnectionInstance,
};
