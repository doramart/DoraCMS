/**
 * MariaDB 连接管理器
 * 使用 Sequelize 管理 MariaDB 连接
 */
'use strict';

const { Sequelize } = require('sequelize');
const path = require('path');

class MariaDBConnection {
  // 🔥 优化：实现单例模式，避免重复创建连接
  static instance = null;

  constructor(app) {
    this.app = app;
    this.sequelize = null;
    this.models = new Map();
    this.isConnected = false;
    this._initializing = false; // 添加初始化锁
    this._initialized = false; // 添加完全初始化标记
  }

  /**
   * 获取单例实例
   * @param {Object} app EggJS应用实例
   * @return {MariaDBConnection} 连接实例
   */
  static getInstance(app) {
    if (!MariaDBConnection.instance) {
      MariaDBConnection.instance = new MariaDBConnection(app);
    }
    return MariaDBConnection.instance;
  }

  /**
   * 初始化数据库连接
   * @return {Promise<void>}
   */
  async initialize() {
    // 🔥 增强初始化检查，防止重复初始化
    if (this._initialized && this.isConnected && this.sequelize && this.models.size > 0) {
      // this.app.logger.debug('MariaDB 连接已完全初始化，跳过重复初始化');
      return;
    }

    // 添加初始化锁，防止并发初始化
    if (this._initializing) {
      this.app.logger.debug('MariaDB 正在初始化中，等待完成...');
      // 等待初始化完成
      while (this._initializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this._initializing = true;
    try {
      this.app.logger.info('🔄 开始 MariaDB 连接初始化...');
    } catch (initError) {
      this._initializing = false;
      throw initError;
    }

    const config = this.app.config.repository.mariadb.sequelize;

    // 创建 Sequelize 实例
    this.sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: 'mysql',
      pool: config.pool,
      logging: config.logging || false,

      // MariaDB 特定配置
      dialectOptions: {
        charset: this.app.config.repository.mariadb.charset,
        // collate: this.app.config.repository.mariadb.collate, // 移除：MySQL2不支持连接级别的collate配置
        timezone: '+08:00', // 设置时区
      },

      // 连接选项
      define: {
        charset: this.app.config.repository.mariadb.charset,
        // collate: this.app.config.repository.mariadb.collate, // 移除：collate不适用于模型定义
        timestamps: true,
        underscored: false, // 使用驼峰命名
        freezeTableName: true, // 不自动复数化表名
      },

      // 查询选项
      query: {
        raw: false, // 返回模型实例而不是纯数据
      },
    });

    try {
      // 测试连接
      await this.sequelize.authenticate();
      this.isConnected = true;
      // Expose sequelize instance for backward compatibility (e.g. health check)
      this.app.sequelize = this.sequelize;
      this.app.logger.info('MariaDB 数据库连接成功');

      // 初始化模型
      await this.initializeModels();

      // 标记初始化完成
      this._initialized = true;
      this.app.logger.info('🎉 MariaDB 连接初始化完全完成');
    } catch (error) {
      this.app.logger.error('MariaDB 数据库连接失败:', error);
      throw error;
    } finally {
      this._initializing = false; // 确保在任何情况下都释放锁
    }
  }

