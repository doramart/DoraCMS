/**
 * Webhook MongoDB Repository
 * 基于标准化的 Repository 模式
 * 继承 BaseMongoRepository，实现 Webhook 特有的业务逻辑
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');
const SYSTEM_CONSTANTS = require('../../../constants/SystemConstants');
const WebhookEvents = require('../../../constants/WebhookEvents');
const crypto = require('crypto');
const _ = require('lodash');

class WebhookMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'Webhook');

    // 设置 MongoDB 模型
    this.model = this.app.model.Webhook;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        user: {
          model: this.app.model.User,
          path: 'userId',
          select: ['userName', 'email', 'phoneNum', 'logo'],
        },
      },
    });
  }

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [{ path: 'userId', select: ['userName', 'email', 'phoneNum', 'logo'] }];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['name', 'url', 'description'];
  }

  /**
   * 获取默认的排序配置
   * @return {Array} 默认的排序配置
   * @protected
   */
  _getDefaultSort() {
    return [
      { field: 'createdAt', order: 'desc' },
      { field: 'stats.lastDeliveryAt', order: 'desc' },
    ];
  }

  /**
   * 重写状态映射
   * @return {Object} 状态映射对象
   * @protected
   */
  _getStatusMapping() {
    return {
      active: '启用',
      disabled: '禁用',
      deleted: '已删除',
    };
  }

  /**
   * 子类自定义的数据项处理 - Webhook 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @param {Object} options 查询选项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 添加状态文本
    if (item.status) {
      item.statusText = this._getStatusText(item.status);
    }

    // 确保数组字段的默认值
    item.events = item.events || [];

    // 转换 headers Map 为普通对象
    if (item.headers && item.headers instanceof Map) {
      item.headers = Object.fromEntries(item.headers);
    }

    // 确保重试配置的默认值
    if (!item.retryConfig) {
      item.retryConfig = { maxRetries: 3, retryDelay: 1000 };
    }

    // 确保统计信息的默认值
    if (!item.stats) {
      item.stats = {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
      };
    }

    // 添加成功率
    if (item.stats && item.stats.totalDeliveries > 0) {
      item.stats.successRate = ((item.stats.successfulDeliveries / item.stats.totalDeliveries) * 100).toFixed(2);
    } else {
      item.stats.successRate = '0.00';
    }

    // 处理 secret 字段（类似 ApiKey）
    if (item.secret) {
      item.secretMasked = '****' + item.secret.slice(-4);
      // 在非特殊情况下隐藏完整 secret
      if (!options.includeSecret) {
        delete item.secret;
      }
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理 - Webhook 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 验证必填字段
    if (!data.name || data.name.trim() === '') {
      throw this.exceptions.webhook.nameRequired();
    }

    if (!data.url || data.url.trim() === '') {
      throw this.exceptions.webhook.urlRequired();
    }

    if (!data.userId) {
      throw this.exceptions.webhook.userIdRequired();
    }

    if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
      throw this.exceptions.webhook.eventsRequired();
    }

    // 验证 URL 格式
    if (!this._isValidUrl(data.url)) {
      throw this.exceptions.webhook.invalidUrl(data.url);
    }

    // 验证事件是否有效
    for (const event of data.events) {
      if (!WebhookEvents.isValidEvent(event)) {
        throw this.exceptions.webhook.invalidEvent(event);
      }
    }

    // 验证字段长度
    if (data.name.length > 100) {
      throw this.exceptions.webhook.nameTooLong(100);
    }

    if (data.description && data.description.length > 500) {
      throw this.exceptions.webhook.descriptionTooLong(500);
    }

    // 验证重试配置
    if (data.retryConfig) {
      this._validateRetryConfig(data.retryConfig);
    }

    // 验证超时配置
    if (data.timeout !== undefined) {
      if (typeof data.timeout !== 'number' || data.timeout < 1000 || data.timeout > 60000) {
        throw this.exceptions.webhook.invalidTimeout();
      }
    }

    // 设置默认值
    if (!data.secret) {
      data.secret = this._generateSecret();
    }

    if (!data.retryConfig) {
      data.retryConfig = { maxRetries: 3, retryDelay: 1000 };
    }

    if (data.timeout === undefined) {
      data.timeout = 10000;
    }

    if (data.active === undefined) {
      data.active = true;
    }

    if (!data.stats) {
      data.stats = {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
      };
    }

    // 转换 headers 对象为 Map
    if (data.headers && !(data.headers instanceof Map)) {
      data.headers = new Map(Object.entries(data.headers));
    }

    return this.transformer.transformIdFields(data, 'toDatabase');
  }

  /**
   * 子类自定义的更新前数据处理 - Webhook 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 验证字段（如果提供）
    if (data.name !== undefined) {
      if (!data.name || data.name.trim() === '') {
        throw this.exceptions.webhook.nameRequired();
      }
      if (data.name.length > 100) {
        throw this.exceptions.webhook.nameTooLong(100);
      }
    }

    if (data.url !== undefined) {
      if (!data.url || data.url.trim() === '') {
        throw this.exceptions.webhook.urlRequired();
      }
      if (!this._isValidUrl(data.url)) {
        throw this.exceptions.webhook.invalidUrl(data.url);
      }
    }

    if (data.events !== undefined) {
      if (!Array.isArray(data.events) || data.events.length === 0) {
        throw this.exceptions.webhook.eventsRequired();
      }
      for (const event of data.events) {
        if (!WebhookEvents.isValidEvent(event)) {
          throw this.exceptions.webhook.invalidEvent(event);
        }
      }
    }

    if (data.description !== undefined && data.description && data.description.length > 500) {
      throw this.exceptions.webhook.descriptionTooLong(500);
    }

    if (data.retryConfig !== undefined) {
      this._validateRetryConfig(data.retryConfig);
    }

    if (data.timeout !== undefined) {
      if (typeof data.timeout !== 'number' || data.timeout < 1000 || data.timeout > 60000) {
        throw this.exceptions.webhook.invalidTimeout();
      }
    }

    // 转换 headers 对象为 Map
    if (data.headers && !(data.headers instanceof Map)) {
      data.headers = new Map(Object.entries(data.headers));
    }

    return this.transformer.transformIdFields(data, 'toDatabase');
  }

  // ===== Webhook 特有的业务方法 =====

  /**
   * 生成 Webhook Secret
   * @return {String} 生成的 secret
   * @private
   */
  _generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 验证 URL 格式
   * @param {String} url URL 字符串
   * @return {Boolean} 是否有效
   * @private
   */
  _isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证重试配置
   * @param {Object} retryConfig 重试配置
   * @private
   */
  _validateRetryConfig(retryConfig) {
    if (!retryConfig || typeof retryConfig !== 'object') {
      throw this.exceptions.webhook.invalidRetryConfig();
    }

    if (retryConfig.maxRetries !== undefined) {
      if (typeof retryConfig.maxRetries !== 'number' || retryConfig.maxRetries < 0 || retryConfig.maxRetries > 10) {
        throw this.exceptions.webhook.invalidMaxRetries();
      }
    }

    if (retryConfig.retryDelay !== undefined) {
      if (
        typeof retryConfig.retryDelay !== 'number' ||
        retryConfig.retryDelay < 100 ||
        retryConfig.retryDelay > 60000
      ) {
        throw this.exceptions.webhook.invalidRetryDelay();
      }
    }
  }

  /**
   * 根据用户ID查找 Webhooks
   * @param {String} userId 用户ID
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByUserId(userId, payload = {}, options = {}) {
    const filters = { userId: { $eq: userId }, ...options.filters };
    return await this.find(payload, { ...options, filters });
  }

  /**
   * 根据事件查找活跃的 Webhooks
   * @param {String} event 事件名称
   * @param {Object} options 查询选项
   * @return {Promise<Array>} Webhook 列表
   */
  async findByEvent(event, options = {}) {
    const query = {
      events: event,
      active: true,
      status: 'active',
    };

    const result = await this.model
      .find(query)
      .select(options.fields || '+secret') // 需要 secret 用于签名
      .populate(options.populate || this._getDefaultPopulate())
      .lean();

    return result.map(item => this._customProcessDataItem(item, { includeSecret: true }));
  }

  /**
   * 检查 Webhook 名称是否唯一（用户维度）
   * @param {String} name Webhook 名称
   * @param {String} userId 用户ID
   * @param {String} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkNameUnique(name, userId, excludeId = null) {
    const query = { name, userId };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await this.model.findOne(query).lean();
    if (existing) {
      throw this.exceptions.webhook.nameAlreadyExists(name);
    }
    return true;
  }

  /**
   * 更新 Webhook 统计信息
   * @param {String} webhookId Webhook ID
   * @param {Object} stats 统计数据
   * @return {Promise<Object>} 更新结果
   */
  async updateStats(webhookId, stats) {
    const updateData = {};

    if (stats.totalDeliveries !== undefined) {
      updateData['stats.totalDeliveries'] = stats.totalDeliveries;
    }
    if (stats.successfulDeliveries !== undefined) {
      updateData['stats.successfulDeliveries'] = stats.successfulDeliveries;
    }
    if (stats.failedDeliveries !== undefined) {
      updateData['stats.failedDeliveries'] = stats.failedDeliveries;
    }
    if (stats.lastDeliveryAt !== undefined) {
      updateData['stats.lastDeliveryAt'] = stats.lastDeliveryAt;
    }
    if (stats.lastSuccessAt !== undefined) {
      updateData['stats.lastSuccessAt'] = stats.lastSuccessAt;
    }
    if (stats.lastFailureAt !== undefined) {
      updateData['stats.lastFailureAt'] = stats.lastFailureAt;
    }

    updateData.updatedAt = new Date();

    return await this.model.findByIdAndUpdate(webhookId, { $set: updateData }, { new: true }).lean();
  }

  /**
   * 增加 Webhook 统计计数
   * @param {String} webhookId Webhook ID
   * @param {String} type 类型：total, success, failed
   * @return {Promise<Object>} 更新结果
   */
  async incrementStats(webhookId, type) {
    const updateData = {
      updatedAt: new Date(),
    };

    switch (type) {
      case 'total':
        updateData.$inc = { 'stats.totalDeliveries': 1 };
        updateData.$set = { 'stats.lastDeliveryAt': new Date() };
        break;
      case 'success':
        updateData.$inc = {
          'stats.totalDeliveries': 1,
          'stats.successfulDeliveries': 1,
        };
        updateData.$set = {
          'stats.lastDeliveryAt': new Date(),
          'stats.lastSuccessAt': new Date(),
        };
        break;
      case 'failed':
        updateData.$inc = {
          'stats.totalDeliveries': 1,
          'stats.failedDeliveries': 1,
        };
        updateData.$set = {
          'stats.lastDeliveryAt': new Date(),
          'stats.lastFailureAt': new Date(),
        };
        break;
      default:
        throw new Error(`Invalid stats type: ${type}`);
    }

    return await this.model.findByIdAndUpdate(webhookId, updateData, { new: true }).lean();
  }

  /**
   * 重新生成 Webhook Secret
   * @param {String} webhookId Webhook ID
   * @return {Promise<Object>} 更新后的 Webhook（包含新 secret）
   */
  async regenerateSecret(webhookId) {
    const newSecret = this._generateSecret();
    const updated = await this.model
      .findByIdAndUpdate(
        webhookId,
        {
          $set: {
            secret: newSecret,
            updatedAt: new Date(),
          },
        },
        { new: true }
      )
      .select('+secret')
      .populate(this._getDefaultPopulate())
      .lean();

    if (!updated) {
      throw this.exceptions.webhook.notFound(webhookId);
    }

    return this._customProcessDataItem(updated, { includeSecret: true });
  }

  /**
   * 获取用户的 Webhook 统计信息
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 统计信息
   */
  async getUserWebhookStats(userId) {
    const result = await this.model.aggregate([
      { $match: { userId, status: { $ne: 'deleted' } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$active', false] }, 1, 0] },
          },
          totalDeliveries: { $sum: '$stats.totalDeliveries' },
          successfulDeliveries: { $sum: '$stats.successfulDeliveries' },
          failedDeliveries: { $sum: '$stats.failedDeliveries' },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        successRate: '0.00',
      };
    }

    const stats = result[0];
    stats.successRate =
      stats.totalDeliveries > 0 ? ((stats.successfulDeliveries / stats.totalDeliveries) * 100).toFixed(2) : '0.00';

    delete stats._id;
    return stats;
  }

  /**
   * 批量更新 Webhook 状态
   * @param {Array} webhookIds Webhook ID 数组
   * @param {Boolean} active 是否启用
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateActive(webhookIds, active) {
    const result = await this.model.updateMany(
      { _id: { $in: webhookIds } },
      {
        $set: {
          active,
          updatedAt: new Date(),
        },
      }
    );

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    };
  }
}

module.exports = WebhookMongoRepository;
