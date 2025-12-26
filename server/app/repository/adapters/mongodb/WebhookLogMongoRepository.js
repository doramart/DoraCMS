/**
 * WebhookLog MongoDB Repository
 * 基于标准化的 Repository 模式
 * 继承 BaseMongoRepository，实现 WebhookLog 特有的业务逻辑
 */
'use strict';

const BaseMongoRepository = require('../../base/BaseMongoRepository');

class WebhookLogMongoRepository extends BaseMongoRepository {
  constructor(ctx) {
    super(ctx, 'WebhookLog');

    // 设置 MongoDB 模型
    this.model = this.app.model.WebhookLog;

    // 注册模型和关联关系
    this.registerModel({
      mongoModel: this.model,
      relations: {
        webhook: {
          model: this.app.model.Webhook,
          path: 'webhookId',
          select: ['name', 'url', 'userId'],
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
    return [{ path: 'webhookId', select: ['name', 'url', 'userId'] }];
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
   * 重写状态映射
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
   * 子类自定义的数据项处理 - WebhookLog 特有逻辑
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

    // 转换 headers Map 为普通对象
    if (item.request && item.request.headers && item.request.headers instanceof Map) {
      item.request.headers = Object.fromEntries(item.request.headers);
    }

    if (item.response && item.response.headers && item.response.headers instanceof Map) {
      item.response.headers = Object.fromEntries(item.response.headers);
    }

    // 添加虚拟字段
    item.isSuccess = item.status === 'success';
    item.isFailed = item.status === 'failed';
    item.needsRetry = item.status === 'retrying' && item.nextRetryAt && new Date() >= new Date(item.nextRetryAt);

    // 限制响应体大小（避免返回过大的数据）
    if (item.response && item.response.body && item.response.body.length > 1000 && !options.includeFullResponse) {
      item.response.bodyTruncated = true;
      item.response.body = item.response.body.substring(0, 1000) + '... (truncated)';
    }

    return this.transformer.transformIdFields(item, 'fromDatabase');
  }

  /**
   * 子类自定义的创建前数据处理 - WebhookLog 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForCreate(data) {
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

    // 转换 headers 对象为 Map
    if (data.request && data.request.headers && !(data.request.headers instanceof Map)) {
      data.request.headers = new Map(Object.entries(data.request.headers));
    }

    if (data.response && data.response.headers && !(data.response.headers instanceof Map)) {
      data.response.headers = new Map(Object.entries(data.response.headers));
    }

    return this.transformer.transformIdFields(data, 'toDatabase');
  }

  /**
   * 子类自定义的更新前数据处理 - WebhookLog 特有逻辑
   * @param {Object} data 预处理后的数据
   * @return {Object} 最终数据
   * @protected
   */
  _customPreprocessForUpdate(data) {
    // 转换 headers 对象为 Map
    if (data.request && data.request.headers && !(data.request.headers instanceof Map)) {
      data.request.headers = new Map(Object.entries(data.request.headers));
    }

    if (data.response && data.response.headers && !(data.response.headers instanceof Map)) {
      data.response.headers = new Map(Object.entries(data.response.headers));
    }

    return this.transformer.transformIdFields(data, 'toDatabase');
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
    const filters = { webhookId: { $eq: webhookId }, ...options.filters };
    return await this.find(payload, { ...options, filters });
  }

  /**
   * 根据事件查找日志
   * @param {String} event 事件名称
   * @param {Object} payload 查询参数
   * @param {Object} options 查询选项
   * @return {Promise<Object>} 查询结果
   */
  async findByEvent(event, payload = {}, options = {}) {
    const filters = { event: { $eq: event }, ...options.filters };
    return await this.find(payload, { ...options, filters });
  }

  /**
   * 查找需要重试的日志
   * @param {Number} limit 限制数量
   * @return {Promise<Array>} 日志列表
   */
  async findPendingRetries(limit = 100) {
    const now = new Date();
    const result = await this.model
      .find({
        status: 'retrying',
        nextRetryAt: { $lte: now },
      })
      .limit(limit)
      .populate(this._getDefaultPopulate())
      .lean();

    return result.map(item => this._customProcessDataItem(item));
  }

  /**
   * 更新日志状态为成功
   * @param {String} logId 日志ID
   * @param {Object} response 响应数据
   * @param {Number} duration 响应时间（毫秒）
   * @return {Promise<Object>} 更新后的日志
   */
  async markAsSuccess(logId, response, duration) {
    const updateData = {
      status: 'success',
      response: {
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        headers: response.headers instanceof Map ? response.headers : new Map(Object.entries(response.headers || {})),
        body: response.body ? response.body.substring(0, 10000) : '', // 限制大小
      },
      duration,
      completedAt: new Date(),
    };

    const updated = await this.model.findByIdAndUpdate(logId, { $set: updateData }, { new: true }).lean();

    return this._customProcessDataItem(updated);
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
        headers: response.headers instanceof Map ? response.headers : new Map(Object.entries(response.headers || {})),
        body: response.body ? response.body.substring(0, 10000) : '',
      };
    }

    const updated = await this.model.findByIdAndUpdate(logId, { $set: updateData }, { new: true }).lean();

    return this._customProcessDataItem(updated);
  }

  /**
   * 更新日志状态为重试中
   * @param {String} logId 日志ID
   * @param {Date} nextRetryAt 下次重试时间
   * @return {Promise<Object>} 更新后的日志
   */
  async markAsRetrying(logId, nextRetryAt) {
    const updateData = {
      status: 'retrying',
      nextRetryAt,
      $inc: { retryCount: 1 },
    };

    const updated = await this.model.findByIdAndUpdate(logId, updateData, { new: true }).lean();

    return this._customProcessDataItem(updated);
  }

  /**
   * 获取 Webhook 的统计信息
   * @param {String} webhookId Webhook ID
   * @param {Object} dateRange 日期范围 { start, end }
   * @return {Promise<Object>} 统计信息
   */
  async getWebhookStats(webhookId, dateRange = null) {
    const matchCondition = { webhookId };

    if (dateRange) {
      matchCondition.createdAt = {};
      if (dateRange.start) {
        matchCondition.createdAt.$gte = new Date(dateRange.start);
      }
      if (dateRange.end) {
        matchCondition.createdAt.$lte = new Date(dateRange.end);
      }
    }

    const result = await this.model.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          retrying: {
            $sum: { $cond: [{ $eq: ['$status', 'retrying'] }, 1, 0] },
          },
          avgDuration: { $avg: '$duration' },
          maxDuration: { $max: '$duration' },
          minDuration: { $min: '$duration' },
        },
      },
    ]);

    if (result.length === 0) {
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
    stats.successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : '0.00';
    stats.avgDuration = stats.avgDuration ? Math.round(stats.avgDuration) : 0;

    delete stats._id;
    return stats;
  }

  /**
   * 获取事件的统计信息
   * @param {String} event 事件名称
   * @param {Object} dateRange 日期范围 { start, end }
   * @return {Promise<Object>} 统计信息
   */
  async getEventStats(event, dateRange = null) {
    const matchCondition = { event };

    if (dateRange) {
      matchCondition.createdAt = {};
      if (dateRange.start) {
        matchCondition.createdAt.$gte = new Date(dateRange.start);
      }
      if (dateRange.end) {
        matchCondition.createdAt.$lte = new Date(dateRange.end);
      }
    }

    const result = await this.model.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        total: 0,
        success: 0,
        failed: 0,
        successRate: '0.00',
      };
    }

    const stats = result[0];
    stats.successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : '0.00';

    delete stats._id;
    return stats;
  }

  /**
   * 清理旧日志
   * @param {Number} daysToKeep 保留天数
   * @return {Promise<Object>} 删除结果
   */
  async cleanupOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.model.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return {
      deletedCount: result.deletedCount,
      cutoffDate,
    };
  }
}

module.exports = WebhookLogMongoRepository;