  /**
   * 初始化所有模型
   * @return {Promise<void>}
   * @private
   */
  async initializeModels() {
    const schemaDir = path.join(__dirname, '../schemas/mariadb');
    const fs = require('fs');

    // 检查 schema 目录是否存在
    if (!fs.existsSync(schemaDir)) {
      this.app.logger.warn('MariaDB schema 目录不存在:', schemaDir);
      return;
    }

    // 加载 SystemConfig 模型
    try {
      const SystemConfigSchema = require('../schemas/mariadb/SystemConfigSchema');
      const SystemConfig = SystemConfigSchema(this.sequelize, this.app);
      this.models.set('SystemConfig', SystemConfig);

      // this.app.logger.info('SystemConfig 模型加载成功');
    } catch (error) {
      this.app.logger.error('SystemConfig 模型加载失败:', error);
      throw error;
    }

    // 加载 User 模型
    try {
      const UserSchema = require('../schemas/mariadb/UserSchema');
      const User = UserSchema(this.sequelize, this.app);
      this.models.set('User', User);

      // this.app.logger.info('User 模型加载成功');
    } catch (error) {
      this.app.logger.error('User 模型加载失败:', error);
      throw error;
    }

    // 加载 ContentCategory 模型
    try {
      const ContentCategorySchema = require('../schemas/mariadb/ContentCategorySchema');
      const ContentCategory = ContentCategorySchema(this.sequelize, this.app);
      this.models.set('ContentCategory', ContentCategory);

      // this.app.logger.info('ContentCategory 模型加载成功');
    } catch (error) {
      this.app.logger.error('ContentCategory 模型加载失败:', error);
      throw error;
    }

    // 加载 ContentTag 模型
    try {
      const ContentTagSchema = require('../schemas/mariadb/ContentTagSchema');
      const ContentTag = ContentTagSchema(this.sequelize, this.app);
      this.models.set('ContentTag', ContentTag);

      // this.app.logger.info('ContentTag 模型加载成功');
    } catch (error) {
      this.app.logger.error('ContentTag 模型加载失败:', error);
      throw error;
    }

    // 加载 Admin 模型
    try {
      const AdminSchema = require('../schemas/mariadb/AdminSchema');
      const Admin = AdminSchema(this.sequelize, this.app);
      this.models.set('Admin', Admin);

      // this.app.logger.info('Admin 模型加载成功');
    } catch (error) {
      this.app.logger.error('Admin 模型加载失败:', error);
      throw error;
    }

    // 加载 Role 模型
    try {
      const RoleSchema = require('../schemas/mariadb/RoleSchema');
      const Role = RoleSchema(this.sequelize, this.app);
      this.models.set('Role', Role);

      // this.app.logger.info('Role 模型加载成功');
    } catch (error) {
      this.app.logger.error('Role 模型加载失败:', error);
      throw error;
    }

    // 加载 Menu 模型
    try {
      const MenuSchema = require('../schemas/mariadb/MenuSchema');
      const Menu = MenuSchema(this.sequelize, this.app);
      this.models.set('Menu', Menu);

      // this.app.logger.info('Menu 模型加载成功');
    } catch (error) {
      this.app.logger.error('Menu 模型加载失败:', error);
      throw error;
    }

    // 加载 Content 模型
    try {
      const ContentSchema = require('../schemas/mariadb/ContentSchema');
      const Content = ContentSchema(this.sequelize, this.app);
      this.models.set('Content', Content);

      // this.app.logger.info('Content 模型加载成功');
    } catch (error) {
      this.app.logger.error('Content 模型加载失败:', error);
      throw error;
    }

    // 🔥 加载 ContentCategoryRelation 关联表模型
    try {
      const ContentCategoryRelationSchema = require('../schemas/mariadb/ContentCategoryRelationSchema');
      const ContentCategoryRelation = ContentCategoryRelationSchema.define(this.sequelize);
      this.models.set('ContentCategoryRelation', ContentCategoryRelation);

      // this.app.logger.info('ContentCategoryRelation 模型加载成功');
    } catch (error) {
      this.app.logger.error('ContentCategoryRelation 模型加载失败:', error);
      throw error;
    }

    // 🔥 加载 ContentTagRelation 关联表模型
    try {
      const ContentTagRelationSchema = require('../schemas/mariadb/ContentTagRelationSchema');
      const ContentTagRelation = ContentTagRelationSchema.define(this.sequelize);
      this.models.set('ContentTagRelation', ContentTagRelation);

      // this.app.logger.info('ContentTagRelation 模型加载成功');
    } catch (error) {
      this.app.logger.error('ContentTagRelation 模型加载失败:', error);
      throw error;
    }

    // 加载 AdminRole 关联模型
    try {
      const AdminRoleSchema = require('../schemas/mariadb/AdminRoleSchema');
      const AdminRole = AdminRoleSchema(this.sequelize, this.app);
      this.models.set('AdminRole', AdminRole);

      // this.app.logger.info('AdminRole 模型加载成功');
    } catch (error) {
      this.app.logger.error('AdminRole 模型加载失败:', error);
      throw error;
    }

    // 加载 Template 模型 - 移到同步之前
    try {
      const TemplateSchema = require('../schemas/mariadb/TemplateSchema');
      const Template = TemplateSchema(this.sequelize, this.app);
      this.models.set('Template', Template);

      // this.app.logger.info('Template 模型加载成功');
    } catch (error) {
      this.app.logger.error('Template 模型加载失败:', error);
      throw error;
    }

    // 加载 Message 模型
    try {
      const MessageSchema = require('../schemas/mariadb/MessageSchema');
      const Message = MessageSchema(this.sequelize, this.app);
      this.models.set('Message', Message);

      // this.app.logger.info('Message 模型加载成功');
    } catch (error) {
      this.app.logger.error('Message 模型加载失败:', error);
      throw error;
    }

    // 加载 MailTemplate 模型
    try {
      const MailTemplateSchema = require('../schemas/mariadb/MailTemplateSchema');
      const MailTemplate = MailTemplateSchema(this.sequelize, this.app);
      this.models.set('MailTemplate', MailTemplate);

      // this.app.logger.info('MailTemplate 模型加载成功');
    } catch (error) {
      this.app.logger.error('MailTemplate 模型加载失败:', error);
      throw error;
    }

    // 加载 PermissionDefinition 模型
    try {
      const PermissionDefinitionSchema = require('../schemas/mariadb/PermissionDefinitionSchema');
      const PermissionDefinition = PermissionDefinitionSchema(this.sequelize, this.app);
      this.models.set('PermissionDefinition', PermissionDefinition);

      // this.app.logger.info('PermissionDefinition 模型加载成功');
    } catch (error) {
      this.app.logger.error('PermissionDefinition 模型加载失败:', error);
      throw error;
    }

    // 加载 SystemOptionLog 模型
    try {
      const SystemOptionLogSchema = require('../schemas/mariadb/SystemOptionLogSchema');
      const SystemOptionLog = SystemOptionLogSchema(this.sequelize, this.app);
      this.models.set('SystemOptionLog', SystemOptionLog);

      // this.app.logger.info('SystemOptionLog 模型加载成功');
    } catch (error) {
      this.app.logger.error('SystemOptionLog 模型加载失败:', error);
      throw error;
    }

    // 加载 UploadFile 模型
    try {
      const UploadFileSchema = require('../schemas/mariadb/UploadFileSchema');
      const UploadFile = UploadFileSchema(this.sequelize, this.app);
      this.models.set('UploadFile', UploadFile);

      // this.app.logger.info('UploadFile 模型加载成功');
    } catch (error) {
      this.app.logger.error('UploadFile 模型加载失败:', error);
      throw error;
    }

    // 加载 Plugin 模型
    try {
      const PluginSchema = require('../schemas/mariadb/PluginSchema');
      const Plugin = PluginSchema(this.sequelize, this.app);
      this.models.set('Plugin', Plugin);

      // this.app.logger.info('Plugin 模型加载成功');
    } catch (error) {
      this.app.logger.error('Plugin 模型加载失败:', error);
      throw error;
    }

    // 加载 ApiKey 模型
    try {
      const ApiKeySchema = require('../schemas/mariadb/ApiKeySchema');
      const ApiKey = ApiKeySchema(this.sequelize, this.app);
      this.models.set('ApiKey', ApiKey);

      // this.app.logger.info('ApiKey 模型加载成功');
    } catch (error) {
      this.app.logger.error('ApiKey 模型加载失败:', error);
      throw error;
    }

    // 加载 Ads 模型
    try {
      const AdsSchema = require('../schemas/mariadb/AdsSchema');
      const Ads = AdsSchema(this.sequelize, this.app);
      this.models.set('Ads', Ads);

      // this.app.logger.info('Ads 模型加载成功');
    } catch (error) {
      this.app.logger.error('Ads 模型加载失败:', error);
      throw error;
    }

    // 加载 AdsItems 模型
    try {
      const AdsItemsSchema = require('../schemas/mariadb/AdsItemsSchema');
      const AdsItems = AdsItemsSchema(this.sequelize, this.app);
      this.models.set('AdsItems', AdsItems);
    } catch (error) {
      this.app.logger.error('AdsItems 模型加载失败:', error);
      throw error;
    }

    // 加载 Webhook 模型
    try {
      const WebhookSchema = require('../schemas/mariadb/WebhookSchema');
      const Webhook = WebhookSchema(this.sequelize, this.app);
      this.models.set('Webhook', Webhook);

      // this.app.logger.info('Webhook 模型加载成功');
    } catch (error) {
      this.app.logger.error('Webhook 模型加载失败:', error);
      throw error;
    }

    // 加载 WebhookLog 模型
    try {
      const WebhookLogSchema = require('../schemas/mariadb/WebhookLogSchema');
      const WebhookLog = WebhookLogSchema(this.sequelize, this.app);
      this.models.set('WebhookLog', WebhookLog);

      // this.app.logger.info('WebhookLog 模型加载成功');
    } catch (error) {
      this.app.logger.error('WebhookLog 模型加载失败:', error);
      throw error;
    }

    // 🔥 建立所有模型的关联关系
    await this._setupModelAssociations();

    // 同步数据库结构（所有环境都执行，但生产环境更保守）
    await this.syncDatabase();
  }

