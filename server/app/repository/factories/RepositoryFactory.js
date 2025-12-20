/**
 * Repository 工厂类
 * 根据配置创建对应的 Repository 实例
 */
'use strict';

// MongoDB Repository 实现
const SystemConfigMongoRepository = require('../adapters/mongodb/SystemConfigMongoRepository');
const UserMongoRepository = require('../adapters/mongodb/UserMongoRepository');
const ContentCategoryMongoRepository = require('../adapters/mongodb/ContentCategoryMongoRepository');
const ContentTagMongoRepository = require('../adapters/mongodb/ContentTagMongoRepository');
const ContentMongoRepository = require('../adapters/mongodb/ContentMongoRepository');
const MenuMongoRepository = require('../adapters/mongodb/MenuMongoRepository');
const RoleMongoRepository = require('../adapters/mongodb/RoleMongoRepository');
const AdminMongoRepository = require('../adapters/mongodb/AdminMongoRepository');
const SystemOptionLogMongoRepository = require('../adapters/mongodb/SystemOptionLogMongoRepository');
const UploadFileMongoRepository = require('../adapters/mongodb/UploadFileMongoRepository');
const AdsItemsMongoRepository = require('../adapters/mongodb/AdsItemsMongoRepository');
const AdsMongoRepository = require('../adapters/mongodb/AdsMongoRepository');
const PluginMongoRepository = require('../adapters/mongodb/PluginMongoRepository');
const MailTemplateMongoRepository = require('../adapters/mongodb/MailTemplateMongoRepository');
const ApiKeyMongoRepository = require('../adapters/mongodb/ApiKeyMongoRepository');
const MessageMongoRepository = require('../adapters/mongodb/MessageMongoRepository');
const MessageInteractionMongoRepository = require('../adapters/mongodb/MessageInteractionRepository');
const ContentInteractionMongoRepository = require('../adapters/mongodb/ContentInteractionRepository');
const TemplateMongoRepository = require('../adapters/mongodb/TemplateMongoRepository');
const PermissionDefinitionMongoRepository = require('../adapters/mongodb/PermissionDefinitionMongoRepository');

// MariaDB Repository 实现 - 条件加载
let mariaDBRepositories = {};

// 只在需要时加载 MariaDB 仓库
function loadMariaDBRepositories() {
  if (Object.keys(mariaDBRepositories).length === 0) {
    try {
      mariaDBRepositories = {
        SystemConfig: require('../adapters/mariadb/SystemConfigMariaRepository'),
        User: require('../adapters/mariadb/UserMariaRepository'),
        ContentCategory: require('../adapters/mariadb/ContentCategoryMariaRepository'),
        ContentTag: require('../adapters/mariadb/ContentTagMariaRepository'),
        Content: require('../adapters/mariadb/ContentMariaRepository'),
        Menu: require('../adapters/mariadb/MenuMariaRepository'),
        Role: require('../adapters/mariadb/RoleMariaRepository'),
        Admin: require('../adapters/mariadb/AdminMariaRepository'),
        SystemOptionLog: require('../adapters/mariadb/SystemOptionLogMariaRepository'),
        UploadFile: require('../adapters/mariadb/UploadFileMariaRepository'),
        AdsItems: require('../adapters/mariadb/AdsItemsMariaRepository'),
        Ads: require('../adapters/mariadb/AdsMariaRepository'),
        Plugin: require('../adapters/mariadb/PluginMariaRepository'),
        MailTemplate: require('../adapters/mariadb/MailTemplateMariaRepository'),
        ApiKey: require('../adapters/mariadb/ApiKeyMariaRepository'),
        Message: require('../adapters/mariadb/MessageMariaRepository'),
        MessageInteraction: require('../adapters/mariadb/MessageInteractionRepository'),
        ContentInteraction: require('../adapters/mariadb/ContentInteractionRepository'),
        Template: require('../adapters/mariadb/TemplateMariaRepository'),
        PermissionDefinition: require('../adapters/mariadb/PermissionDefinitionMariaRepository'),
      };
    } catch (error) {
      console.warn('MariaDB repositories not available:', error.message);
    }
  }
}

