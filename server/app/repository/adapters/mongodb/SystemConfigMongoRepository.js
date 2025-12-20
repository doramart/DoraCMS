/**
 * 标准化的 SystemConfig MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 专注于SystemConfig特定的业务方法和配置管理功能
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const _ = require('lodash');

class SystemConfigMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'SystemConfig');

    // 设置 MongoDB 模型
    this.model = this.app.model.SystemConfig;

    // 注册模型（SystemConfig通常不需要关联关系）
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // SystemConfig 通常是独立的配置表，不需要关联关系
      },
    });
  }

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
   * 重写状态映射（SystemConfig使用public字段）
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return SYSTEM_CONSTANTS.SYSTEM_CONFIG.PUBLIC_STATUS_TEXT;
  }

  /**
   * 子类自定义的数据项处理 - SystemConfig特有逻辑
   * @param {Object} item 预处理后的数据项
   * @param options
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 🔥 添加 SystemConfig 特有的数据处理

    // 添加类型文本描述
    const typeTexts = {
      string: '字符串',
      number: '数字',
      boolean: '布尔值',
      password: '密码',
    };
    item.typeText = typeTexts[item.type] || item.type;

    // 添加公开状态文本
    item.publicText = item.public ? '公开' : '私有';

    // 🔥 密码类型的值隐藏处理
    if (item.type === 'password') {
      item.displayValue = '********';
    } else {
      item.displayValue = item.value;
    }

    // 🔥 类型转换处理（MongoDB的post钩子已处理，这里确保一致性）
    if (item.type === 'boolean' && typeof item.value === 'string') {
      item.value = item.value === 'true' || item.value === true;
    } else if (item.type === 'number' && typeof item.value === 'string') {
      item.value = Number(item.value);
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理 - SystemConfig特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 🔥 添加 SystemConfig 特有的创建前处理

    // 设置默认值
    if (typeof data.public === 'undefined') {
      data.public = false; // 默认为私有配置
    }
    if (!data.type) {
      data.type = 'string'; // 默认为字符串类型
    }

    // 🔥 类型转换预处理
    data = this._preprocessValueByType(data);

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - SystemConfig特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 🔥 添加 SystemConfig 特有的更新前处理

    // 🔥 类型转换预处理
    data = this._preprocessValueByType(data);

    return data;
  }

  /**
   * 根据类型预处理配置值
   * @param {Object} data 数据对象
   * @return {Object} 处理后的数据
   * @private
   */
  _preprocessValueByType(data) {
    if (!data.type || data.value === undefined || data.value === null) {
      return data;
    }

    const processedData = { ...data };

    switch (data.type) {
      case 'boolean':
        processedData.value = data.value === true || data.value === 'true' ? 'true' : 'false';
        break;
      case 'number':
        processedData.value = String(data.value);
        break;
      case 'password':
        // 密码加密在MongoDB的pre钩子中处理
        processedData.value = String(data.value);
        break;
      case 'string':
      default:
        processedData.value = String(data.value);
        break;
    }

    return processedData;
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
    try {
      const query = { key };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const count = await this.model.countDocuments(query);
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
    try {
      const query = { key };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const count = await this.model.countDocuments(query);

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
    try {
      if (!Array.isArray(keys) || keys.length === 0) {
        return {};
      }

      const configs = await this.model.find({ key: { $in: keys } });

      // 转换为键值对对象
      const result = {};
      configs.forEach(config => {
        result[config.key] = config.value;
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
        result = await this.update(existing._id, configData);
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
    try {
      const config = await this.findByKey(key);
      if (!config) {
        return { deletedCount: 0 };
      }

      const result = await this.remove(config._id);

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
}

module.exports = SystemConfigMongoRepository;
