/**
 * Webhook Service - 使用 Repository 模式
 * 负责 Webhook 的管理和事件触发
 */
'use strict';

const Service = require('egg').Service;
const RepositoryFactory = require('../repository/factories/RepositoryFactory');
const WebhookEvents = require('../constants/WebhookEvents');
const crypto = require('crypto');

class WebhookService extends Service {
  constructor(ctx) {
    super(ctx);

    // 初始化 Repository Factory
    this.repositoryFactory = new RepositoryFactory(this.app);

    // 获取 Webhook Repository
    this.repository = this.repositoryFactory.createWebhookRepository(ctx);
    this.logRepository = this.repositoryFactory.createWebhookLogRepository(ctx);
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
   * @param {Object} filters 查询条件
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
    return await this.repository.remove(ids, key);
  }

  /**
   * 软删除记录
   * @param {String|Array} ids 记录ID或ID数组
   * @param {Object} updateObj 更新对象
   * @return {Promise<Object>} 删除结果
   */
  async safeDelete(ids, updateObj = { status: 'deleted' }) {
    return await this.repository.safeDelete(ids, updateObj);
  }

  // ===== Webhook 特有的业务方法 =====

  /**
   * 创建新的 Webhook
   * @param {String} userId 用户ID
   * @param {Object} data Webhook 数据
   * @return {Promise<Object>} 创建的 Webhook
   */
  async createWebhook(userId, data) {
    // 验证名称唯一性
    if (data.name) {
      await this.repository.checkNameUnique(data.name, userId);
    }

    // 验证事件有效性
    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        if (!WebhookEvents.isValidEvent(event)) {
          throw this.repository.exceptions.webhook.invalidEvent(event);
        }
      }
    }

    const payload = {
      userId,
      name: data.name,
      url: data.url,
      events: data.events || [],
      description: data.description,
      headers: data.headers || {},
      retryConfig: data.retryConfig || { maxRetries: 3, retryDelay: 1000 },
      timeout: data.timeout || 10000,
      active: data.active !== undefined ? data.active : true,
    };

    // Repository 会自动生成 secret
    const result = await this.repository.create(payload);

    // 重新获取，包含完整的 secret（这是用户唯一能看到完整 secret 的机会）
    return await this.repository.findById(result.id, {
      includeSecret: true,
      populate: this.repository._getDefaultPopulate(),
    });
  }

  /**
   * 根据用户ID获取 Webhook 列表
   * @param {String} userId 用户ID
   * @param {Object} query 查询参数
   * @return {Promise<Object>} Webhook 列表
   */
  async list(userId, query = {}) {
    const { page = 1, pageSize = 10, active, searchkey } = query;
    const payload = {
      current: page,
      pageSize,
      searchkey,
      isPaging: '1',
    };

    const filters = { userId: { $eq: userId }, status: { $ne: 'deleted' } };

    // 添加状态过滤
    if (active !== undefined) {
      filters.active = { $eq: active === 'true' || active === true };
    }

    const options = {
      filters,
      sort: [{ field: 'createdAt', order: 'desc' }],
      populate: this.repository._getDefaultPopulate(),
    };

    return await this.repository.find(payload, options);
  }

  /**
   * 获取 Webhook 详情
   * @param {String} userId 用户ID
   * @param {String} id Webhook ID
   * @return {Promise<Object>} Webhook 详情
   */
  async detail(userId, id) {
    const webhook = await this.repository.findOne(
      { id, userId, status: { $ne: 'deleted' } },
      { populate: this.repository._getDefaultPopulate() }
    );

    if (!webhook) {
      throw this.repository.exceptions.webhook.notFound(id);
    }

    return webhook;
  }

  /**
   * 更新 Webhook
   * @param {String} userId 用户ID
   * @param {String} id Webhook ID
   * @param {Object} data 更新数据
   * @return {Promise<Object>} 更新后的 Webhook
   */
  async updateWebhook(userId, id, data) {
    // 验证 Webhook 存在且属于该用户
    const existingWebhook = await this.detail(userId, id);

    // 验证名称唯一性（如果更新了名称）
    if (data.name && data.name !== existingWebhook.name) {
      await this.repository.checkNameUnique(data.name, userId, id);
    }

    // 验证事件有效性
    if (data.events && Array.isArray(data.events)) {
      for (const event of data.events) {
        if (!WebhookEvents.isValidEvent(event)) {
          throw this.repository.exceptions.webhook.invalidEvent(event);
        }
      }
    }

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    return await this.repository.update(id, updateData);
  }

  /**
   * 删除 Webhook
   * @param {String} userId 用户ID
   * @param {String} id Webhook ID
   * @return {Promise<Object>} 删除结果
   */
  async deleteWebhook(userId, id) {
    // 验证 Webhook 存在且属于该用户
    await this.detail(userId, id);

    // 软删除
    return await this.repository.safeDelete(id, { status: 'deleted' });
  }

  /**
   * 启用 Webhook
   * @param {String} userId 用户ID
   * @param {String} id Webhook ID
   * @return {Promise<Object>} 更新后的 Webhook
   */
  async enable(userId, id) {
    // 验证 Webhook 存在且属于该用户
    await this.detail(userId, id);

    return await this.repository.update(id, {
      active: true,
      updatedAt: new Date(),
    });
  }

  /**
   * 禁用 Webhook
   * @param {String} userId 用户ID
   * @param {String} id Webhook ID
   * @return {Promise<Object>} 更新后的 Webhook
   */
  async disable(userId, id) {
    // 验证 Webhook 存在且属于该用户
    await this.detail(userId, id);

    return await this.repository.update(id, {
      active: false,
      updatedAt: new Date(),
    });
  }

  /**
   * 重新生成 Webhook Secret
   * @param {String} userId 用户ID
   * @param {String} id Webhook ID
   * @return {Promise<Object>} 更新后的 Webhook（包含新 secret）
   */
  async regenerateSecret(userId, id) {
    // 验证 Webhook 存在且属于该用户
    await this.detail(userId, id);

    return await this.repository.regenerateSecret(id);
  }

  /**
   * 获取用户的 Webhook 统计信息
   * @param {String} userId 用户ID
   * @return {Promise<Object>} 统计信息
   */
  async getUserWebhookStats(userId) {
    return await this.repository.getUserWebhookStats(userId);
  }

  /**
   * 批量更新 Webhook 状态
   * @param {String} userId 用户ID
   * @param {Array} webhookIds Webhook ID 数组
   * @param {Boolean} active 是否启用
   * @return {Promise<Object>} 更新结果
   */
  async batchUpdateActive(userId, webhookIds, active) {
    // 验证所有 Webhook 都属于该用户
    for (const id of webhookIds) {
      await this.detail(userId, id);
    }

    return await this.repository.batchUpdateActive(webhookIds, active);
  }

  // ===== 事件触发相关方法 =====

  /**
   * 触发 Webhook 事件
   * @param {String} event 事件名称
   * @param {Object} payload 事件负载
   * @return {Promise<void>}
   */
  async triggerEvent(event, payload) {
    try {
      // 验证事件是否有效
      if (!WebhookEvents.isValidEvent(event)) {
        this.ctx.logger.warn(`[Webhook] Invalid event: ${event}`);
        return;
      }

      // 查找订阅该事件的所有活跃 Webhook
      const webhooks = await this.repository.findByEvent(event);

      if (webhooks.length === 0) {
        this.ctx.logger.debug(`[Webhook] No active webhooks for event: ${event}`);
        return;
      }

      this.ctx.logger.info(`[Webhook] Triggering event ${event} for ${webhooks.length} webhooks`);

      // 为每个 Webhook 创建发送任务
      for (const webhook of webhooks) {
        try {
          await this._enqueueWebhook(webhook, event, payload);
        } catch (error) {
          this.ctx.logger.error(`[Webhook] Failed to enqueue webhook ${webhook.id}:`, error);
        }
      }
    } catch (error) {
      // 事件触发失败不应该影响业务逻辑
      this.ctx.logger.error(`[Webhook] Failed to trigger event ${event}:`, error);
    }
  }

  /**
   * 将 Webhook 发送任务加入队列
   * @param {Object} webhook Webhook 配置
   * @param {String} event 事件名称
   * @param {Object} payload 事件负载
   * @return {Promise<void>}
   * @private
   */
  async _enqueueWebhook(webhook, event, payload) {
    // 获取 Webhook 队列
    const queue = this.app.webhookQueue;

    if (!queue) {
      this.ctx.logger.error('[Webhook] Webhook queue not initialized');
      return;
    }

    // 准备发送数据
    const jobData = {
      webhookId: webhook.id,
      event,
      payload,
      url: webhook.url,
      secret: webhook.secret,
      headers: webhook.headers || {},
      timeout: webhook.timeout || 10000,
      retryConfig: webhook.retryConfig || { maxRetries: 3, retryDelay: 1000 },
    };

    // 添加到队列
    await queue.add('send-webhook', jobData, {
      attempts: jobData.retryConfig.maxRetries + 1, // Bull 的 attempts 包括首次尝试
      backoff: {
        type: 'exponential',
        delay: jobData.retryConfig.retryDelay,
      },
      removeOnComplete: true, // 完成后自动删除
      removeOnFail: false, // 失败后保留，便于调试
    });

    this.ctx.logger.debug(`[Webhook] Enqueued webhook ${webhook.id} for event ${event}`);
  }

  // ===== Webhook 日志相关方法 =====

  /**
   * 获取 Webhook 日志列表
   * @param {String} userId 用户ID
   * @param {String} webhookId Webhook ID
   * @param {Object} query 查询参数
   * @return {Promise<Object>} 日志列表
   */
  async getLogs(userId, webhookId, query = {}) {
    // 验证 Webhook 存在且属于该用户
    await this.detail(userId, webhookId);

    const { page = 1, pageSize = 20, status, event } = query;
    const payload = {
      current: page,
      pageSize,
      isPaging: '1',
    };

    const filters = { webhookId: { $eq: webhookId } };

    if (status) {
      filters.status = { $eq: status };
    }

    if (event) {
      filters.event = { $eq: event };
    }

    const options = {
      filters,
      sort: [{ field: 'createdAt', order: 'desc' }],
      populate: this.logRepository._getDefaultPopulate(),
    };

    return await this.logRepository.find(payload, options);
  }

  /**
   * 获取 Webhook 日志详情
   * @param {String} userId 用户ID
   * @param {String} webhookId Webhook ID
   * @param {String} logId 日志ID
   * @return {Promise<Object>} 日志详情
   */
  async getLogDetail(userId, webhookId, logId) {
    // 验证 Webhook 存在且属于该用户
    await this.detail(userId, webhookId);

    const log = await this.logRepository.findOne(
      { id: logId, webhookId },
      {
        populate: this.logRepository._getDefaultPopulate(),
        includeFullResponse: true,
      }
    );

    if (!log) {
      throw this.logRepository.exceptions.webhookLog.notFound(logId);
    }

    return log;
  }

  /**
   * 手动重试失败的 Webhook
   * @param {String} userId 用户ID
   * @param {String} webhookId Webhook ID
   * @param {String} logId 日志ID
   * @return {Promise<Object>} 重试结果
   */
  async retryWebhook(userId, webhookId, logId) {
    // 验证 Webhook 存在且属于该用户
    const webhook = await this.detail(userId, webhookId);

    // 获取日志
    const log = await this.getLogDetail(userId, webhookId, logId);

    // 验证日志状态
    if (log.status === 'success') {
      throw this.logRepository.exceptions.webhookLog.alreadyCompleted(logId);
    }

    // 重新加入队列
    await this._enqueueWebhook(
      {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        headers: webhook.headers,
        timeout: webhook.timeout,
        retryConfig: webhook.retryConfig,
      },
      log.event,
      log.payload
    );

    return { success: true, message: '已重新加入发送队列' };
  }

  /**
   * 获取 Webhook 统计信息
   * @param {String} userId 用户ID
   * @param {String} webhookId Webhook ID
   * @param {Object} dateRange 日期范围
   * @return {Promise<Object>} 统计信息
   */
  async getWebhookStats(userId, webhookId, dateRange = null) {
    // 验证 Webhook 存在且属于该用户
    await this.detail(userId, webhookId);

    return await this.logRepository.getWebhookStats(webhookId, dateRange);
  }

  /**
   * 获取所有支持的事件列表
   * @return {Object} 事件列表
   */
  getAllEvents() {
    return {
      events: WebhookEvents.getAllEvents(),
      categories: WebhookEvents.getCategories(),
    };
  }
}

module.exports = WebhookService;
