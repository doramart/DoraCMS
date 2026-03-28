'use strict';

const path = require('path');
const fs = require('fs');

/**
 * 智能环境变量加载
 * 根据 NODE_ENV 自动加载对应的环境配置文件
 */
function loadEnvironmentConfig() {
  // 🔥 优化：避免重复加载和日志输出
  if (global.__DOTENV_LOADED__) {
    return;
  }

  const env = process.env.NODE_ENV || 'development';
  const serverRoot = path.resolve(__dirname, '..');
  const projectRoot = process.cwd();

  // 定义环境文件优先级
  const envFiles = [
    { label: `server/.env.${env}.local`, path: path.join(serverRoot, `.env.${env}.local`) },
    { label: `server/.env.${env}`, path: path.join(serverRoot, `.env.${env}`) },
    { label: 'server/.env.local', path: path.join(serverRoot, '.env.local') },
    { label: 'server/.env', path: path.join(serverRoot, '.env') },
    { label: `.env.${env}.local`, path: path.join(projectRoot, `.env.${env}.local`) },
    { label: `.env.${env}`, path: path.join(projectRoot, `.env.${env}`) },
    { label: '.env.local', path: path.join(projectRoot, '.env.local') },
    { label: '.env', path: path.join(projectRoot, '.env') },
  ];

  let loaded = false;

  // 从高优先级到低优先级加载环境文件
  for (const { label, path: envPath } of envFiles) {
    if (fs.existsSync(envPath)) {
      console.log(`📄 加载环境配置: ${label}`);
      // 🔥 优化：禁用 dotenv 自己的日志输出
      require('dotenv').config({ path: envPath, debug: false, override: false });
      loaded = true;
      break; // 只加载第一个存在的文件
    }
  }

  // 如果没有找到任何环境文件，使用默认的 .env
  if (!loaded) {
    console.log('📄 使用默认环境配置: .env');
    require('dotenv').config({ debug: false, override: false });
  }

  // 🔥 标记已加载，避免重复
  global.__DOTENV_LOADED__ = true;
}

// 加载环境配置
loadEnvironmentConfig();

/**
 * 环境变量配置管理
 * 提供环境变量的加载、验证和默认值设置
 */

/**
 * 验证必需的环境变量是否存在
 */
function validateRequiredEnvVars() {
  const databaseType = process.env.DATABASE_TYPE || 'mongodb';
  const baseRequired = ['APP_KEYS', 'SESSION_SECRET', 'ENCRYPT_KEY', 'JWT_SECRET'];
  let dbRequired = [];

  if (databaseType === 'mongodb') {
    dbRequired = ['MONGODB_HOST', 'MONGODB_DATABASE', 'MONGODB_USERNAME', 'MONGODB_PASSWORD'];
  } else if (databaseType === 'mariadb') {
    dbRequired = ['MARIADB_HOST', 'MARIADB_DATABASE', 'MARIADB_USERNAME', 'MARIADB_PASSWORD'];
  }

  const required = [...baseRequired, ...dbRequired];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ 缺少必需的环境变量:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error(`\n当前数据库类型: ${databaseType}`);
    console.error('请检查 .env 文件或环境变量配置');
    process.exit(1);
  }

  const weakSecrets = new Set([ 'dora', 'doracms3', 'doracms_secret', 'change-me', 'changeme', 'secret', 'default' ]);
  const secretChecks = [
    { key: 'ENCRYPT_KEY', value: process.env.ENCRYPT_KEY },
    { key: 'JWT_SECRET', value: process.env.JWT_SECRET },
  ];

  const weakOrShort = secretChecks.filter(item => !item.value || item.value.length < 16 || weakSecrets.has(item.value));
  if (weakOrShort.length > 0) {
    console.error('❌ 以下安全密钥过弱，生产环境禁止启动:');
    weakOrShort.forEach(item => console.error(`   - ${item.key}`));
    console.error('请使用至少 16 位的高强度随机字符串');
    process.exit(1);
  }

  if (process.env.JWT_SECRET === process.env.ENCRYPT_KEY) {
    console.error('❌ JWT_SECRET 不能与 ENCRYPT_KEY 相同');
    process.exit(1);
  }
}

/**
 * 获取环境变量值，支持默认值
 * @param key
 * @param defaultValue
 */