class RepositoryFactory {
  constructor(app) {
    this.app = app;
    this.repositories = new Map(); // 缓存 Repository 实例

    // Repository 映射配置
    this.repositoryMap = {
      SystemConfig: {
        mongodb: SystemConfigMongoRepository,
        mariadb: () => mariaDBRepositories.SystemConfig,
      },
      User: {
        mongodb: UserMongoRepository,
        mariadb: () => mariaDBRepositories.User,
      },
      ContentCategory: {
        mongodb: ContentCategoryMongoRepository,
        mariadb: () => mariaDBRepositories.ContentCategory,
      },
      ContentTag: {
        mongodb: ContentTagMongoRepository,
        mariadb: () => mariaDBRepositories.ContentTag,
      },
      Content: {
        mongodb: ContentMongoRepository,
        mariadb: () => mariaDBRepositories.Content,
      },
      Menu: {
        mongodb: MenuMongoRepository,
        mariadb: () => mariaDBRepositories.Menu,
      },
      Role: {
        mongodb: RoleMongoRepository,
        mariadb: () => mariaDBRepositories.Role,
      },
      Admin: {
        mongodb: AdminMongoRepository,
        mariadb: () => mariaDBRepositories.Admin,
      },
      SystemOptionLog: {
        mongodb: SystemOptionLogMongoRepository,
        mariadb: () => mariaDBRepositories.SystemOptionLog,
      },
      UploadFile: {
        mongodb: UploadFileMongoRepository,
        mariadb: () => mariaDBRepositories.UploadFile,
      },
      AdsItems: {
        mongodb: AdsItemsMongoRepository,
        mariadb: () => mariaDBRepositories.AdsItems,
      },
      Ads: {
        mongodb: AdsMongoRepository,
        mariadb: () => mariaDBRepositories.Ads,
      },
      Plugin: {
        mongodb: PluginMongoRepository,
        mariadb: () => mariaDBRepositories.Plugin,
      },
      MailTemplate: {
        mongodb: MailTemplateMongoRepository,
        mariadb: () => mariaDBRepositories.MailTemplate,
      },
      ApiKey: {
        mongodb: ApiKeyMongoRepository,
        mariadb: () => mariaDBRepositories.ApiKey,
      },
      Message: {
        mongodb: MessageMongoRepository,
        mariadb: () => mariaDBRepositories.Message,
      },
      MessageInteraction: {
        mongodb: MessageInteractionMongoRepository,
        mariadb: () => mariaDBRepositories.MessageInteraction,
      },
      ContentInteraction: {
        mongodb: ContentInteractionMongoRepository,
        mariadb: () => mariaDBRepositories.ContentInteraction,
      },
      Template: {
        mongodb: TemplateMongoRepository,
        mariadb: () => mariaDBRepositories.Template,
      },
      PermissionDefinition: {
        mongodb: PermissionDefinitionMongoRepository,
        mariadb: () => mariaDBRepositories.PermissionDefinition,
      },
    };
  }

  /**
   * 获取数据库类型
   * @return {String} 数据库类型
   */
  getDatabaseType() {
    return this.app.config.repository?.databaseType || 'mongodb';
  }

