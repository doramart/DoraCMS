'use strict';
const path = require('path');
const envConfig = require('./env');

module.exports = appInfo => {
  const config = {};

  // 数据库连接 - 使用环境变量构建的连接字符串
  config.mongoose = {
    client: {
      url: envConfig.MONGODB.URL,
      options: {
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    },
  };

  // 静态目录配置 - 使用环境变量或默认值
  const staticDirs = [path.join(appInfo.baseDir, 'app/public'), path.join(appInfo.baseDir, 'backstage')];

  // 如果配置了额外的静态路径，则添加
  if (envConfig.STORAGE.STATIC_PATH) {
    staticDirs.push(envConfig.STORAGE.STATIC_PATH);
  }

  config.static = {
    prefix: '/static',
    dir: staticDirs,
    maxAge: 31536000,
    buffer: true,
    dynamic: true,
    preload: false,
    maxFiles: 1000,
  };

  // 日志配置 - 使用环境变量
  config.logger = {
    dir: envConfig.STORAGE.LOG_DIR || path.join(appInfo.baseDir, 'logs'),
    level: envConfig.STORAGE.LOG_LEVEL || 'INFO',
    consoleLevel: envConfig.STORAGE.LOG_LEVEL || 'INFO',
  };

  // 生产环境安全配置 - 使用环境变量
  config.security = {
    csrf: {
      enable: false,
      ignoreJSON: false,
    },
    domainWhiteList: envConfig.CORS.DOMAIN_WHITELIST,
  };

  // 生产环境 cors 配置 - 使用环境变量
  const corsOrigins = envConfig.CORS.ORIGINS;
  config.cors = {
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true,
  };

  // 添加代理配置
  config.proxy = true;

  // 配置信任代理
  config.config = {
    proxy: true,
    ipHeaders: ['X-Forwarded-For', 'X-Real-IP'],
    protocolHeaders: ['X-Forwarded-Proto'],
  };

  // Redis 配置 - 使用环境变量
  if (envConfig.REDIS.HOST) {
    config.redis = {
      client: {
        port: envConfig.REDIS.PORT,
        host: envConfig.REDIS.HOST,
        password: envConfig.REDIS.PASSWORD || '',
        db: envConfig.REDIS.DB,
      },
    };
  }

  return config;
};
