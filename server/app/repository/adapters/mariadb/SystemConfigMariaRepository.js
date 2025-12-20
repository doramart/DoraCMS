/**
 * 优化后的 SystemConfig MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 SystemConfig 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 专注于配置管理、类型转换、公开配置等特有功能
 *
 * 架构优化亮点：
 * 1. 移除重复的基类 CRUD 方法 - 直接继承使用
 * 2. 专注于 SystemConfig 特有的业务逻辑
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持类型转换和密码处理
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const SystemConfigSchema = require('../../schemas/mariadb/SystemConfigSchema');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');

class SystemConfigMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'SystemConfig');

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
  }

  /**
   * 初始化数据库连接和模型
   * @private
   */
  async _initializeConnection() {
    try {
      // 确保连接管理器已初始化
      await this.connection.initialize();
      const sequelize = this.connection.getSequelize();

      // 直接创建模型实例，避免依赖连接管理器的缓存
      this.model = SystemConfigSchema(sequelize, this.app);

      // 注册模型（SystemConfig通常不需要关联关系）
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // SystemConfig 通常是独立的配置表，不需要关联关系
        },
      });

      // console.log('✅ SystemConfigMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ SystemConfigMariaRepository initialization failed:', error);
      throw error;
    }
  }

  /**
   * 确保连接已建立
   * @private
   */
  async _ensureConnection() {
    if (!this.model) {
      await this._initializeConnection();
    }
  }

  // ===== 🔥 重写基类的抽象方法 - SystemConfig 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return []; // SystemConfig 不需要关联查询
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['key', 'value']; // 支持按配置键和值搜索
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'key', order: 'asc' }, // 按配置键排序
      { field: 'createdAt', order: 'desc' }, // 创建时间降序
    ];
  }

  /**
   * 获取状态映射（SystemConfig使用public字段）
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.SYSTEM_CONFIG.PUBLIC_STATUS_TEXT;
  }

  /**
   * 🔥 优化版：不再需要手动维护字段列表！
   * 基类会自动从Schema获取所有字段，大幅减少维护成本
   * @return {Array} 有效字段列表
   * @protected
   */
  _getValidTableFields() {
    // 直接使用基类的自动检测功能
    return super._getValidTableFields();
  }

  /**
   * 重写：获取需要排除的字段
   * 🔥 SystemConfig模块没有关联字段需要排除
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // SystemConfig模块特有的需要排除的字段（通常没有）
    const moduleExcludeFields = [
      // SystemConfig 是独立表，通常没有需要排除的关联字段
    ];

    return [...baseExcludeFields, ...moduleExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - SystemConfig 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @param options
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item, options);

    // 🔥 添加 SystemConfig 特有的数据处理

    // 添加类型文本描述
    const typeTexts = {
      string: '字符串',
      number: '数字',
      boolean: '布尔值',
      password: '密码',
    };
    item.typeText = typeTexts[item.type] || item.type;

    // 添加公开状态文本（基于boolean值）
    item.publicText = item.public ? '公开' : '私有';

    // 🔥 密码类型的值隐藏处理
    if (item.type === 'password') {
      item.displayValue = '********';
    } else {
      item.displayValue = item.value;
    }

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - SystemConfig 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 🔥 添加 SystemConfig 特有的创建前处理

    // 设置默认值
    if (typeof data.public === 'undefined') {
      data.public = false; // 默认为私有配置
    }
    if (!data.type) {
      data.type = 'string'; // 默认为字符串类型
    }

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - SystemConfig 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 🔥 添加 SystemConfig 特有的更新前处理
    // Schema的set方法会自动处理类型转换

    return data;
  }

  // ===== 🔥 SystemConfig 特有的业务方法 =====

  /**
   * 查找单条记录
   * @param query
   * @param options
   */
  async findOne(query = {}, options = {}) {
    await this._ensureConnection();

    try {
      // 标准化参数并转换为 MariaDB 格式
      const standardParams = this._standardizeParams(
        {}, // 空的 payload
        {
          filters: query,
          populate: options.populate || [],
          fields: options.fields,
          pagination: { isPaging: false },
        }
      );

      // 构建查询选项
      const queryOptions = await this._buildQueryOptions(standardParams);

      // 执行查询
      const result = await this.model.findOne(queryOptions);

      // 处理结果
      return result ? result.toJSON() : null;
    } catch (error) {
      this._handleError(error, 'findOne', { query, options });
    }
  }

  /**
   * 根据ID查找记录
   * @param id
   * @param options
   */
  async findById(id, options = {}) {
    const query = { id };
    return await this.findOne(query, options);
  }

  /**
   * 统计记录数量
   * @param filters
   */
  async count(filters = {}) {
    await this._ensureConnection();

    try {
      // 标准化参数并转换为 MariaDB 格式
      const standardParams = this._standardizeParams(
        {}, // 空的 payload
        {
          filters,
          pagination: { isPaging: false },
        }
      );

      // 执行统计
      const count = await this.model.count({ where: standardParams.where });

      this._logOperation('count', { filters }, count);
      return count;
    } catch (error) {
      this._handleError(error, 'count', { filters });
    }
  }

  /**
   * 创建记录
   * @param data
   */
  async create(data) {
    await this._ensureConnection();

    try {
      // 预处理数据
      const processedData = this._preprocessDataForCreate(data);

      // 创建主记录
      const result = await this.model.create(processedData);

      // 获取完整数据
      const fullResult = await this.findById(result.id, {
        populate: this._getDefaultPopulate(),
      });

      this._logOperation('create', { data }, fullResult);
      return fullResult;
    } catch (error) {
      this._handleError(error, 'create', { data });
    }
  }

  /**
   * 更新记录（使用智能更新策略）
   * @param id
   * @param data
   * @param options
   */
  async update(id, data, options = {}) {
    await this._ensureConnection();

    try {
      // 转换ID
      const mariadbId = this.transformer.transformQueryForMariaDB({ id }).id;

      // 🔥 使用智能更新策略
      const { processedData, updateOptions } = await this.smartUpdate(mariadbId, data, options);

      // 更新主记录
      await this.model.update(processedData, updateOptions);

      // 获取更新后的完整数据
      const fullResult = await this.findById(id, {
        populate: this._getDefaultPopulate(),
      });

      this._logOperation('update', { id, data }, fullResult);
      return fullResult;
    } catch (error) {
      this._handleError(error, 'update', { id, data });
    }
  }

  /**
   * 删除记录
   * @param ids
   * @param key
   */
  async remove(ids, key = 'id') {
    await this._ensureConnection();

    try {
      // 转换ID格式
      const mariadbIds = Array.isArray(ids)
        ? ids.map(id => this.transformer.transformQueryForMariaDB({ id }).id)
        : this.transformer.transformQueryForMariaDB({ id: ids }).id;

      const whereCondition = Array.isArray(mariadbIds) ? { id: { [this.Op.in]: mariadbIds } } : { id: mariadbIds };

      const result = await this.model.destroy({ where: whereCondition });
      this._logOperation('remove', { ids, key }, result);
      return { deletedCount: result };
    } catch (error) {
      this._handleError(error, 'remove', { ids, key });
    }
  }

  /**
   * 软删除记录（SystemConfig通常不需要软删除，但保留接口一致性）
   * @param ids
   * @param updateObj
   */
  async safeDelete(ids, updateObj = { public: false }) {
    await this._ensureConnection();

    try {
      // 转换ID格式
      const mariadbIds = Array.isArray(ids)
        ? ids.map(id => this.transformer.transformQueryForMariaDB({ id }).id)
        : this.transformer.transformQueryForMariaDB({ id: ids }).id;

      const whereCondition = Array.isArray(mariadbIds) ? { id: { [this.Op.in]: mariadbIds } } : { id: mariadbIds };

      const [result] = await this.model.update(updateObj, { where: whereCondition });
      this._logOperation('safeDelete', { ids, updateObj }, result);
      return { modifiedCount: result };
    } catch (error) {
      this._handleError(error, 'safeDelete', { ids, updateObj });
    }
  }

  // ===== 🔥 SystemConfig 特有的业务方法 =====

  /**
   * 检查配置键是否唯一 - 统一异常处理版本
   * @param {String} key 配置键
   * @param {String} excludeId 排除的记录ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当配置键已存在时抛出异常
   */
  async checkKeyUnique(key, excludeId = null) {
    await this._ensureConnection();

    try {
      const where = { key };
      if (excludeId) {
        const mariadbId = this.transformer.transformQueryForMariaDB({ id: excludeId }).id;
        where.id = { [this.Op.ne]: mariadbId };
      }

      const count = await this.model.count({ where });
      const isUnique = count === 0;

      if (!isUnique) {
        throw this.exceptions.systemConfig.keyExists(key);
      }

      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkKeyUnique', { key, excludeId });
    }
  }

  /**
   * 检查配置键是否存在（兼容旧接口）
   * @param {String} key 配置键
   * @param {String} excludeId 排除的记录ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否存在
   */
  async checkKeyExists(key, excludeId = null) {
    await this._ensureConnection();

    try {
      const where = { key };
      if (excludeId) {
        const mariadbId = this.transformer.transformQueryForMariaDB({ id: excludeId }).id;
        where.id = { [this.Op.ne]: mariadbId };
      }

      const count = await this.model.count({ where });

      // 记录操作日志
      this._logOperation('checkKeyExists', { key, excludeId }, count > 0);

      return count > 0;
    } catch (error) {
      this._handleError(error, 'checkKeyExists', { key, excludeId });
    }
  }

  /**
   * 根据配置键批量查询配置值
   * @param {Array} keys 配置键数组
   * @return {Promise<Object>} 键值对对象
   */
  async findByKeys(keys) {
    await this._ensureConnection();

    try {
      if (!Array.isArray(keys) || keys.length === 0) {
        return {};
      }

      const configs = await this.model.findAll({
        where: { key: { [this.Op.in]: keys } },
      });

      // 转换为键值对对象
      const result = {};
      configs.forEach(config => {
        const configData = config.toJSON();
        result[configData.key] = configData.value; // toJSON()中已处理类型转换
      });

      // 记录操作日志
      this._logOperation('findByKeys', { keys }, result);

      return result;
    } catch (error) {
      this._handleError(error, 'findByKeys', { keys });
    }
  }

  /**
   * 根据配置键查找单个配置
   * @param {String} key 配置键
   * @return {Promise<Object|null>} 配置对象
   */
  async findByKey(key) {
    try {
      const result = await this.findOne({ key });

      // 记录操作日志
      this._logOperation('findByKey', { key }, result);

      return result;
    } catch (error) {
      this._handleError(error, 'findByKey', { key });
    }
  }

  /**
   * 获取所有公开的配置
   * @return {Promise<Array>} 公开配置列表
   */
  async getPublicConfigs() {
    try {
      const result = await this.find(
        { isPaging: '0' }, // 🔥 修复：正确传递不分页参数
        {
          filters: { public: { $eq: true } },
          sort: [{ field: 'key', order: 'asc' }],
        }
      );

      // 记录操作日志
      this._logOperation('getPublicConfigs', {}, result);

      // 🔥 修复：如果返回的是分页格式，提取 docs 数组
      return Array.isArray(result) ? result : result.docs || [];
    } catch (error) {
      this._handleError(error, 'getPublicConfigs', {});
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
    await this._ensureConnection();

    try {
      // 检查是否存在
      const existing = await this.findByKey(key);

      const configData = {
        key,
        value,
        type,
        public: isPublic,
      };

      let result;
      if (existing) {
        // 更新现有配置
        result = await this.update(existing.id, configData);
      } else {
        // 创建新配置
        result = await this.create(configData);
      }

      // 记录操作日志
      this._logOperation('upsertByKey', { key, value, type, isPublic }, result);

      return result;
    } catch (error) {
      this._handleError(error, 'upsertByKey', { key, value, type, isPublic });
    }
  }

  /**
   * 批量设置配置
   * @param {Array} configs 配置数组 [{key, value, type, public}]
   * @return {Promise<Array>} 处理结果数组
   */
  async setBatchConfigs(configs) {
    try {
      if (!Array.isArray(configs) || configs.length === 0) {
        return [];
      }

      const results = [];
      for (const config of configs) {
        const result = await this.upsertByKey(
          config.key,
          config.value,
          config.type || 'string',
          config.public || false
        );
        results.push(result);
      }

      // 记录操作日志
      this._logOperation('setBatchConfigs', { configs }, results);

      return results;
    } catch (error) {
      this._handleError(error, 'setBatchConfigs', { configs });
    }
  }

  /**
   * 简化的设置配置值方法
   * @param {String} key 配置键
   * @param {*} value 配置值
   * @param {String} type 配置类型
   * @return {Promise<Object>} 配置对象
   */
  async setValue(key, value, type = 'string') {
    return await this.upsertByKey(key, value, type, false);
  }

  /**
   * 简化的获取配置值方法
   * @param {String} key 配置键
   * @param {*} defaultValue 默认值
   * @return {Promise<*>} 配置值
   */
  async getValue(key, defaultValue = null) {
    try {
      const config = await this.findByKey(key);
      const result = config ? config.value : defaultValue;

      // 记录操作日志
      this._logOperation('getValue', { key, defaultValue }, result);

      return result;
    } catch (error) {
      this._handleError(error, 'getValue', { key, defaultValue });
      return defaultValue;
    }
  }

  /**
   * 批量获取配置值
   * @param {Array} keys 配置键数组
   * @param {Object} defaults 默认值对象
   * @return {Promise<Object>} 配置值对象
   */
  async getValues(keys, defaults = {}) {
    try {
      const configs = await this.findByKeys(keys);

      // 合并默认值
      const result = { ...defaults };
      Object.keys(configs).forEach(key => {
        result[key] = configs[key];
      });

      // 记录操作日志
      this._logOperation('getValues', { keys, defaults }, result);

      return result;
    } catch (error) {
      this._handleError(error, 'getValues', { keys, defaults });
      return defaults;
    }
  }

  /**
   * 根据键删除配置
   * @param {String} key 配置键
   * @return {Promise<Object>} 删除结果
   */
  async deleteByKey(key) {
    await this._ensureConnection();

    try {
      const config = await this.findByKey(key);
      if (!config) {
        return { deletedCount: 0 };
      }

      const result = await this.remove(config.id);

      // 记录操作日志
      this._logOperation('deleteByKey', { key }, result);

      return result;
    } catch (error) {
      this._handleError(error, 'deleteByKey', { key });
    }
  }

  /**
   * 根据类型查找配置
   * @param {String} type 配置类型
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 配置列表
   */
  async findByType(type, options = {}) {
    try {
      const result = await this.find(
        {}, // 空的payload
        {
          ...options,
          filters: {
            ...options.filters,
            type: { $eq: type },
          },
          sort: options.sort || this._getDefaultSort(),
        }
      );

      // 记录操作日志
      this._logOperation('findByType', { type, options }, result);

      return result;
    } catch (error) {
      this._handleError(error, 'findByType', { type, options });
    }
  }

  // ===== 辅助方法 =====

  // ===== 🔥 SystemConfig 业务验证方法（统一异常处理版本） =====

  /**
   * 验证配置类型 - 统一异常处理版本
   * @param {String} type 配置类型
   * @return {Promise<Boolean>} 是否有效
   * @throws {ValidationError} 当配置类型无效时抛出异常
   */
  async validateConfigType(type) {
    try {
      const validTypes = ['string', 'number', 'boolean', 'password'];

      if (!validTypes.includes(type)) {
        throw this.exceptions.systemConfig.invalidType(type);
      }

      return true;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw error;
      }
      this._handleError(error, 'validateConfigType', { type });
    }
  }

  /**
   * 验证密码配置值 - 统一异常处理版本
   * @param {String} password 密码值
   * @param {Number} minLength 最小长度
   * @return {Promise<Boolean>} 是否有效
   * @throws {ValidationError} 当密码不符合要求时抛出异常
   */
  async validatePasswordValue(password, minLength = 6) {
    try {
      if (!password || typeof password !== 'string') {
        throw this.exceptions.systemConfig.invalidValue('password', password);
      }

      if (password.length < minLength) {
        throw this.exceptions.systemConfig.passwordTooShort();
      }

      return true;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw error;
      }
      this._handleError(error, 'validatePasswordValue', { password: '***', minLength });
    }
  }

  /**
   * 验证配置值类型匹配 - 统一异常处理版本
   * @param {String} type 配置类型
   * @param {*} value 配置值
   * @return {Promise<Boolean>} 是否匹配
   * @throws {ValidationError} 当类型不匹配时抛出异常
   */
  async validateValueType(type, value) {
    try {
      let isValid = true;

      switch (type) {
        case 'string':
          isValid = typeof value === 'string';
          break;
        case 'number':
          isValid = !isNaN(Number(value));
          break;
        case 'boolean':
          isValid = ['true', 'false', true, false].includes(value);
          break;
        case 'password':
          isValid = typeof value === 'string' && value.length >= 6;
          if (!isValid && typeof value === 'string' && value.length < 6) {
            throw this.exceptions.systemConfig.passwordTooShort();
          }
          break;
        default:
          throw this.exceptions.systemConfig.invalidType(type);
      }

      if (!isValid) {
        throw this.exceptions.systemConfig.invalidValue(type, value);
      }

      return true;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw error;
      }
      this._handleError(error, 'validateValueType', { type, value });
    }
  }

  // ===== 辅助方法 =====
}

module.exports = SystemConfigMariaRepository;