  /**
   * 通用的 Repository 创建方法
   * @param {String} entityName 实体名称
   * @param {Context} ctx EggJS 上下文
   * @return {IBaseRepository} Repository 实例
   * @private
   */
  _createRepository(entityName, ctx) {
    // 验证实体名称
    if (!this.repositoryMap[entityName]) {
      throw new Error(`Repository for entity ${entityName} is not configured`);
    }

    const dbType = this.getDatabaseType();
    // 🔥 优化：使用全局缓存键，避免每个请求都创建新实例
    // 基于数据库配置生成缓存键，确保配置变更时重新创建
    const crypto = require('crypto');
    const configHash = crypto
      .createHash('md5')
      .update(JSON.stringify(this.app.config.repository))
      .digest('hex')
      .substring(0, 8);
    const cacheKey = `${entityName}_${dbType}_global_${configHash}`;

    // 检查缓存
    if (this.repositories.has(cacheKey)) {
      return this.repositories.get(cacheKey);
    }

    let repository;
    const entityConfig = this.repositoryMap[entityName];

    if (!entityConfig[dbType]) {
      throw new Error(`Database type ${dbType} is not supported for entity ${entityName}`);
    }

    try {
      switch (dbType) {
        case 'mongodb': {
          // 支持两种配置方式：
          // 1. 直接的类（ES6 class）
          // 2. 工厂函数（返回类的函数）
          const mongoConfig = entityConfig.mongodb;

          // 区分 ES6 类和工厂函数
          // ES6 类有 prototype.constructor，工厂函数没有
          let MongoRepositoryClass;
          if (typeof mongoConfig === 'function') {
            // 检查是否是 ES6 类（类有 prototype.constructor === 类本身）
            if (mongoConfig.prototype && mongoConfig.prototype.constructor === mongoConfig) {
              // 是 ES6 类，直接使用
              MongoRepositoryClass = mongoConfig;
            } else {
              // 是工厂函数，调用它获取类
              MongoRepositoryClass = mongoConfig();
            }
          } else {
            MongoRepositoryClass = mongoConfig;
          }

          repository = new MongoRepositoryClass(ctx);
          break;
        }
        case 'mariadb': {
          loadMariaDBRepositories();
          const MariaRepositoryClass = entityConfig.mariadb();
          if (!MariaRepositoryClass) {
            throw new Error(`MariaDB repository for ${entityName} not available`);
          }
          repository = new MariaRepositoryClass(ctx);
          break;
        }
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    } catch (error) {
      throw new Error(`Failed to create ${entityName} repository for ${dbType}: ${error.message}`);
    }

    // 缓存 Repository 实例
    this.repositories.set(cacheKey, repository);
    return repository;
  }

  /**
   * 创建 SystemConfig Repository
   * @param {Context} ctx EggJS 上下文
   * @return {ISystemConfigRepository} SystemConfig Repository 实例
   */
  createSystemConfigRepository(ctx) {
    return this._createRepository('SystemConfig', ctx);
  }

  /**
   * 创建 User Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IUserRepository} User Repository 实例
   */
  createUserRepository(ctx) {
    return this._createRepository('User', ctx);
  }

  /**
   * 创建 ContentCategory Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IContentCategoryRepository} ContentCategory Repository 实例
   */
  createContentCategoryRepository(ctx) {
    return this._createRepository('ContentCategory', ctx);
  }

  /**
   * 创建 ContentTag Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IContentTagRepository} ContentTag Repository 实例
   */
  createContentTagRepository(ctx) {
    return this._createRepository('ContentTag', ctx);
  }

  /**
   * 创建 Menu Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IMenuRepository} Menu Repository 实例
   */
  createMenuRepository(ctx) {
    return this._createRepository('Menu', ctx);
  }

  /**
   * 创建 Role Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IRoleRepository} Role Repository 实例
   */
  createRoleRepository(ctx) {
    return this._createRepository('Role', ctx);
  }

  /**
   * 创建 Admin Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IAdminRepository} Admin Repository 实例
   */
  createAdminRepository(ctx) {
    return this._createRepository('Admin', ctx);
  }

  /**
   * 创建 SystemOptionLog Repository
   * @param {Context} ctx EggJS 上下文
   * @return {ISystemOptionLogRepository} SystemOptionLog Repository 实例
   */
  createSystemOptionLogRepository(ctx) {
    return this._createRepository('SystemOptionLog', ctx);
  }

  /**
   * 创建 UploadFile Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IUploadFileRepository} UploadFile Repository 实例
   */
  createUploadFileRepository(ctx) {
    return this._createRepository('UploadFile', ctx);
  }

  /**
   * 创建 AdsItems Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IAdsItemsRepository} AdsItems Repository 实例
   */
  createAdsItemsRepository(ctx) {
    return this._createRepository('AdsItems', ctx);
  }

  /**
   * 创建 Content Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IContentRepository} Content Repository 实例
   */
  createContentRepository(ctx) {
    return this._createRepository('Content', ctx);
  }

  /**
   * 创建 PermissionDefinition Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IPermissionDefinitionRepository} 实例
   */
  createPermissionDefinitionRepository(ctx) {
    return this._createRepository('PermissionDefinition', ctx);
  }

  /**
   * 创建 Ads Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IAdsRepository} Ads Repository 实例
   */
  createAdsRepository(ctx) {
    return this._createRepository('Ads', ctx);
  }

  /**
   * 创建 Plugin Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IPluginRepository} Plugin Repository 实例
   */
  createPluginRepository(ctx) {
    return this._createRepository('Plugin', ctx);
  }

  /**
   * 创建 MailTemplate Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IMailTemplateRepository} MailTemplate Repository 实例
   */
  createMailTemplateRepository(ctx) {
    return this._createRepository('MailTemplate', ctx);
  }

  /**
   * 创建 ApiKey Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IApiKeyRepository} ApiKey Repository 实例
   */
  createApiKeyRepository(ctx) {
    return this._createRepository('ApiKey', ctx);
  }

  /**
   * 创建 Message Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IMessageRepository} Message Repository 实例
   */
  createMessageRepository(ctx) {
    return this._createRepository('Message', ctx);
  }

  /**
   * 创建 MessageInteraction Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IMessageInteractionRepository} MessageInteraction Repository 实例
   */
  createMessageInteractionRepository(ctx) {
    return this._createRepository('MessageInteraction', ctx);
  }

  /**
   * 创建 ContentInteraction Repository
   * @param {Context} ctx EggJS 上下文
   * @return {IContentInteractionRepository} ContentInteraction Repository 实例
   */
  createContentInteractionRepository(ctx) {
    return this._createRepository('ContentInteraction', ctx);
  }

  /**
   * 创建 Template Repository
   * @param {Context} ctx EggJS 上下文
   * @return {ITemplateRepository} Template Repository 实例
   */
  createTemplateRepository(ctx) {
    return this._createRepository('Template', ctx);
  }

  /**
   * 创建任意实体的 Repository
   * @param {String} entityName 实体名称
   * @param {Context} ctx EggJS 上下文
   * @return {IBaseRepository} Repository 实例
   */
  createRepository(entityName, ctx) {
    return this._createRepository(entityName, ctx);
  }

  /**
   * 添加新的 Repository 配置
   * @param {String} entityName 实体名称
   * @param {Object} config Repository 配置 { mongodb: Class, mariadb: () => Class }
   */
  addRepositoryConfig(entityName, config) {
    if (!config.mongodb) {
      throw new Error(`MongoDB repository class is required for entity ${entityName}`);
    }
    this.repositoryMap[entityName] = config;
  }

  /**
   * 移除 Repository 配置
   * @param {String} entityName 实体名称
   */
  removeRepositoryConfig(entityName) {
    delete this.repositoryMap[entityName];
    this.clearCache(entityName);
  }

  /**
   * 清理缓存
   * @param {String} pattern 缓存键模式（可选）
   */
  clearCache(pattern = null) {
    if (pattern) {
      // 清理匹配模式的缓存
      for (const key of this.repositories.keys()) {
        if (key.includes(pattern)) {
          this.repositories.delete(key);
        }
      }
    } else {
      // 清理所有缓存
      this.repositories.clear();
    }
  }

  /**
   * 获取支持的实体列表
   * @return {Array<String>} 支持的实体名称列表
   */
  getSupportedEntities() {
    return Object.keys(this.repositoryMap);
  }

  /**
   * 检查实体是否支持
   * @param {String} entityName 实体名称
   * @return {Boolean} 是否支持
   */
  isEntitySupported(entityName) {
    return !!this.repositoryMap[entityName];
  }

  /**
   * 检查数据库类型是否支持特定实体
   * @param {String} entityName 实体名称
   * @param {String} dbType 数据库类型
   * @return {Boolean} 是否支持
   */
  isDatabaseTypeSupported(entityName, dbType = null) {
    const dbTypeToCheck = dbType || this.getDatabaseType();
    const entityConfig = this.repositoryMap[entityName];
    return entityConfig && !!entityConfig[dbTypeToCheck];
  }

  /**
   * 获取 Repository 统计信息
   * @return {Object} 统计信息
   */
  getStats() {
    return {
      databaseType: this.getDatabaseType(),
      cachedRepositories: this.repositories.size,
      supportedEntities: this.getSupportedEntities(),
      cacheKeys: Array.from(this.repositories.keys()),
      repositoryConfigCount: Object.keys(this.repositoryMap).length,
    };
  }

  /**
   * 获取实体的可用数据库类型
   * @param {String} entityName 实体名称
   * @return {Array<String>} 支持的数据库类型列表
   */
  getSupportedDatabaseTypes(entityName) {
    const entityConfig = this.repositoryMap[entityName];
    if (!entityConfig) {
      return [];
    }
    return Object.keys(entityConfig);
  }

  /**
   * 验证所有配置的完整性
   * @return {Object} 验证结果
   */
  validateConfigurations() {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
    };

    for (const [entityName, config] of Object.entries(this.repositoryMap)) {
      // 检查是否有 MongoDB 配置
      if (!config.mongodb) {
        results.valid = false;
        results.errors.push(`Entity ${entityName} missing MongoDB repository`);
      }

      // 检查是否有 MariaDB 配置
      if (!config.mariadb) {
        results.warnings.push(`Entity ${entityName} missing MariaDB repository`);
      }
    }

    return results;
  }
}

module.exports = RepositoryFactory;