function getEnv(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

/**
 * 获取布尔类型环境变量
 * @param key
 * @param defaultValue
 */
function getBoolEnv(key, defaultValue = false) {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * 获取数字类型环境变量
 * @param key
 * @param defaultValue
 */
function getNumberEnv(key, defaultValue = 0) {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 获取数组类型环境变量（逗号分隔）
 * @param key
 * @param defaultValue
 */
function getArrayEnv(key, defaultValue = []) {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

/**
 * 构建 MongoDB 连接字符串
 */
function buildMongodbUrl() {
  const host = getEnv('MONGODB_HOST', '127.0.0.1');
  const port = getNumberEnv('MONGODB_PORT', 27017);
  const username = getEnv('MONGODB_USERNAME');
  const password = getEnv('MONGODB_PASSWORD');
  const database = getEnv('MONGODB_DATABASE', 'doracms3');
  const authSource = getEnv('MONGODB_AUTH_SOURCE', 'admin');

  let url = 'mongodb://';

  if (username && password) {
    url += `${username}:${password}@`;
  }

  url += `${host}:${port}/${database}`;

  if (username && password) {
    url += `?authSource=${authSource}`;
  }

  return url;
}

// 在生产环境验证必需的环境变量
if (process.env.NODE_ENV === 'production') {
  validateRequiredEnvVars();
}

module.exports = {
  // 基础配置
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getNumberEnv('PORT', 8080),
  HOSTNAME: getEnv('HOSTNAME', '127.0.0.1'),
  WORKERS: getNumberEnv('EGG_WORKERS', 1), // Worker 进程数量，默认 1

  // 数据库配置
  MONGODB: {
    HOST: getEnv('MONGODB_HOST', '127.0.0.1'),
    PORT: getNumberEnv('MONGODB_PORT', 27017),
    USERNAME: getEnv('MONGODB_USERNAME'),
    PASSWORD: getEnv('MONGODB_PASSWORD'),
    DATABASE: getEnv('MONGODB_DATABASE', 'doracms3'),
    AUTH_SOURCE: getEnv('MONGODB_AUTH_SOURCE', 'admin'),
    URL: buildMongodbUrl(),
  },

  REDIS: {
    HOST: getEnv('REDIS_HOST', '127.0.0.1'),
    PORT: getNumberEnv('REDIS_PORT', 6379),
    PASSWORD: getEnv('REDIS_PASSWORD'),
    DB: getNumberEnv('REDIS_DB', 0),
  },

  // 安全配置
  SECURITY: {
    APP_KEYS: getEnv('APP_KEYS', 'doracms3'),
    SESSION_SECRET: getEnv('SESSION_SECRET', 'doracms_secret'),
    AUTH_COOKIE_NAME: getEnv('AUTH_COOKIE_NAME', 'doracms'),
    ENCRYPT_KEY: getEnv('ENCRYPT_KEY', 'dora'),
    JWT_SECRET: getEnv('JWT_SECRET', ''),
    JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '30day'),
    ADMIN_INIT_TOKEN: getEnv('ADMIN_INIT_TOKEN', ''),
    ADMIN_INIT_LOCAL_ONLY: getBoolEnv('ADMIN_INIT_LOCAL_ONLY', true),
  },

  // 文件存储配置
  STORAGE: {
    UPLOAD_PATH: getEnv('UPLOAD_PATH'),
    STATIC_PATH: getEnv('STATIC_PATH'),

    LOG_DIR: getEnv('LOG_DIR'),
    LOG_LEVEL: getEnv('LOG_LEVEL', 'INFO'),
  },

  // 第三方服务配置
  EXTERNAL: {
    CDN_ORIGIN: getEnv('CDN_ORIGIN', 'https://cdn.html-js.cn'),
    API_DOMAIN: getEnv('API_DOMAIN', 'https://api.html-js.cn'),
  },

  // CORS 和安全配置
  CORS: {
    ORIGINS: getArrayEnv('CORS_ORIGINS', ['http://localhost:9527']),
    DOMAIN_WHITELIST: getArrayEnv('DOMAIN_WHITELIST', ['http://localhost:8080']),
  },

  // MariaDB 配置
  MARIADB: {
    HOST: getEnv('MARIADB_HOST', '127.0.0.1'),
    PORT: getNumberEnv('MARIADB_PORT', 3307),
    DATABASE: getEnv('MARIADB_DATABASE', 'doracms3'),
    USERNAME: getEnv('MARIADB_USERNAME', 'root'),
    PASSWORD: getEnv('MARIADB_PASSWORD', '123456'),
    TABLE_PREFIX: getEnv('MARIADB_TABLE_PREFIX', 'dora_'),
  },

  // Repository 配置
  REPOSITORY: {
    DATABASE_TYPE: getEnv('DATABASE_TYPE', 'mongodb'),
    ENABLED: getBoolEnv('REPOSITORY_ENABLED', true),
  },

  // 工具函数
  getEnv,
  getBoolEnv,
  getNumberEnv,
  getArrayEnv,
};
