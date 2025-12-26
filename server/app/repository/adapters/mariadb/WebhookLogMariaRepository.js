/**
 * WebhookLog MariaDB Repository
 * 基于标准化的 Repository 模式
 * 继承 BaseMariaRepository，实现 WebhookLog 特有的业务逻辑
 */
'use strict';

const BaseMariaRepository = require('../../base/BaseMariaRepository');
const MariaDBConnection = require('../../connections/MariaDBConnection');

class WebhookLogMariaRepository extends BaseMariaRepository {
  constructor(ctx) {
    super(ctx, 'WebhookLog');

    // 初始化 MariaDB 连接
    this.connection = MariaDBConnection.getInstance(ctx.app);
    this.model = null;
    this.webhookModel = null;
  }

  /**
   * 初始化数据库连接和模型
   * @private
   */
  async _initializeConnection() {
    try {
      // 确保连接管理器已初始化
      await this.connection.initialize();

      // 使用连接管理器中已建立关联关系的模型
      this.model = this.connection.getModel('WebhookLog');
      this.webhookModel = this.connection.getModel('Webhook');

      if (!this.model || !this.webhookModel) {
        throw new Error('WebhookLog 或 Webhook 模型未找到，请检查模型加载顺序');
      }

      // 注册模型和标准关联关系
      this.registerModel({
        mariaModel: this.model,
        relations: {
          webhook: {
            model: this.webhookModel,
            type: 'belongsTo',
            foreignKey: 'webhookId',
            as: 'webhook',
            select: ['id', 'name', 'url', 'userId'],
          },
        },
      });
    } catch (error) {
      console.error('❌ WebhookLogMariaRepository initialization failed:', error);
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

  // ===== 重写基类的抽象方法 - WebhookLog 特有配置 =====

  /**
   * 获取默认的关联查询配置
   * @return {Array} 默认的 populate 配置
   * @protected
   */
  _getDefaultPopulate() {
    return [
      {
        model: this.webhookModel,
        as: 'webhook',
        attributes: ['id', 'name', 'url', 'userId'],
      },
    ];
  }

  /**
   * 获取默认的搜索字段
   * @return {Array} 默认的搜索字段
   * @protected
   */
  _getDefaultSearchKeys() {
    return ['event', 'webhookId'];
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
      pending: '待发送',
      success: '成功',
      failed: '失败',
      retrying: '重试中',
    };
  }

  /**
   * 获取需要排除的字段
   * @return {Array} 排除字段列表
   * @protected
   */
  _getExcludeTableFields() {
    const baseExcludeFields = super._getExcludeTableFields();

    // WebhookLog 特有的需要排除的字段
    const webhookLogExcludeFields = [
      'webhook', // 关联字段 - 通过 belongsTo 管理
    ];

    return [...baseExcludeFields, ...webhookLogExcludeFields];
  }

  /**
   * 子类自定义的数据项处理 - WebhookLog 特有逻辑
   * @param {Object} item 预处理后的数据项
   * @param {Object} options 查询选项
   * @return {Object} 最终数据项
   * @protected
   */
  _customProcessDataItem(item, options = {}) {
    if (!item) return item;

    // 调用基类方法添加状态文本
    item = super._customProcessDataItem(item, options);

    // 添加虚拟字段
    item.isSuccess = item.status === 'success';
    item.isFailed = item.status === 'failed';
    item.needsRetry = item.status === 'retrying' && item.nextRetryAt && new Date() >= new Date(item.nextRetryAt);

    // 限制响应体大小（避免返回过大的数据）
    if (item.response && item.response.body && item.response.body.length > 1000 && !options.includeFullResponse) {
      item.response.bodyTruncated = true;
      item.response.body = item.response.body.substring(0, 1000) + '... (truncated)';
    }

    return item;
  }

  /**
   * 子类自定义的创建前数据处理 - WebhookLog 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
    // 调用基类方法
    data = super._customPreprocessForCreate(data);

    // 验证必填字段
    if (!data.webhookId) {
      throw this.exceptions.webhookLog.webhookIdRequired();
    }

    if (!data.event) {
      throw this.exceptions.webhookLog.eventRequired();
    }

    if (!data.payload) {
      throw this.exceptions.webhookLog.payloadRequired();
    }

    // 设置默认值
    if (!data.status) {
      data.status = 'pending';
    }

    if (data.retryCount === undefined) {
      data.retryCount = 0;
    }

    return data;
  }

  /**
   * 子类自定义的更新前数据处理 - WebhookLog 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 调用基类方法
    data = super._customPreprocessForUpdate(data);

    return data;
  }

  // ===== WebhookLog 特有的业务方法 =====

  /**
   * 根据 Webhook ID 查找日志
   * @param {String} webhookId Webhook ID
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByWebhookId(webhookId, payload = {}, options = {}) {
    try {
      const filters = { webhookId, ...options.filters };
      return await this.find(payload, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByWebhookId', { webhookId, payload, options });
    }
  }

  /**
   * 根据事件查找日志
   * @param {String} event 事件名称
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByEvent(event, payload = {}, options = {}) {
    try {
      const filters = { event, ...options.filters };
      return await this.find(payload, { ...options, filters });
    } catch (error) {
      this._handleError(error, 'findByEvent', { event, payload, options });
    }
  }

  /**
   * 查找需要重试的日志
   * @param {Number} limit 限制数量
   * @return {Promise<Array>} 日志列表
   */
  async findPendingRetries(limit = 100) {
    await this._ensureConnection();

    try {
      const now = new Date();
      const result = await this.model.findAll({
        where: {
          status: 'retrying',
          nextRetryAt: { [this.Op.lte]: now },
        },
        limit,
        include: this._getDefaultPopulate(),
      });

      return result.map(item => this._customProcessDataItem(item.toJSON()));
    } catch (error) {
      this._handleError(error, 'findPendingRetries', { limit });
    }
  }

  /**
   * 更新日志状态为成功
   * @param {String} logId 日志ID
   * @param {Object} response 响应数据
   * @param {Number} duration 响应时间（毫秒）
   * @return {Promise<Object>} 更新后的日志
   */
  async markAsSuccess(logId, response, duration) {
    await this._ensureConnection();

    try {
      const updateData = {
        status: 'success',
        response: {
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          headers: response.headers || {},
          body: response.body ? response.body.substring(0, 10000) : '', // 限制大小
        },
        duration,
        completedAt: new Date(),
      };

      await this.model.update(updateData, { where: { id: logId } });

      const updated = await this.model.findByPk(logId, {
        include: this._getDefaultPopulate(),
      });

      return this._customProcessDataItem(updated.toJSON());
    } catch (error) {
      this._handleError(error, 'markAsSuccess', { logId, response, duration });
    }
  }

  /**
   * 更新日志状态为失败
   * @param {String} logId 日志ID
   * @param {Object} error 错误信息
   * @param {Number} duration 响应时间（毫秒）
   * @param {Object} response 响应数据（可选）
   * @return {Promise<Object>} 更新后的日志
   */
  async markAsFailed(logId, error, duration, response = null) {
    await this._ensureConnection();

    try {
      const updateData = {
        status: 'failed',
        error: {
          message: error.message || String(error),
          code: error.code || 'UNKNOWN_ERROR',
          stack: error.stack,
        },
        duration,
        completedAt: new Date(),
      };

      if (response) {
        updateData.response = {
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          headers: response.headers || {},
          body: response.body ? response.body.substring(0, 10000) : '',
        };
      }

      await this.model.update(updateData, { where: { id: logId } });

      const updated = await this.model.findByPk(logId, {
        include: this._getDefaultPopulate(),
      });

      return this._customProcessDataItem(updated.toJSON());
    } catch (error) {
      this._handleError(error, 'markAsFailed', { logId, error, duration, response });
    }
  }

  /**
   * 更新日志状态为重试中
   * @param {String} logId 日志ID
   * @param {Date} nextRetryAt 下次重试时间
   * @return {Promise<Object>} 更新后的日志
   */
  async markAsRetrying(logId, nextRetryAt) {
    await this._ensureConnection();

    try {
      const log = await this.model.findByPk(logId);
      if (!log) {
        throw this.exceptions.webhookLog.notFound(logId);
      }

      await this.model.update(
        {
          status: 'retrying',
          nextRetryAt,
          retryCount: log.retryCount + 1,
        },
        { where: { id: logId } }
      );

      const updated = await this.model.findByPk(logId, {
        include: this._getDefaultPopulate(),
      });

      return this._customProcessDataItem(updated.toJSON());
    } catch (error) {
      this._handleError(error, 'markAsRetrying', { logId, nextRetryAt });
    }
  }

  /**
   * 获取 Webhook 的统计信息
   * @param {String} webhookId Webhook ID
   * @param {Object} dateRange 日期范围 { start, end }
   * @return {Promise<Object>} 统计信息
   */
  async getWebhookStats(webhookId, dateRange = null) {
    await this._ensureConnection();

    try {
      const whereCondition = { webhookId };

      if (dateRange) {
        whereCondition.createdAt = {};
        if (dateRange.start) {
          whereCondition.createdAt[this.Op.gte] = new Date(dateRange.start);
        }
        if (dateRange.end) {
          whereCondition.createdAt[this.Op.lte] = new Date(dateRange.end);
        }
      }

      const sequelize = this.connection.getSequelize();

      const result = await this.model.findAll({
        where: whereCondition,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'success' THEN 1 ELSE 0 END")), 'success'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")), 'pending'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'retrying' THEN 1 ELSE 0 END")), 'retrying'],
          [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration'],
          [sequelize.fn('MAX', sequelize.col('duration')), 'maxDuration'],
          [sequelize.fn('MIN', sequelize.col('duration')), 'minDuration'],
        ],
        raw: true,
      });

      if (!result || result.length === 0 || !result[0].total) {
        return {
          total: 0,
          success: 0,
          failed: 0,
          pending: 0,
          retrying: 0,
          successRate: '0.00',
          avgDuration: 0,
          maxDuration: 0,
          minDuration: 0,
        };
      }

      const stats = result[0];
      stats.total = parseInt(stats.total) || 0;
      stats.success = parseInt(stats.success) || 0;
      stats.failed = parseInt(stats.failed) || 0;
      stats.pending = parseInt(stats.pending) || 0;
      stats.retrying = parseInt(stats.retrying) || 0;
      stats.successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : '0.00';
      stats.avgDuration = stats.avgDuration ? Math.round(stats.avgDuration) : 0;
      stats.maxDuration = stats.maxDuration || 0;
      stats.minDuration = stats.minDuration || 0;

      return stats;
    } catch (error) {
      this._handleError(error, 'getWebhookStats', { webhookId, dateRange });
      return {
        total: 0,
        success: 0,
        failed: 0,
        pending: 0,
        retrying: 0,
        successRate: '0.00',
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
      };
    }
  }

  /**
   * 获取事件的统计信息
   * @param {String} event 事件名称
   * @param {Object} dateRange 日期范围 { start, end }
   * @return {Promise<Object>} 统计信息
   */
  async getEventStats(event, dateRange = null) {
    await this._ensureConnection();

    try {
      const whereCondition = { event };

      if (dateRange) {
        whereCondition.createdAt = {};
        if (dateRange.start) {
          whereCondition.createdAt[this.Op.gte] = new Date(dateRange.start);
        }
        if (dateRange.end) {
          whereCondition.createdAt[this.Op.lte] = new Date(dateRange.end);
        }
      }

      const sequelize = this.connection.getSequelize();

      const result = await this.model.findAll({
        where: whereCondition,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'success' THEN 1 ELSE 0 END")), 'success'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
        ],
        raw: true,
      });

      if (!result || result.length === 0 || !result[0].total) {
        return {
          total: 0,
          success: 0,
          failed: 0,
          successRate: '0.00',
        };
      }

      const stats = result[0];
      stats.total = parseInt(stats.total) || 0;
      stats.success = parseInt(stats.success) || 0;
      stats.failed = parseInt(stats.failed) || 0;
      stats.successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : '0.00';

      return stats;
    } catch (error) {
      this._handleError(error, 'getEventStats', { event, dateRange });
      return {
        total: 0,
        success: 0,
        failed: 0,
        successRate: '0.00',
      };
    }
  }

  /**
   * 清理旧日志
   * @param {Number} daysToKeep 保留天数
   * @return {Promise<Object>} 删除结果
   */
  async cleanupOldLogs(daysToKeep = 90) {
    await this._ensureConnection();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.model.destroy({
        where: {
          createdAt: { [this.Op.lt]: cutoffDate },
        },
      });

      return {
        deletedCount: result,
        cutoffDate,
      };
    } catch (error) {
      this._handleError(error, 'cleanupOldLogs', { daysToKeep });
    }
  }
}

module.exports = WebhookLogMariaRepository;
