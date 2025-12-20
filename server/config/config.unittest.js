'use strict';

const defaultConfig = require('./config.default');

module.exports = appInfo => {
  const config = defaultConfig(appInfo);

  // 测试环境特殊配置
  config.env = 'unittest';

  // 禁用文件监听器，避免 cluster-client 连接问题
  config.watcher = {
    type: 'none',
  };

  // 禁用开发模式的文件监听
  config.development = {
    watchDirs: [],
  };

  // 禁用 cluster 模式，使用单进程
  config.cluster = {
    listen: {
      port: 0, // 使用随机端口
    },
  };

  // 禁用一些可能导致问题的中间件
  config.middleware = config.middleware.filter(middleware => !['compress'].includes(middleware));

  // 简化日志配置
  config.logger = {
    level: 'WARN',
    consoleLevel: 'WARN',
  };

  return config;
};