  /**
   * 🔥 建立所有模型的关联关系
   * 在所有模型加载完成后，统一建立关联关系
   * @return {Promise<void>}
   * @private
   */
  async _setupModelAssociations() {
    try {
      this.app.logger.info('🔗 开始建立模型关联关系...');

      // 将所有模型转为普通对象，供associate方法使用
      const modelsMap = {};
      for (const [modelName, model] of this.models) {
        modelsMap[modelName] = model;
      }

      // 建立所有模型的关联关系
      let associatedModels = 0;
      for (const [modelName, model] of this.models) {
        if (model.associate && typeof model.associate === 'function') {
          try {
            model.associate(modelsMap);
            associatedModels++;
            // this.app.logger.debug(`✅ ${modelName} 关联关系建立成功`);
          } catch (error) {
            this.app.logger.warn(`⚠️ ${modelName} 关联关系建立失败:`, error.message);
          }
        } else {
          // this.app.logger.debug(`ℹ️ ${modelName} 无需建立关联关系`);
        }
      }

      // 验证关联关系
      this._validateAssociations();

      this.app.logger.info(`🎉 模型关联关系建立完成，共处理 ${associatedModels} 个模型`);
    } catch (error) {
      this.app.logger.error('❌ 建立模型关联关系失败:', error);
      throw error;
    }
  }

