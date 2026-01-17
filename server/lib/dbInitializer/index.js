'use strict';

/**
 * 数据库初始化器（改进版）
 *
 * 改进点：
 * 1. 使用 system_configs 表记录初始化状态，避免误判
 * 2. 添加并发锁机制，防止多实例重复初始化
 * 3. 记录初始化元信息（版本、时间等）
 * 4. 增强错误处理和日志
 */

const path = require('path');
const fs = require('fs');

class DatabaseInitializer {
  constructor(app) {
    this.app = app;
    this.logger = app.logger;
    this.config = app.config;

    // 从环境变量获取配置
    this.databaseType = process.env.DATABASE_TYPE || 'mongodb';
    this.forceInit = process.env.DB_FORCE_INIT === 'true';
    this.skipInit = process.env.DB_SKIP_INIT === 'true';

    // 初始化数据目录
    const projectRoot = path.join(__dirname, '../../..');
    this.mongodbInitDir = path.join(projectRoot, 'docker/mongodb/initdata');
    this.mariadbInitFile = path.join(projectRoot, 'docker/mariadb/init/01-init-data.sql');

    // 初始化版本
    this.version = '1.0.0';
  }

  /**
   * 执行数据库初始化
   */
  async initialize() {
    // 检查是否跳过初始化
    if (this.skipInit) {
      this.logger.info('🔧 DB_SKIP_INIT=true，跳过数据库初始化');
      return { skipped: true, reason: 'DB_SKIP_INIT=true' };
    }

    this.logger.info('🔧 开始检查数据库初始化状态...');
    this.logger.info(`   数据库类型: ${this.databaseType}`);
    this.logger.info(`   强制初始化: ${this.forceInit}`);

    try {
      // 🔥 改进：优先检查初始化标记
      const initialized = await this.isInitialized();

      if (initialized && !this.forceInit) {
        const initInfo = await this.getInitializationInfo();
        this.logger.info('✅ 数据库已初始化:', initInfo);
        return { skipped: true, reason: '数据库已初始化（检测到 db_initialized 标记）', info: initInfo };
      }

      // 🔥 改进：添加并发锁
      const lockAcquired = await this.acquireInitLock();
      if (!lockAcquired) {
        this.logger.warn('⚠️  其他进程正在初始化数据库，跳过');
        return { skipped: true, reason: '其他进程正在初始化' };
      }

      try {
        if (this.forceInit) {
          this.logger.warn('⚠️  DB_FORCE_INIT=true，将强制重新初始化数据库');
          await this.clearInitializedMark();
        }

        // 执行初始化
        const result = await this.runInitialization();

        // 🔥 改进：标记为已初始化
        await this.markAsInitialized({
          version: this.version,
          result,
        });

        this.logger.info('🎉 数据库初始化完成！');
        return result;
      } finally {
        // 释放锁
        await this.releaseInitLock();
      }
    } catch (error) {
      this.logger.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 🔥 新增：检查数据库是否已初始化
   * 通过 system_configs 表中的 db_initialized 标记判断
   */
  async isInitialized() {
    try {
      if (this.databaseType === 'mongodb') {
        const mongoose = this.app.mongoose;
        if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1) {
          return false;
        }

        const db = mongoose.connection.db;
        const record = await db.collection('system_configs').findOne({ key: 'db_initialized' });
        return record !== null;
      } else if (this.databaseType === 'mariadb') {
        const sequelize = this.app.sequelize;
        if (!sequelize) {
          return false;
        }

        try {
          const [results] = await sequelize.query(
            "SELECT * FROM `system_configs` WHERE `key` = 'db_initialized' LIMIT 1"
          );
          return results.length > 0;
        } catch (error) {
          // 表不存在说明未初始化
          if (error.message.includes("doesn't exist")) {
            return false;
          }
          throw error;
        }
      }
    } catch (error) {
      this.logger.warn('检查初始化状态失败:', error.message);
      return false;
    }
    return false;
  }

  /**
   * 🔥 新增：获取初始化信息
   */
  async getInitializationInfo() {
    try {
      if (this.databaseType === 'mongodb') {
        const db = this.app.mongoose.connection.db;
        const record = await db.collection('system_configs').findOne({ key: 'db_initialized' });
        if (record && record.metadata) {
          try {
            return typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
          } catch (e) {
            return { initialized: true };
          }
        }
      } else if (this.databaseType === 'mariadb') {
        const [results] = await this.app.sequelize.query(
          "SELECT * FROM `system_configs` WHERE `key` = 'db_initialized' LIMIT 1"
        );
        // MariaDB: 元数据存储在 value 字段中
        if (results.length > 0 && results[0].value) {
          try {
            return JSON.parse(results[0].value);
          } catch (e) {
            return { initialized: true };
          }
        }
      }
    } catch (error) {
      this.logger.warn('获取初始化信息失败:', error.message);
    }
    return { initialized: true };
  }

  /**
   * 🔥 新增：标记数据库为已初始化
   * @param metadata
   */
  async markAsInitialized(metadata = {}) {
    const initMetadata = {
      version: metadata.version || this.version,
      initialized_at: new Date().toISOString(),
      database_type: this.databaseType,
      data_source: this.databaseType === 'mongodb' ? 'docker/mongodb/initdata' : 'docker/mariadb/init',
      initializer: 'DatabaseInitializer',
      ...metadata.result,
    };

    try {
      if (this.databaseType === 'mongodb') {
        const db = this.app.mongoose.connection.db;
        await db.collection('system_configs').updateOne(
          { key: 'db_initialized' },
          {
            $set: {
              key: 'db_initialized',
              value: 'true',
              type: 'system',
              public: 0,
              metadata: JSON.stringify(initMetadata),
              updatedAt: new Date(),
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      } else if (this.databaseType === 'mariadb') {
        // MariaDB: system_configs 表没有 metadata 列，将元数据存储在 value 中
        const metadataJson = JSON.stringify(initMetadata).replace(/'/g, "''");
        await this.app.sequelize.query(
          `INSERT INTO system_configs (\`key\`, value, type, public, updatedAt, createdAt) 
           VALUES ('db_initialized', '${metadataJson}', 'string', 0, NOW(), NOW())
           ON DUPLICATE KEY UPDATE value = '${metadataJson}', updatedAt = NOW()`
        );
      }

      this.logger.info('✅ 已标记数据库为已初始化');
    } catch (error) {
      this.logger.error('标记初始化状态失败:', error);
      throw error;
    }
  }

  /**
   * 🔥 新增：清除初始化标记
   */
  async clearInitializedMark() {
    try {
      if (this.databaseType === 'mongodb') {
        const db = this.app.mongoose.connection.db;
        await db.collection('system_configs').deleteOne({ key: 'db_initialized' });
      } else if (this.databaseType === 'mariadb') {
        await this.app.sequelize.query("DELETE FROM `system_configs` WHERE `key` = 'db_initialized'");
      }
      this.logger.info('🧹 已清除初始化标记');
    } catch (error) {
      this.logger.warn('清除初始化标记失败:', error.message);
    }
  }

  /**
   * 🔥 新增：获取初始化锁（防止并发初始化）
   */
  async acquireInitLock() {
    const lockKey = 'db_init_lock';
    const lockTimeout = 300000; // 5分钟超时

    try {
      if (this.databaseType === 'mongodb') {
        const db = this.app.mongoose.connection.db;
        const now = Date.now();

        // 尝试插入或更新锁记录
        const result = await db.collection('system_configs').updateOne(
          {
            key: lockKey,
            $or: [{ value: { $exists: false } }, { value: { $lt: (now - lockTimeout).toString() } }],
          },
          {
            $set: {
              key: lockKey,
              value: now.toString(),
              type: 'system',
              public: 0,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );

        const acquired = result.modifiedCount > 0 || result.upsertedCount > 0;
        if (acquired) {
          this.logger.info('🔒 已获取初始化锁');
        }
        return acquired;
      } else if (this.databaseType === 'mariadb') {
        // MariaDB 使用 GET_LOCK 函数
        const [result] = await this.app.sequelize.query("SELECT GET_LOCK('db_init_lock', 300) as locked");
        const acquired = result[0].locked === 1;
        if (acquired) {
          this.logger.info('🔒 已获取初始化锁');
        }
        return acquired;
      }
    } catch (error) {
      this.logger.warn('获取初始化锁失败:', error.message);
      return false;
    }
    return false;
  }

  /**
   * 🔥 新增：释放初始化锁
   */
  async releaseInitLock() {
    try {
      if (this.databaseType === 'mongodb') {
        const db = this.app.mongoose.connection.db;
        await db.collection('system_configs').deleteOne({ key: 'db_init_lock' });
        this.logger.info('🔓 已释放初始化锁');
      } else if (this.databaseType === 'mariadb') {
        await this.app.sequelize.query("SELECT RELEASE_LOCK('db_init_lock')");
        this.logger.info('🔓 已释放初始化锁');
      }
    } catch (error) {
      this.logger.warn('释放初始化锁失败:', error.message);
    }
  }

  /**
   * 检查数据库是否为空（保留作为备用检查）
   */
  async isDatabaseEmpty() {
    if (this.databaseType === 'mongodb') {
      return this.isMongoDBEmpty();
    } else if (this.databaseType === 'mariadb') {
      return this.isMariaDBEmpty();
    }
    throw new Error(`不支持的数据库类型: ${this.databaseType}`);
  }

  /**
   * 检查 MongoDB 是否为空
   */
  async isMongoDBEmpty() {
    try {
      const mongoose = this.app.mongoose;
      if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1) {
        this.logger.warn('⚠️  MongoDB 连接未就绪，跳过检查');
        return false;
      }

      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();

      // 过滤系统集合
      const userCollections = collections.filter(c => !c.name.startsWith('system.'));
      this.logger.info(`   MongoDB 集合数量: ${userCollections.length}`);

      return userCollections.length === 0;
    } catch (error) {
      this.logger.error('检查 MongoDB 状态失败:', error);
      return false;
    }
  }

  /**
   * 检查 MariaDB 是否为空
   */
  async isMariaDBEmpty() {
    try {
      const sequelize = this.app.sequelize;
      if (!sequelize) {
        this.logger.warn('⚠️  Sequelize 连接未就绪，跳过检查');
        return false;
      }

      const database = this.config.repository.mariadb.sequelize.database;
      const [results] = await sequelize.query(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '${database}'`
      );

      const tableCount = results[0]?.count || 0;
      this.logger.info(`   MariaDB 表数量: ${tableCount}`);

      return tableCount === 0;
    } catch (error) {
      this.logger.error('检查 MariaDB 状态失败:', error);
      return false;
    }
  }

  /**
   * 执行初始化
   */
  async runInitialization() {
    if (this.databaseType === 'mongodb') {
      return this.initializeMongoDB();
    } else if (this.databaseType === 'mariadb') {
      return this.initializeMariaDB();
    }
    throw new Error(`不支持的数据库类型: ${this.databaseType}`);
  }

  /**
   * 初始化 MongoDB
   */
  async initializeMongoDB() {
    this.logger.info('🔧 开始初始化 MongoDB...');

    if (!fs.existsSync(this.mongodbInitDir)) {
      this.logger.warn(`⚠️  MongoDB 初始化数据目录不存在: ${this.mongodbInitDir}`);
      return { success: false, reason: '初始化数据目录不存在' };
    }

    const mongoose = this.app.mongoose;
    const db = mongoose.connection.db;

    // 获取所有 BSON 文件
    const bsonFiles = fs.readdirSync(this.mongodbInitDir).filter(f => f.endsWith('.bson'));

    if (bsonFiles.length === 0) {
      this.logger.warn('⚠️  未找到 BSON 数据文件');
      return { success: false, reason: '未找到 BSON 数据文件' };
    }

    this.logger.info(`   找到 ${bsonFiles.length} 个 BSON 文件`);

    let importedCount = 0;
    let totalDocs = 0;

    // 使用 @cdxoo/mongodb-restore 导入 BSON 数据
    const mongoRestore = require('@cdxoo/mongodb-restore');

    for (const file of bsonFiles) {
      const collectionName = path.basename(file, '.bson');
      const filePath = path.join(this.mongodbInitDir, file);

      try {
        // 强制初始化时先清空集合
        if (this.forceInit) {
          try {
            await db.collection(collectionName).drop();
          } catch (e) {
            // 集合可能不存在，忽略
          }
        }

        // 使用 mongodb-restore 导入
        await mongoRestore.collection({
          uri: this.config.mongoose.client.url,
          database: this.config.mongoose.client.options?.dbName || process.env.MONGODB_DATABASE || 'doracms3',
          collection: collectionName,
          from: filePath,
          onCollectionExists: 'overwrite', // 如果集合已存在则覆盖
        });

        // 查询导入后的文档数量
        const docCount = await db.collection(collectionName).countDocuments();
        importedCount++;
        totalDocs += docCount;
        this.logger.info(`   ✅ ${collectionName}: ${docCount} 条记录`);
      } catch (error) {
        this.logger.error(`   ❌ ${collectionName} 导入失败:`, error.message);
      }
    }

    // 清理敏感数据表
    await this.cleanupSensitiveData('mongodb');

    return {
      success: true,
      database: 'mongodb',
      collections: importedCount,
      documents: totalDocs,
    };
  }

  /**
   * 初始化 MariaDB
   */
  async initializeMariaDB() {
    this.logger.info('🔧 开始初始化 MariaDB...');

    if (!fs.existsSync(this.mariadbInitFile)) {
      this.logger.warn(`⚠️  MariaDB 初始化数据文件不存在: ${this.mariadbInitFile}`);
      return { success: false, reason: '初始化数据文件不存在' };
    }

    const sequelize = this.app.sequelize;
    let sql = fs.readFileSync(this.mariadbInitFile, 'utf-8');

    // 移除 MariaDB dump 特有的注释和命令
    sql = this.cleanMariaDBSQL(sql);

    // 分割 SQL 语句
    const statements = this.splitSQLStatements(sql);
    let executedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    this.logger.info(`   解析到 ${statements.length} 条 SQL 语句`);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;

      // 跳过某些语句类型
      if (this.shouldSkipStatement(trimmed)) {
        skippedCount++;
        continue;
      }

      try {
        await sequelize.query(trimmed);
        executedCount++;
      } catch (error) {
        // 忽略某些预期的错误
        const ignorableErrors = [
          'already exists',
          'Duplicate entry',
          "doesn't exist",
          'Unknown table',
          "Table '",
          'Validation error',
          'foreign key constraint fails',
        ];

        const isIgnorable = ignorableErrors.some(e => error.message.includes(e));
        if (!isIgnorable) {
          // 只记录非预期错误，减少噪音
          if (!error.message.includes('You have an error in your SQL syntax')) {
            this.logger.warn(`   SQL 警告: ${error.message.substring(0, 100)}`);
          }
          errorCount++;
        }
      }
    }

    // 清理敏感数据表
    await this.cleanupSensitiveData('mariadb');

    this.logger.info(`   执行: ${executedCount} 条，跳过: ${skippedCount} 条，警告: ${errorCount} 条`);

    return {
      success: true,
      database: 'mariadb',
      statements: executedCount,
      skipped: skippedCount,
      warnings: errorCount,
    };
  }

  /**
   * 判断是否应该跳过某条 SQL 语句
   * @param sql
   */
  shouldSkipStatement(sql) {
    const skipPatterns = [
      /^SET\s+(NAMES|CHARACTER|GLOBAL|SESSION|@)/i,
      /^ALTER\s+DATABASE/i,
      /^ALTER\s+TABLE.*?(DISABLE|ENABLE)\s+KEYS/i,
      /^CREATE\s+DATABASE/i,
      /^USE\s+/i,
      /^LOCK\s+TABLES/i,
      /^UNLOCK\s+TABLES/i,
      /^COMMIT/i,
      /^SET\s+autocommit/i,
      /^\/\*[!M]/i, // MariaDB 特定注释
      /^\s*$/, // 空语句
    ];

    return skipPatterns.some(pattern => pattern.test(sql));
  }

  /**
   * 清理 MariaDB SQL 中的特殊语法
   * @param sql
   */
  cleanMariaDBSQL(sql) {
    return (
      sql
        // 移除 MariaDB 特定的版本注释
        .replace(/\/\*M!\d+.*?\*\//gs, '')
        .replace(/\/\*!\d+.*?\*\//gs, '')
        // 移除 LOCK/UNLOCK TABLES
        .replace(/LOCK TABLES.*?;/gis, '')
        .replace(/UNLOCK TABLES;?/gi, '')
        // 移除 autocommit 设置
        .replace(/set autocommit\s*=\s*\d+\s*;/gi, '')
        // 移除 commit 语句
        .replace(/^commit\s*;?\s*$/gim, '')
        // 移除 USE 语句
        .replace(/USE\s+`.*?`\s*;/gi, '')
        // 移除 CREATE DATABASE 语句
        .replace(/CREATE DATABASE.*?;/gi, '')
        // 移除 ALTER TABLE ... DISABLE/ENABLE KEYS
        .replace(/ALTER TABLE\s+`?\w+`?\s+(DISABLE|ENABLE)\s+KEYS\s*;/gi, '')
        // 移除 SET 变量语句
        .replace(/SET\s+@\w+\s*=\s*.*?;/gi, '')
        // 移除空行
        .replace(/^\s*[\r\n]/gm, '')
    );
  }

  /**
   * 分割 SQL 语句
   * @param sql
   */
  splitSQLStatements(sql) {
    const statements = [];
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const prevChar = sql[i - 1];

      if ((char === "'" || char === '"') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (char === ';' && !inString) {
        const stmt = current.trim();
        if (stmt) statements.push(stmt);
        current = '';
      } else {
        current += char;
      }
    }

    const lastStmt = current.trim();
    if (lastStmt) statements.push(lastStmt);

    return statements;
  }

  /**
   * 清理敏感数据表
   * @param dbType
   */
  async cleanupSensitiveData(dbType) {
    this.logger.info('🧹 清理敏感数据表...');

    const tablesToClean = [
      'admins',
      'admin_roles',
      'users',
      'contents',
      'upload_files',
      'messages',
      'ai_models', // AI 模型配置（包含加密的 API Key）
      'ai_usage_logs', // AI 使用日志
      'api_keys',
      'system_option_logs',
    ];

    if (dbType === 'mongodb') {
      const db = this.app.mongoose.connection.db;
      for (const table of tablesToClean) {
        try {
          const collection = db.collection(table);
          const result = await collection.deleteMany({});
          if (result.deletedCount > 0) {
            this.logger.info(`   清理 ${table}: ${result.deletedCount} 条`);
          }
        } catch (error) {
          // 集合可能不存在，忽略
        }
      }
    } else if (dbType === 'mariadb') {
      const sequelize = this.app.sequelize;
      for (const table of tablesToClean) {
        try {
          await sequelize.query(`DELETE FROM \`${table}\``);
          this.logger.info(`   清理 ${table}`);
        } catch (error) {
          // 表可能不存在，忽略
        }
      }
    }

    this.logger.info('✅ 敏感数据清理完成，系统将引导创建新管理员');
  }
}

module.exports = DatabaseInitializer;
