'use strict';

/**
 * 数据库初始化脚本（命令行入口）
 * 复用 lib/dbInitializer 的核心逻辑
 *
 * 用法：
 *   pnpm run db:init          # 检测空数据库并初始化
 *   pnpm run db:init --force  # 强制重新初始化
 */

const path = require('path');
const fs = require('fs');

// 按优先级加载环境变量
function loadEnv() {
  const serverRoot = path.join(__dirname, '..');
  const envFiles = [path.join(serverRoot, '.env.local'), path.join(serverRoot, '.env')];

  for (const envPath of envFiles) {
    if (fs.existsSync(envPath)) {
      console.log(`📄 加载环境配置: ${path.basename(envPath)}`);
      require('dotenv').config({ path: envPath, override: true });
      break;
    }
  }
}

loadEnv();

// 检查命令行参数
const args = process.argv.slice(2);
const forceInit = args.includes('--force') || args.includes('-f');

if (forceInit) {
  process.env.DB_FORCE_INIT = 'true';
}

const databaseType = process.env.DATABASE_TYPE || 'mongodb';

console.log('🔧 数据库初始化脚本');
console.log('==================');
console.log(`   数据库类型: ${databaseType}`);
console.log(`   强制初始化: ${forceInit}`);
console.log('');

// 创建一个模拟的 app 对象供 DatabaseInitializer 使用
async function createMockApp() {
  const mockApp = {
    logger: {
      info: (...args) => console.log(...args),
      warn: (...args) => console.warn(...args),
      error: (...args) => console.error(...args),
    },
    config: {
      mongoose: { client: {} },
      repository: { mariadb: { sequelize: {} } },
    },
  };

  if (databaseType === 'mongodb') {
    const mongoose = require('mongoose');

    // 构建连接字符串
    const host = process.env.MONGODB_HOST || '127.0.0.1';
    const port = process.env.MONGODB_PORT || 27017;
    const username = process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    const database = process.env.MONGODB_DATABASE || 'doracms3';
    const authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';

    let uri = 'mongodb://';
    if (username && password) {
      uri += `${username}:${password}@`;
    }
    uri += `${host}:${port}/${database}`;
    if (username && password) {
      uri += `?authSource=${authSource}`;
    }

    console.log(`🔗 连接 MongoDB: ${host}:${port}/${database}`);
    await mongoose.connect(uri);
    console.log('✅ MongoDB 连接成功\n');

    mockApp.mongoose = mongoose;
    mockApp.config.mongoose.client.url = uri;
    mockApp.config.mongoose.client.options = { dbName: database };
    mockApp.disconnect = () => mongoose.disconnect();
  } else if (databaseType === 'mariadb') {
    const { Sequelize } = require('sequelize');

    const host = process.env.MARIADB_HOST || '127.0.0.1';
    const port = process.env.MARIADB_PORT || 3307;
    const database = process.env.MARIADB_DATABASE || 'doracms3';
    const username = process.env.MARIADB_USERNAME || 'root';
    const password = process.env.MARIADB_PASSWORD || '';

    console.log(`🔗 连接 MariaDB: ${host}:${port}/${database}`);

    const sequelize = new Sequelize(database, username, password, {
      host,
      port,
      dialect: 'mysql',
      logging: false,
    });

    await sequelize.authenticate();
    console.log('✅ MariaDB 连接成功\n');

    mockApp.sequelize = sequelize;
    mockApp.config.repository.mariadb.sequelize = { database };
    mockApp.disconnect = () => sequelize.close();
  }

  return mockApp;
}

async function main() {
  let mockApp;

  try {
    mockApp = await createMockApp();

    // 复用 DatabaseInitializer
    const DatabaseInitializer = require('../lib/dbInitializer');
    const initializer = new DatabaseInitializer(mockApp);
    const result = await initializer.initialize();

    console.log('');
    if (result.skipped) {
      console.log(`ℹ️  ${result.reason}`);
    } else if (result.success) {
      console.log('🎉 初始化完成！');
      console.log(`   数据库: ${result.database}`);
      if (result.collections) console.log(`   集合数: ${result.collections}`);
      if (result.documents) console.log(`   文档数: ${result.documents}`);
      if (result.statements) console.log(`   SQL语句: ${result.statements}`);
    }
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    if (mockApp?.disconnect) {
      await mockApp.disconnect();
    }
  }
}

main();
