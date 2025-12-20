#!/usr/bin/env node

'use strict';

/**
 * 环境变量配置验证脚本
 * 验证环境变量配置是否正确，并检查必需的配置项
 */

const path = require('path');
const fs = require('fs');

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  colorLog('green', `✅ ${message}`);
}

function warning(message) {
  colorLog('yellow', `⚠️  ${message}`);
}

function error(message) {
  colorLog('red', `❌ ${message}`);
}

function info(message) {
  colorLog('blue', `ℹ️  ${message}`);
}

async function testEnvironmentConfig() {
  colorLog('blue', '\n🔍 DoraCMS 环境变量配置验证\n');

  let hasErrors = false;
  let hasWarnings = false;

  // 1. 检查 .env 文件是否存在
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    warning('.env 文件不存在，将使用默认配置');
    info('运行 `npm run setup-env` 来创建环境变量配置');
  } else {
    success('.env 文件存在');
  }

  // 2. 尝试加载环境变量配置
  let envConfig;
  try {
    envConfig = require('../config/env');
    success('环境变量配置模块加载成功');
  } catch (err) {
    error(`环境变量配置模块加载失败: ${err.message}`);
    hasErrors = true;
    return { hasErrors, hasWarnings };
  }

  // 3. 验证必需的配置项
  console.log('\n📋 验证必需配置项:');

  const requiredConfigs = [
    { path: 'MONGODB.HOST', description: 'MongoDB 主机地址' },
    { path: 'MONGODB.PORT', description: 'MongoDB 端口' },
    { path: 'MONGODB.DATABASE', description: 'MongoDB 数据库名' },
    { path: 'SECURITY.APP_KEYS', description: '应用密钥' },
    { path: 'SECURITY.SESSION_SECRET', description: '会话密钥' },
  ];

  for (const config of requiredConfigs) {
    const value = getNestedValue(envConfig, config.path);
    if (value) {
      success(
        `${config.description}: ${config.path.includes('SECRET') || config.path.includes('KEYS') ? '***' : value}`
      );
    } else {
      error(`缺少必需配置: ${config.description} (${config.path})`);
      hasErrors = true;
    }
  }

  // 4. 验证可选但重要的配置项
  console.log('\n📋 验证重要配置项:');

  const importantConfigs = [
    { path: 'MONGODB.URL', description: 'MongoDB 连接字符串' },
    { path: 'EXTERNAL.CDN_ORIGIN', description: 'CDN 域名' },
    { path: 'EXTERNAL.API_DOMAIN', description: 'API 域名' },
    { path: 'CORS.ORIGINS', description: 'CORS 允许源' },
  ];

  for (const config of importantConfigs) {
    const value = getNestedValue(envConfig, config.path);
    if (value) {
      if (Array.isArray(value)) {
        success(`${config.description}: [${value.join(', ')}]`);
      } else {
        success(`${config.description}: ${value}`);
      }
    } else {
      warning(`未配置: ${config.description} (${config.path})`);
      hasWarnings = true;
    }
  }

  // 5. 验证数据库连接字符串格式
  console.log('\n🔗 验证数据库连接:');

  const mongoUrl = envConfig.MONGODB.URL;
  if (mongoUrl) {
    try {
      const url = new URL(mongoUrl);
      if (url.protocol === 'mongodb:') {
        success('MongoDB 连接字符串格式正确');

        // 检查是否包含认证信息
        if (url.username && url.password) {
          success('包含认证信息');
        } else {
          info('未设置数据库认证信息（本地开发可选）');
        }
      } else {
        error('MongoDB 连接字符串协议不正确');
        hasErrors = true;
      }
    } catch (err) {
      error(`MongoDB 连接字符串格式错误: ${err.message}`);
      hasErrors = true;
    }
  }

  // 6. 检查安全配置
  console.log('\n🔐 验证安全配置:');

  const appKeys = envConfig.SECURITY.APP_KEYS;
  const sessionSecret = envConfig.SECURITY.SESSION_SECRET;

  if (appKeys && appKeys.length >= 16) {
    success('应用密钥长度充足');
  } else {
    warning('应用密钥太短，建议至少16位');
    hasWarnings = true;
  }

  if (sessionSecret && sessionSecret.length >= 32) {
    success('会话密钥长度充足');
  } else {
    warning('会话密钥太短，建议至少32位');
    hasWarnings = true;
  }

  // 7. 检查文件权限（仅限 Unix 系统）
  if (process.platform !== 'win32' && fs.existsSync(envPath)) {
    console.log('\n🔒 验证文件安全:');

    try {
      const stats = fs.statSync(envPath);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);

      if (mode === '600' || mode === '400') {
        success('.env 文件权限设置正确');
      } else {
        warning(`.env 文件权限为 ${mode}，建议设置为 600`);
        info('运行: chmod 600 .env');
        hasWarnings = true;
      }
    } catch (err) {
      warning(`无法检查文件权限: ${err.message}`);
    }
  }

  // 8. 环境特定检查
  console.log('\n🌍 环境特定检查:');

  const nodeEnv = envConfig.NODE_ENV;
  if (nodeEnv === 'production') {
    success('生产环境配置');

    // 生产环境特定检查
    if (!envConfig.MONGODB.USERNAME || !envConfig.MONGODB.PASSWORD) {
      error('生产环境必须设置数据库认证信息');
      hasErrors = true;
    }

    if (envConfig.SECURITY.APP_KEYS === 'doracms3') {
      error('生产环境不能使用默认的应用密钥');
      hasErrors = true;
    }

    if (!envConfig.STORAGE.LOG_DIR) {
      warning('生产环境建议设置专用日志目录');
      hasWarnings = true;
    }
  } else {
    info(`当前环境: ${nodeEnv}`);
  }

  return { hasErrors, hasWarnings };
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

async function main() {
  try {
    const { hasErrors, hasWarnings } = await testEnvironmentConfig();

    console.log('\n' + '='.repeat(50));

    if (hasErrors) {
      error('配置验证失败！存在错误需要修复。');
      console.log('\n💡 解决方案:');
      console.log('1. 运行 `npm run setup-env` 重新配置环境变量');
      console.log('2. 检查 .env 文件中的配置项');
      console.log('3. 参考 README_ENV.md 文档');
      process.exit(1);
    } else if (hasWarnings) {
      warning('配置验证通过，但存在一些建议改进的项目。');
      success('应用可以正常启动，但建议优化配置。');
      process.exit(0);
    } else {
      success('🎉 所有配置验证通过！');
      success('环境配置完美，可以安全启动应用。');
      process.exit(0);
    }
  } catch (error) {
    error(`验证过程中出现错误: ${error.message}`);
    console.log('\n🐛 调试信息:');
    console.log(error.stack);
    process.exit(1);
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { testEnvironmentConfig };
