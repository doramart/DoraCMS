/**
 * SystemConfig Service - 使用 Repository 模式
 * 基于重构后的标准化服务层
 * 🔥 专注于系统配置管理的业务功能
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');
const RepositoryExceptions = require('../repository/base/RepositoryExceptions');
const SYSTEM_CONSTANTS = require('../constants/SystemConstants');

const PROTECTED_CONFIG_KEYS = SYSTEM_CONSTANTS.SYSTEM_CONFIG.PROTECTED_KEYS || [];

class SystemConfigService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 SystemConfig Repository
    this.repository = this.repositoryFactory.createSystemConfigRepository(ctx);
  }

  /**
   * 查找记录列表
   * @param {Object} payload 分页参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 分页结果
   */
  async find(payload = {}, options = {}) {
    return await this.repository.find(payload, options);
  }

  /**
   * 查找单条记录
   * @param {Object} query 查询条件
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findOne(query = {}, options = {}) {
    return await this.repository.findOne(query, options);
  }

  /**
   * 根据ID查找记录
   * @param {String} id 记录ID
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 记录对象
   */
  async findById(id, options = {}) {
    return await this.repository.findById(id, options);
  }

  /**
   * 统计记录数量
   * @param {Object} filters 查询条件（标准化格式）
   * @return {Promise<Number>} 记录数量
   */
  async count(filters = {}) {
    return await this.repository.count(filters);
  }

  /**
   * 创建记录
   * @param {Object} data 记录数据
   * @return {Promise<Object>} 创建的记录
   */
  async create(data) {
    return await this.repository.create(data);
  }

  /**
   * 更新记录
   * @param {String} id 记录ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新后的记录
   */
  async update(id, data) {
    return await this.repository.update(id, data);
  }

  /**
   * 删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {String} key 主键字段名
   * @return {Promise<Object>} 删除结果
   */
  async remove(ids, key = 'id') {
    const idsArray = this._normalizeIds(ids);

    // 预检查：阻止删除系统关键配置
    const configs = await Promise.all(idsArray.map(id => this.findById(id).catch(() => null)));
    this._assertConfigDeletable(configs);

    return await this.repository.remove(idsArray, key);
  }

  /**
   * 软删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} updateObj 更新对象
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { public: false }) {
    const idsArray = this._normalizeIds(ids);

    // 预检查：阻止删除系统关键配置
    const configs = await Promise.all(idsArray.map(id => this.findById(id).catch(() => null)));
    this._assertConfigDeletable(configs);

    return await this.repository.safeDelete(idsArray, updateObj);
  }

  // ===== 🔥 SystemConfig 特有的业务方法 =====

  /**
   * 🔥 检查配置键是否唯一 - 统一异常处理版本
   * @param {String} key 配置键
   * @param {String} excludeId 排除的记录ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当配置键已存在时抛出异常
   */
  async checkKeyUnique(key, excludeId = null) {
    return await this.repository.checkKeyUnique(key, excludeId);
  }

  /**
   * 检查配置键是否存在（兼容旧接口）
   * @param {String} key 配置键
   * @param {String} excludeId 排除的记录ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkKeyExists(key, excludeId = null) {
    return await this.repository.checkKeyExists(key, excludeId);
  }

  /**
   * 根据配置键批量查询配置值
   * @param {Array} keys 配置键数组
   * @return {Promise<Object>} 键值对对象
   */
  async findByKeys(keys) {
    return await this.repository.findByKeys(keys);
  }

  /**
   * 根据配置键查找单个配置
   * @param {String} key 配置键
   * @return {Promise<Object|null>} 配置对象
   */
  async findByKey(key) {
    return await this.repository.findByKey(key);
  }

  /**
   * 获取所有公开的配置
   * @return {Promise<Array>} 公开配置列表
   */
  async getPublicConfigs() {
    return await this.repository.getPublicConfigs();
  }

  /**
   * 🔥 获取系统配置并转换为键值对象格式
   * 统一的配置获取方法，用于替代 HTTP 调用
   * @return {Promise<Object>} 配置键值对象
   */
  async getConfigsAsObject() {
    try {
      // 🔥 优化：添加缓存避免重复查询
      const cacheKey = `${this.app.config.session_secret}_system_configs_object`;
      const cachedConfig = await this.app.cache.get(cacheKey);

      // 修复：如果缓存中的是 Promise 对象，需要 await
      let configObj = null;
      if (cachedConfig) {
        configObj = cachedConfig instanceof Promise ? await cachedConfig : cachedConfig;
      }

      if (!configObj) {
        // 获取所有公开配置
        const systemConfigList = await this.find(
          { isPaging: '0' },
          {
            filters: {
              type: { $ne: 'password' }, // 排除密码类型配置
              public: { $eq: true }, // 只获取公开配置
            },
            fields: ['key', 'value', 'type'],
            sort: [{ field: 'key', order: 'asc' }],
          }
        );

        // 转换为键值对象
        configObj = {};
        const configs = Array.isArray(systemConfigList) ? systemConfigList : systemConfigList.docs || [];
        configs.forEach(item => {
          configObj[item.key] = item.value;
        });

        // 缓存30分钟
        this.ctx.helper.setMemoryCache(cacheKey, configObj, 1000 * 60 * 30);
      }

      return configObj;
    } catch (error) {
      this.ctx.logger.error('Get system configs as object error:', error);
      return {};
    }
  }

  /**
   * 根据键设置配置值（如果不存在则创建，存在则更新）
   * @param {String} key 配置键
   * @param {*} value 配置值
   * @param {String} type 配置类型
   * @param {Boolean} isPublic 是否公开
   * @return {Promise<Object>} 配置对象
   */
  async upsertByKey(key, value, type = 'string', isPublic = false) {
    return await this.repository.upsertByKey(key, value, type, isPublic);
  }

  /**
   * 批量设置配置
   * @param {Array} configs 配置数组 [{key, value, type, public}]
   * @return {Promise<Array>} 处理结果数组
   */
  async setBatchConfigs(configs) {
    return await this.repository.setBatchConfigs(configs);
  }

  /**
   * 简化的设置配置值方法
   * @param {String} key 配置键
   * @param {*} value 配置值
   * @param {String} type 配置类型
   * @return {Promise<Object>} 配置对象
   */
  async setValue(key, value, type = 'string') {
    return await this.repository.setValue(key, value, type);
  }

  /**
   * 简化的获取配置值方法
   * @param {String} key 配置键
   * @param {*} defaultValue 默认值
   * @return {Promise<*>} 配置值
   */
  async getValue(key, defaultValue = null) {
    return await this.repository.getValue(key, defaultValue);
  }

  /**
   * 批量获取配置值
   * @param {Array} keys 配置键数组
   * @param {Object} defaults 默认值对象
   * @return {Promise<Object>} 配置值对象
   */
  async getValues(keys, defaults = {}) {
    return await this.repository.getValues(keys, defaults);
  }

  /**
   * 根据键删除配置
   * @param {String} key 配置键
   * @return {Promise<Object>} 删除结果
   */
  async deleteByKey(key) {
    const targetConfig = await this.findByKey(key);
    this._assertConfigDeletable(targetConfig ? [targetConfig] : [{ key }]);

    return await this.repository.deleteByKey(key);
  }

  /**
   * 根据类型查找配置
   * @param {String} type 配置类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 配置列表
   */
  async findByType(type, options = {}) {
    return await this.repository.findByType(type, options);
  }

  // ===== 🔥 SystemConfig 业务验证方法（统一异常处理版本） =====

  /**
   * 🔥 验证配置类型 - 统一异常处理版本
   * @param {String} type 配置类型
   * @return {Promise<Boolean>} 是否有效
   * @throws {ValidationError} 当配置类型无效时抛出异常
   */
  async validateConfigType(type) {
    return await this.repository.validateConfigType(type);
  }

  /**
   * 🔥 验证密码配置值 - 统一异常处理版本
   * @param {String} password 密码值
   * @param {Number} minLength 最小长度
   * @return {Promise<Boolean>} 是否有效
   * @throws {ValidationError} 当密码不符合要求时抛出异常
   */
  async validatePasswordValue(password, minLength = 6) {
    return await this.repository.validatePasswordValue(password, minLength);
  }

  /**
   * 🔥 验证配置值类型匹配 - 统一异常处理版本
   * @param {String} type 配置类型
   * @param {*} value 配置值
   * @return {Promise<Boolean>} 是否匹配
   * @throws {ValidationError} 当类型不匹配时抛出异常
   */
  async validateValueType(type, value) {
    return await this.repository.validateValueType(type, value);
  }

  // ===== 🔥 兼容性方法（保持与旧Service接口一致）=====

  /**
   * 兼容旧版本的 item 方法
   * @param {Object} params 查询参数
   * @return {Promise<Object|null>} 记录对象
   * @deprecated 建议使用 findOne 方法
   */
  async item(params = {}) {
    // 转换旧格式参数为新格式
    const { query = {}, populate = [], files = null } = params;

    const options = {
      populate: Array.isArray(populate) ? populate : [populate].filter(Boolean),
      fields: files ? (typeof files === 'string' ? files.split(' ') : files) : undefined,
    };

    return await this.findOne(query, options);
  }

  /**
   * 兼容旧版本的 removes 方法
   * @param {String|Array} values ID或ID数组
   * @param {String} key 主键字段名
   * @return {Promise<Object>} 删除结果
   * @deprecated 建议使用 remove 方法
   */
  async removes(values, key = '_id') {
    // 转换参数格式
    const normalizedKey = key === '_id' ? 'id' : key;
    return await this.remove(values, normalizedKey);
  }

  /**
   * 获取 Repository 统计信息
   * @return {Object} Repository 信息
   */
  getRepositoryStats() {
    return this.repositoryFactory.getStats();
  }

  /**
   * 清除 Repository 缓存
   */
  clearRepositoryCache() {
    this.repositoryFactory.clearCache();
  }

  // ===== 🔥 高级配置管理方法 =====

  /**
   * 获取系统配置摘要信息
   * @return {Promise<Object>} 配置摘要
   */
  async getConfigSummary() {
    try {
      // 统计各类型配置数量
      const [stringCount, numberCount, booleanCount, passwordCount, publicCount] = await Promise.all([
        this.repository.count({ type: { $eq: 'string' } }),
        this.repository.count({ type: { $eq: 'number' } }),
        this.repository.count({ type: { $eq: 'boolean' } }),
        this.repository.count({ type: { $eq: 'password' } }),
        this.repository.count({ public: { $eq: true } }),
      ]);

      return {
        total: stringCount + numberCount + booleanCount + passwordCount,
        byType: {
          string: stringCount,
          number: numberCount,
          boolean: booleanCount,
          password: passwordCount,
        },
        publicCount,
        privateCount: stringCount + numberCount + booleanCount + passwordCount - publicCount,
      };
    } catch (error) {
      this.ctx.logger.error('Failed to get config summary:', error);
      throw error;
    }
  }

  /**
   * 导出配置（仅公开配置或全部配置）
   * @param {Boolean} publicOnly 是否只导出公开配置
   * @return {Promise<Object>} 配置导出数据
   */
  async exportConfigs(publicOnly = false) {
    try {
      const filters = publicOnly ? { public: { $eq: true } } : {};

      const configs = await this.repository.find(
        {},
        {
          filters,
          pagination: { isPaging: false },
          sort: [{ field: 'key', order: 'asc' }],
        }
      );

      const exportData = {
        exportTime: new Date().toISOString(),
        publicOnly,
        totalCount: Array.isArray(configs) ? configs.length : configs.docs?.length || 0,
        configs: Array.isArray(configs) ? configs : configs.docs || [],
      };

      return exportData;
    } catch (error) {
      this.ctx.logger.error('Failed to export configs:', error);
      throw error;
    }
  }

  /**
   * 导入配置
   * @param {Array} configs 配置数组
   * @param {Object} options 导入选项
   * @return {Promise<Object>} 导入结果
   */
  async importConfigs(configs, options = {}) {
    try {
      const { overwrite = false, skipExisting = true } = options;

      const results = {
        total: configs.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      };

      for (const config of configs) {
        try {
          const exists = await this.checkKeyExists(config.key);

          if (exists && skipExisting && !overwrite) {
            results.skipped++;
            continue;
          }

          if (exists && overwrite) {
            await this.upsertByKey(config.key, config.value, config.type, config.public);
            results.updated++;
          } else if (!exists) {
            await this.create(config);
            results.created++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          results.errors.push({
            key: config.key,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      this.ctx.logger.error('Failed to import configs:', error);
      throw error;
    }
  }

  /**
   * 归一化ID参数为数组
   * @param {String|Array} ids
   * @return {Array}
   * @private
   */
  _normalizeIds(ids) {
    if (Array.isArray(ids)) {
      return ids.filter(Boolean);
    }

    if (typeof ids === 'string') {
      return ids
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);
    }

    return ids ? [ids] : [];
  }

  /**
   * 检查配置是否允许删除
   * @param {Array} configs
   * @private
   */
  _assertConfigDeletable(configs = []) {
    const blocked = configs.find(config => config && PROTECTED_CONFIG_KEYS.includes(config.key));
    if (blocked) {
      throw RepositoryExceptions.systemConfig.systemConfigRequired(blocked.key);
    }
  }
}

module.exports = SystemConfigService;
