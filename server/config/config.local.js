'use strict';
const path = require('path');
const envConfig = require('./env');

module.exports = appInfo => {
  const config = {};

  // DEV_CONFIG_MODULES_BEGIN
  config.dev_modules = [
    // "navbar",
    // "dashboard",
    // 以下模块根据需要启用
  ];
  // DEV_CONFIG_MODULES_END

  // 数据库配置 - 使用环境变量或本地默认值
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

  // 静态资源配置
  const staticDirs = [path.join(appInfo.baseDir, 'app/public'), path.join(appInfo.baseDir, 'backstage')];

  // 如果配置了额外的静态路径，则添加
  if (envConfig.STORAGE.STATIC_PATH) {
    staticDirs.push(envConfig.STORAGE.STATIC_PATH);
  }

  config.static = {
    prefix: '/static',
    dir: staticDirs,
    maxAge: 31536000,
    buffer: true, // 缓存
    dynamic: true, // 动态加载
    preload: false,
    maxFiles: 1000,
  };

  // 日志配置 - 使用环境变量或本地默认值
  config.logger = {
    dir: envConfig.STORAGE.LOG_DIR || path.join(appInfo.baseDir, 'logs'),
    level: envConfig.STORAGE.LOG_LEVEL || 'DEBUG',
    consoleLevel: envConfig.STORAGE.LOG_LEVEL || 'DEBUG',
  };

  // 本地开发时的安全配置
  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList:
      envConfig.CORS.DOMAIN_WHITELIST.length > 0 ? envConfig.CORS.DOMAIN_WHITELIST : ['http://localhost:8080'],
  };

  // 本地开发时的 cors 配置
  config.cors = {
    origin: envConfig.CORS.ORIGINS.length > 0 ? envConfig.CORS.ORIGINS : '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
  };

  // Redis 配置 - 如果配置了环境变量则使用
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

  // 缓存配置 - 支持环境变量配置
  config.cache = {
    type: envConfig.getEnv('CACHE_TYPE', 'memory'), // 'redis' 或 'memory'
    defaultTTL: envConfig.getNumberEnv('CACHE_DEFAULT_TTL', 3600),
    maxSize: envConfig.getNumberEnv('MEMORY_CACHE_MAX_SIZE', 1000),
    namespace: envConfig.getEnv('CACHE_NAMESPACE', `${appInfo.name}:${envConfig.NODE_ENV}`),
    watch: {
      enabled: envConfig.getBoolEnv('CACHE_WATCH_ENABLED', true),
      channel: envConfig.getEnv('CACHE_WATCH_CHANNEL', 'unified-cache:watch'),
      broadcastValue: envConfig.getBoolEnv('CACHE_WATCH_BROADCAST_VALUE', true),
    },
  };

  return config;
};
