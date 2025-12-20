/**
 * 标准化的 UploadFile MongoDB Repository
 * 基于三层架构优化版本 (2024)
 * 🔥 继承BaseMongoRepository，基础CRUD方法全部自动获得
 * 🎯 只需实现业务特定方法和钩子方法
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const UniqueChecker = require('../../../utils/UniqueChecker');
const _ = require('lodash');

class UploadFileMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'UploadFile');

    // 设置 MongoDB 模型
    this.model = this.app.model.UploadFile;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        // UploadFile 模块一般不需要关联关系，但保留扩展性
      },
    });
  }

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      // UploadFile 模块一般不需要关联查询，保留空数组
    ];
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
   * 子类自定义的数据项处理（业务特定逻辑）
   * @param {Object} item 预处理后的数据项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item) {
    if (!item) return item;

    // 添加上传类型文本描述
    if (item.type) {
      item.typeText = this._getUploadTypeText(item.type);
    }

    // 格式化配置信息显示
    if (item.type === 'local' && item.uploadPath) {
      item.displayPath = item.uploadPath.replace(process.cwd(), '.');
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理（业务特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 验证上传类型
    if (!data.type) {
      throw this.exceptions.uploadFile.typeRequired();
    }

    if (!['local', 'qn', 'oss'].includes(data.type)) {
      throw this.exceptions.uploadFile.invalidType(data.type);
    }

    // 根据类型验证必需字段
    this._validateConfigByType(data.type, data);

    // 设置默认值
    if (!data.createdAt) {
      data.createdAt = new Date();
    }

    return data;
  }

  /**
   * 子类自定义的更新前数据处理（业务特定逻辑）
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 如果更新了类型，验证配置
    if (data.type) {
      if (!['local', 'qn', 'oss'].includes(data.type)) {
        throw this.exceptions.uploadFile.invalidType(data.type);
      }
      this._validateConfigByType(data.type, data);
    }

    return data;
  }

  // ===== 🔥 业务特有方法 - UploadFile配置管理 =====

  /**
   * 🔥 统一异常处理版本：检查上传类型是否唯一
   * @param {String} type 上传类型
   * @param {String} excludeId 排除的ID（用于更新时检查）
   * @return {Promise<Boolean>} 是否唯一
   * @throws {UniqueConstraintError} 当上传类型已存在时抛出异常
   */
  async checkTypeUnique(type, excludeId = null) {
    try {
      const query = { type: { $eq: type } };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      const result = await this.findOne(query);
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
    try {
      const { type } = configData;

      // 查找是否已存在该类型的配置
      const existingConfig = await this.findByType(type);

      if (existingConfig) {
        // 更新现有配置
        return await this.update(existingConfig._id || existingConfig.id, configData);
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
    try {
      const normalizedIds = Array.isArray(ids) ? ids : [ids];

      // 🔥 检查是否包含 MongoDB 操作符（如 $inc, $set, $unset）
      const hasMongoOperators = data.$inc || data.$set || data.$unset || data.$push || data.$pull;
      let updateData;

      if (hasMongoOperators) {
        // 如果包含操作符，直接使用，并添加 $set 更新时间
        updateData = {
          ...data,
          $set: {
            ...(data.$set || {}),
            updatedAt: new Date(),
          },
        };
      } else {
        // 如果不包含操作符，预处理数据并使用 $set 包装
        const processedData = this._customPreprocessForUpdate(data);
        processedData.updatedAt = new Date();
        updateData = { $set: processedData };
      }

      const updateQuery = {
        _id: { $in: normalizedIds },
        ...query,
      };

      const result = await this.model.updateMany(updateQuery, updateData);
      this._logOperation('updateMany', { ids, data, query }, result);
      return result;
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
}

module.exports = UploadFileMongoRepository;
