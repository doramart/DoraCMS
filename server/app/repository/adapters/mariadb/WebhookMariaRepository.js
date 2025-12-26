/**
 * Webhook MariaDB Repository
 * 基于 BaseMariaRepository，实现 Webhook 特有的业务逻辑
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');
const WebhookEvents = require('../../../constants/WebhookEvents');
const crypto = require('crypto');

class WebhookMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'Webhook');

    // 初始化 MariaDB 连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
    this.userModel = null;
  }

  /**
   * 初始化数据库连接和模型
   * @private
   */
  async _initializeConnection() {
    try {
      await this.connection.initialize();

      this.model = this.connection.getModel('Webhook');
      this.userModel = this.connection.getModel('User');

      if (!this.model || !this.userModel) {
        throw new Error('Webhook 或 User 模型未找到');
      }

      // 注册模型和关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          user: {
            model: this.userModel,
            type: 'belongsTo',
            foreignKey: 'userId',
            as: 'user',
            select: ['id', 'userName', 'email', 'phoneNum', 'logo'],
          },
        },
      });
    } catch (error) {
      console.error('❌ WebhookMariaRepository initialization failed:', error);
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

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      {
        model: this.userModel,
        as: 'user',
        attributes: ['id', 'userName', 'email', 'phoneNum', 'logo'],
      },
    ];
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
    return [{ field: 'createdAt', order: 'desc' }];
  }

  /**
   * 获取状态映射
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
   * 子类自定义的数据项处理
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

    // 添加成功率
    if (item.stats && item.stats.totalDeliveries > 0) {
      item.stats.successRate = ((item.stats.successfulDeliveries / item.stats.totalDeliveries) * 100).toFixed(2);
    } else if (item.stats) {
      item.stats.successRate = '0.00';
    }

    // 处理 secret 字段
    if (item.secret) {
      item.secretMasked = '****' + item.secret.slice(-4);
      if (!options.includeSecret) {
        delete item.secret;
      }
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理
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

    // 验证事件
    for (const event of data.events) {
      if (!WebhookEvents.isValidEvent(event)) {
        throw this.exceptions.webhook.invalidEvent(event);
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

    return this.transformer.transformIdFields(data, 'toDatabase');
  }

  /**
   * 子类自定义的更新前数据处理
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 验证字段
    if (data.name !== undefined && (!data.name || data.name.trim() === '')) {
      throw this.exceptions.webhook.nameRequired();
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
   * 根据用户ID查找 Webhooks
   * @param {String} userId 用户ID
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByUserId(userId, payload = {}, options = {}) {
    await this._ensureConnection();
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
    await this._ensureConnection();

    const result = await this.model.findAll({
      where: {
        active: true,
        status: 'active',
        events: {
          [this.connection.sequelize.Sequelize.Op.like]: `%"${event}"%`,
        },
      },
      include: options.populate || this._getDefaultPopulate(),
    });

    return result.map(item => this._customProcessDataItem(item.toJSON(), { includeSecret: true }));
  }

  /**
   * 检查 Webhook 名称是否唯一
   * @param {String} name Webhook 名称
   * @param {String} userId 用户ID
   * @param {String} excludeId 排除的ID
   * @return {Promise<Boolean>} 是否唯一
   */
  async checkNameUnique(name, userId, excludeId = null) {
    await this._ensureConnection();

    const where = { name, userId };
    if (excludeId) {
      where.id = { [this.connection.sequelize.Sequelize.Op.ne]: excludeId };
    }

    const count = await this.model.count({ where });
    if (count > 0) {
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
    await this._ensureConnection();

    const webhook = await this.model.findByPk(webhookId);
    if (!webhook) {
      throw this.exceptions.webhook.notFound(webhookId);
    }

    const currentStats = webhook.stats || {};
    const updatedStats = { ...currentStats, ...stats };

    await webhook.update({ stats: updatedStats });
    return webhook.toJSON();
  }

  /**
   * 增加 Webhook 统计计数
   * @param {String} webhookId Webhook ID
   * @param {String} type 类型：success 或 failed
   * @return {Promise<Object>} 更新结果
   */
  async incrementStats(webhookId, type) {
    await this._ensureConnection();

    const webhook = await this.model.findByPk(webhookId);
    if (!webhook) {
      throw this.exceptions.webhook.notFound(webhookId);
    }

    const stats = webhook.stats || {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
    };

    switch (type) {
      case 'success':
        stats.totalDeliveries = (stats.totalDeliveries || 0) + 1;
        stats.successfulDeliveries = (stats.successfulDeliveries || 0) + 1;
        stats.lastDeliveryAt = new Date();
        stats.lastSuccessAt = new Date();
        break;
      case 'failed':
        stats.totalDeliveries = (stats.totalDeliveries || 0) + 1;
        stats.failedDeliveries = (stats.failedDeliveries || 0) + 1;
        stats.lastDeliveryAt = new Date();
        stats.lastFailureAt = new Date();
        break;
      default:
        throw new Error(`Invalid stats type: ${type}`);
    }

    await webhook.update({ stats });
    return webhook.toJSON();
  }

  /**
   * 重新生成 Webhook Secret
   * @param {String} webhookId Webhook ID
   * @return {Promise<Object>} 更新后的 Webhook
   */
  async regenerateSecret(webhookId) {
    await this._ensureConnection();

    const webhook = await this.model.findByPk(webhookId, {
      include: this._getDefaultPopulate(),
    });

    if (!webhook) {
      throw this.exceptions.webhook.notFound(webhookId);
    }

    const newSecret = this._generateSecret();
    await webhook.update({ secret: newSecret });

    return this._customProcessDataItem(webhook.toJSON(), { includeSecret: true });
  }

  /**
   * 获取用户的 Webhook 统计信息
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 统计信息
   */
  async getUserWebhookStats(userId) {
    await this._ensureConnection();

    const webhooks = await this.model.findAll({
      where: { userId, status: { [this.connection.sequelize.Sequelize.Op.ne]: 'deleted' } },
    });

    const stats = {
      total: webhooks.length,
      active: 0,
      inactive: 0,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
    };

    webhooks.forEach(webhook => {
      const webhookData = webhook.toJSON();
      if (webhookData.active) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      if (webhookData.stats) {
        stats.totalDeliveries += webhookData.stats.totalDeliveries || 0;
        stats.successfulDeliveries += webhookData.stats.successfulDeliveries || 0;
        stats.failedDeliveries += webhookData.stats.failedDeliveries || 0;
      }
    });

    stats.successRate =
      stats.totalDeliveries > 0 ? ((stats.successfulDeliveries / stats.totalDeliveries) * 100).toFixed(2) : '0.00';

    return stats;
  }

  /**
   * 批量更新 Webhook 状态
   * @param {Array} webhookIds Webhook ID 数组
   * @param {Boolean} active 是否启用
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateActive(webhookIds, active) {
    await this._ensureConnection();

    const result = await this.model.update(
      { active, updatedAt: new Date() },
      {
        where: {
          id: { [this.connection.sequelize.Sequelize.Op.in]: webhookIds },
        },
      }
    );

    return {
      modifiedCount: result[0],
      matchedCount: result[0],
    };
  }
}

module.exports = WebhookMariaRepository;