  /**
   * 🔥 验证关联关系是否正确建立
   * @private
   */
  _validateAssociations() {
    const validationResults = [];

    for (const [modelName, model] of this.models) {
      const associations = Object.keys(model.associations || {});
      if (associations.length > 0) {
        validationResults.push(`${modelName}: ${associations.join(', ')}`);
      }
    }

    if (validationResults.length > 0) {
      // 🔥 优化：详细关联信息改为 DEBUG 级别
      this.app.logger.debug('📋 已建立的关联关系:');
      validationResults.forEach(result => {
        this.app.logger.debug(`  ${result}`);
      });
    } else {
      this.app.logger.warn('⚠️ 未发现任何关联关系');
    }
  }

  /**
   * 同步数据库结构
   * @return {Promise<void>}
   * @private
   */
  async syncDatabase() {
    try {
      // 在开发环境中自动创建表
      await this.sequelize.sync({
        force: false, // 不强制重建表
        alter: false, // 临时禁用自动修改表结构，避免数据截断
        logging: false, // 关闭同步时的日志输出
      });

      this.app.logger.info('MariaDB 数据库结构同步完成');
    } catch (error) {
      this.app.logger.error('MariaDB 数据库结构同步失败:', error);
      throw error;
    }
  }

  /**
   * 获取模型
   * @param {String} modelName 模型名称
   * @return {Object} Sequelize 模型
   */
  getModel(modelName) {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }
    return model;
  }

  /**
   * 获取 Sequelize 实例
   * @return {Sequelize} Sequelize 实例
   */
  getSequelize() {
    if (!this.sequelize) {
      throw new Error('MariaDB connection not initialized');
    }
    return this.sequelize;
  }

  /**
   * 开始事务
   * @return {Promise<Transaction>} 事务实例
   */
  async beginTransaction() {
    return await this.sequelize.transaction();
  }

  /**
   * 执行原生 SQL
   * @param {String} sql SQL 语句
   * @param {Object} options 选项
   * @return {Promise<*>} 查询结果
   */
  async query(sql, options = {}) {
    return await this.sequelize.query(sql, options);
  }

  /**
   * 关闭连接
   * @return {Promise<void>}
   */
  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      this.sequelize = null;
      this.models.clear();
      this.isConnected = false;
      this.app.logger.info('MariaDB 数据库连接已关闭');
    }
  }

  /**
   * 检查连接状态
   * @return {Boolean} 是否已连接
   */
  isConnectedStatus() {
    return this.isConnected && this.sequelize;
  }

  /**
   * 获取连接统计信息
   * @return {Object} 连接统计
   */
  getConnectionStats() {
    if (!this.sequelize || !this.sequelize.connectionManager) {
      return {
        connected: false,
        pool: null,
      };
    }

    const pool = this.sequelize.connectionManager.pool;
    return {
      connected: this.isConnected,
      pool: pool
        ? {
            size: pool.size,
            available: pool.available,
            using: pool.using,
            waiting: pool.waiting,
          }
        : null,
      models: Array.from(this.models.keys()),
    };
  }

  /**
   * 健康检查
   * @return {Promise<Object>} 健康检查结果
   */
  async healthCheck() {
    try {
      if (!this.sequelize) {
        return { status: 'error', message: 'Connection not initialized' };
      }

      // 执行简单查询测试连接
      await this.sequelize.authenticate();

      const stats = this.getConnectionStats();

      // 检查关键表是否存在
      const [templateTableExists] = await this.sequelize.query("SHOW TABLES LIKE 'templates'");

      return {
        status: 'healthy',
        connected: this.isConnected,
        database: this.sequelize.config.database,
        host: this.sequelize.config.host,
        stats,
        tables: {
          templates: templateTableExists.length > 0,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        connected: false,
      };
    }
  }
}

module.exports = MariaDBConnection;
