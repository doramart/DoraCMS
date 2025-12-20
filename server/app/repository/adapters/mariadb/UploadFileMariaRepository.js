/**
 * 优化后的 UploadFile MariaDB Repository
 * 🔥 基于增强的 BaseMariaRepository，专注于 UploadFile 特有的业务逻辑
 * ✅ 继承基类的通用 CRUD 方法和 deepToJSON 处理
 * ✅ 只需实现 UploadFile 特定的业务方法和配置
 *
 * 架构优化亮点：
 * 1. 移除重复的基类 CRUD 方法 - 直接继承使用
 * 2. 专注于 UploadFile 特有的业务逻辑
 * 3. 可配置的钩子方法 - 灵活的数据处理管道
 * 4. 统一的深度 JSON 转换 - 支持关联字段和 JSON 字段
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const UploadFileSchema = require('../../schemas/mariadb/UploadFileSchema');
const UniqueChecker = require('../../../utils/UniqueChecker');
const _ = require('lodash');

class UploadFileMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'UploadFile');

    // 初始化 MariaDB 连接
    // 🔥 优化：使用单例模式，避免重复创建连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;

    // 注意：不在构造函数中同步调用 _initializeConnection
    // 而是在 _ensureConnection 中异步调用
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
      this.model = UploadFileSchema(sequelize, this.app);

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          // UploadFile 模块一般不需要关联关系，保留扩展性
        },
      });

      // console.log('✅ UploadFileMariaRepository initialized successfully');
    } catch (error) {
      console.error('❌ UploadFileMariaRepository initialization failed:', error);
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

  // ===== 🔥 重写基类的抽象方法 - UploadFile 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return []; // UploadFile 模块一般不需要关联查询
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['type', 'uploadPath', 'qn_bucket', 'oss_bucket'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [{ field: 'createdAt', order: 'desc' }];
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
   * 🔥 只需要定义需要排除的关联字段和虚拟字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // UploadFile模块特有的需要排除的字段
    const moduleExcludeFields = [
      // UploadFile 模块一般没有需要排除的字段，保留扩展性
    ];

    return [...baseExcludeFields, ...moduleExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - UploadFile 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 调用基类方法
    item = super._customProcessDataItem(item);

    // 添加 UploadFile 特有的数据处理
    if (item.type) {
      item.typeText = this._getUploadTypeText(item.type);
    }

    // 格式化配置信息显示
    if (item.type === 'local' && item.uploadPath) {
      item.displayPath = item.uploadPath.replace(process.cwd(), '.');
    }

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - UploadFile 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 验证上传类型
    if (!data.type) {
      throw this.exceptions.uploadFile.typeRequired();
    }

    if (!['local', 'qn', 'oss'].includes(data.type)) {
      throw this.exceptions.uploadFile.invalidType(data.type);
    }

    // 根据类型验证必需字段
    this._validateConfigByType(data.type, data);

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - UploadFile 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    // 如果更新了类型，验证配置
    if (data.type) {
      if (!['local', 'qn', 'oss'].includes(data.type)) {
        throw this.exceptions.uploadFile.invalidType(data.type);
      }
      this._validateConfigByType(data.type, data);
    }

    return data;
  }

  // ===== 🔥 UploadFile 特有的业务方法 =====

  /**
   * 🔥 统一异常处理版本：检查上传类型是否唯一
   * @param {String} type 上传类型
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当上传类型已存在时抛出异常
   */
  async checkTypeUnique(type, excludeId = null) {
    await this._ensureConnection();

    try {
      const whereCondition = { type };
      if (excludeId) {
        whereCondition.id = { [this.Op.ne]: excludeId };
      }

      const result = await this.model.findOne({ where: whereCondition });
      if (result) {
        throw this.exceptions.uploadFile.typeExists(type);
      }
      return true;
    } catch (error) {
      if (error.name === 'UniqueConstraintError') {
        throw error;
      }
      this._handleError(error, 'checkTypeUnique', { type, excludeId });
    }
  }

  /**
   * 根据上传类型查找配置
   * @param {String} type 上传类型
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 配置对象
   */
  async findByType(type, options = {}) {
    const filters = { type: { $eq: type } };
    return await this.findOne(filters, options);
  }

  /**
   * 获取默认上传配置
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 默认配置
   */
  async getDefaultConfig(options = {}) {
    try {
      const result = await this.find(
        { isPaging: '0' },
        {
          ...options,
          sort: [{ field: 'createdAt', order: 'asc' }],
        }
      );

      if (_.isEmpty(result)) {
        // 如果没有配置，创建一个默认的本地配置
        return await this.create({
          type: 'local',
          uploadPath: process.cwd() + '/app/public',
        });
      }

      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      this._handleError(error, 'getDefaultConfig', { options });
    }
  }

  /**
   * 创建或更新上传配置
   * @param {Object} configData 配置数据
   * @return {Promise<Object>} 配置对象
   */
  async createOrUpdateConfig(configData) {
    await this._ensureConnection();

    try {
      const { type } = configData;

      // 查找是否已存在该类型的配置
      const existingConfig = await this.findByType(type);

      if (existingConfig) {
        // 更新现有配置
        return await this.update(existingConfig.id, configData);
      }
      // 创建新配置
      return await this.create(configData);
    } catch (error) {
      this._handleError(error, 'createOrUpdateConfig', { configData });
    }
  }

  /**
   * 验证上传配置的有效性
   * @param {String} type 上传类型
   * @param {Object} config 配置对象
   * @return {Promise<Boolean>} 是否有效
   */
  async validateConfig(type, config) {
    try {
      return this._validateConfigByType(type, config, false);
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取七牛云配置
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 七牛云配置
   */
  async getQiniuConfig(options = {}) {
    return await this.findByType('qn', options);
  }

  /**
   * 获取阿里云OSS配置
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 阿里云OSS配置
   */
  async getOssConfig(options = {}) {
    return await this.findByType('oss', options);
  }

  /**
   * 获取本地存储配置
   * @param {Object} options 查询选项
   * @return {Promise<Object|null>} 本地存储配置
   */
  async getLocalConfig(options = {}) {
    return await this.findByType('local', options);
  }

  /**
   * 更新上传配置
   * @param {String} id 配置ID
   * @param {Object} configData 配置数据
   * @return {Promise<Object>} 更新后的配置
   */
  async updateUploadConfig(id, configData) {
    return await this.update(id, configData);
  }

  /**
   * 检查配置是否存在
   * @param {String} type 上传类型
   * @return {Promise<Boolean>} 是否存在
   */
  async configExists(type) {
    const config = await this.findByType(type);
    return !_.isEmpty(config);
  }

  /**
   * 获取所有上传配置
   * @param {Object} options 查询选项
   * @return {Promise<Array>} 配置列表
   */
  async getAllConfigs(options = {}) {
    const result = await this.find({ isPaging: '0' }, options);
    return Array.isArray(result) ? result : [result].filter(Boolean);
  }

  /**
   * 删除上传配置
   * @param {String} id 配置ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteConfig(id) {
    return await this.remove(id);
  }

  /**
   * 批量删除上传配置
   * @param {Array} ids 配置ID数组
   * @return {Promise<Object>} 删除结果
   */
  async deleteConfigs(ids) {
    return await this.remove(ids);
  }

  /**
   * 批量更新记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} data 更新数据
   * @param {Object} query 额外查询条件
   * @return {Promise<Object>} 更新结果
   */
  async updateMany(ids, data, query = {}) {
    await this._ensureConnection();

    try {
      const normalizedIds = Array.isArray(ids) ? ids : [ids];
      const processedData = this._customPreprocessForUpdate(data);
      processedData.updatedAt = new Date();

      const where = {
        id: { [this.Op.in]: normalizedIds },
        ...this._buildWhereCondition(query),
      };

      const [affectedCount] = await this.model.update(processedData, { where });
      this._logOperation('updateMany', { ids, data, query }, { affectedCount });
      return { affectedCount };
    } catch (error) {
      this._handleError(error, 'updateMany', { ids, data, query });
    }
  }

  // ===== 🔥 辅助方法 =====

  /**
   * 获取上传类型文本描述
   * @param {String} type 上传类型
   * @return {String} 类型文本
   * @private
   */
  _getUploadTypeText(type) {
    const typeMap = {
      local: '本地存储',
      qn: '七牛云存储',
      oss: '阿里云OSS',
    };
    return typeMap[type] || type;
  }

  /**
   * 根据类型验证配置数据
   * @param {String} type 上传类型
   * @param {Object} config 配置数据
   * @param {Boolean} throwError 是否抛出异常
   * @return {Boolean} 是否有效
   * @private
   */
  _validateConfigByType(type, config, throwError = true) {
    switch (type) {
      case 'local':
        if (!config.uploadPath) {
          if (throwError) throw this.exceptions.uploadFile.uploadPathRequired();
          return false;
        }
        return true;

      case 'qn':
        if (!config.qn_bucket) {
          if (throwError) throw this.exceptions.uploadFile.qnBucketRequired();
          return false;
        }
        if (!config.qn_accessKey) {
          if (throwError) throw this.exceptions.uploadFile.qnAccessKeyRequired();
          return false;
        }
        if (!config.qn_secretKey) {
          if (throwError) throw this.exceptions.uploadFile.qnSecretKeyRequired();
          return false;
        }
        if (!config.qn_zone) {
          if (throwError) throw this.exceptions.uploadFile.qnZoneRequired();
          return false;
        }
        if (!config.qn_endPoint) {
          if (throwError) throw this.exceptions.uploadFile.qnEndPointRequired();
          return false;
        }
        return true;

      case 'oss':
        if (!config.oss_bucket) {
          if (throwError) throw this.exceptions.uploadFile.ossBucketRequired();
          return false;
        }
        if (!config.oss_accessKey) {
          if (throwError) throw this.exceptions.uploadFile.ossAccessKeyRequired();
          return false;
        }
        if (!config.oss_secretKey) {
          if (throwError) throw this.exceptions.uploadFile.ossSecretKeyRequired();
          return false;
        }
        if (!config.oss_region) {
          if (throwError) throw this.exceptions.uploadFile.ossRegionRequired();
          return false;
        }
        if (!config.oss_endPoint) {
          if (throwError) throw this.exceptions.uploadFile.ossEndPointRequired();
          return false;
        }
        return true;

      default:
        if (throwError) throw this.exceptions.uploadFile.invalidType(type);
        return false;
    }
  }

  /**
   * 构建where查询条件
   * @param {Object} query 查询条件
   * @return {Object} where条件
   * @private
   */
  _buildWhereCondition(query = {}) {
    const where = {};

    // 处理标准化查询条件
    for (const [field, condition] of Object.entries(query)) {
      if (condition && typeof condition === 'object' && condition.$eq !== undefined) {
        where[field] = condition.$eq;
      } else if (condition && typeof condition === 'object' && condition.$regex !== undefined) {
        where[field] = { [this.Op.like]: `%${condition.$regex}%` };
      } else {
        where[field] = condition;
      }
    }

    return where;
  }
}

module.exports = UploadFileMariaRepository;
