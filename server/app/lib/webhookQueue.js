/**
 * Webhook 队列处理器
 * 使用 Bull 队列处理 Webhook 发送任务
 */
'use strict';

const Bull = require('bull');
const axios = require('axios');
const crypto = require('crypto');

class WebhookQueue {
  constructor(app) {
    this.app = app;
    this.queue = null;
    this.isProcessing = false;
  }

  /**
   * 初始化队列
   */
  async init() {
    const config = this.app.config.webhook || {};
    const redisConfig = this.app.config.redis.client;

    // 创建 Bull 队列
    this.queue = new Bull('webhook-delivery', {
      redis: {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db || 0,
      },
      defaultJobOptions: {
        removeOnComplete: 100, // 保留最近 100 个成功的任务
        removeOnFail: 1000, // 保留最近 1000 个失败的任务
      },
    });

    // 设置队列处理器
    this.queue.process('send-webhook', config.concurrency || 5, async job => {
      return await this._processWebhook(job);
    });

    // 监听队列事件
    this._setupEventListeners();

    this.app.logger.info('[WebhookQueue] Webhook queue initialized');
  }

  /**
   * 处理 Webhook 发送任务
   * @param {Object} job Bull 任务对象
   * @return {Promise<Object>} 处理结果
   * @private
   */
  async _processWebhook(job) {
    const { webhookId, event, payload, url, secret, headers, timeout, retryConfig } = job.data;
    const startTime = Date.now();

    // 创建日志记录
    const logId = await this._createLog(webhookId, event, payload, url, headers);

    try {
      this.app.logger.info(`[WebhookQueue] Processing webhook ${webhookId} for event ${event}`);

      // 准备请求数据
      const requestBody = {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      // 生成签名
      const signature = this._generateSignature(requestBody, secret);

      // 准备请求头
      const requestHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'DoraCMS-Webhook/1.0',
        'X-Webhook-Event': event,
        'X-Webhook-Signature': signature,
        'X-Webhook-Delivery': logId,
        ...headers,
      };

      // 发送 HTTP 请求
      const response = await axios.post(url, requestBody, {
        headers: requestHeaders,
        timeout,
        validateStatus: status => status >= 200 && status < 300, // 只接受 2xx 状态码
      });

      const duration = Date.now() - startTime;

      // 更新日志为成功
      await this._updateLogSuccess(logId, response, duration);

      // 更新 Webhook 统计
      await this._updateWebhookStats(webhookId, 'success');

      this.app.logger.info(
        `[WebhookQueue] Webhook ${webhookId} delivered successfully in ${duration}ms (status: ${response.status})`
      );

      return {
        success: true,
        logId,
        statusCode: response.status,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // 判断是否需要重试
      const shouldRetry = this._shouldRetry(error, job.attemptsMade, retryConfig.maxRetries);

      if (shouldRetry) {
        // 更新日志为重试中
        const nextRetryAt = new Date(Date.now() + retryConfig.retryDelay * Math.pow(2, job.attemptsMade));
        await this._updateLogRetrying(logId, nextRetryAt);

        this.app.logger.warn(
          `[WebhookQueue] Webhook ${webhookId} failed, will retry (attempt ${job.attemptsMade}/${retryConfig.maxRetries})`
        );

        // 抛出错误让 Bull 自动重试
        throw error;
      } else {
        // 达到最大重试次数，标记为失败
        const response = error.response
          ? {
              statusCode: error.response.status,
              statusMessage: error.response.statusText,
              headers: error.response.headers,
              body: JSON.stringify(error.response.data),
            }
          : null;

        await this._updateLogFailed(logId, error, duration, response);

        // 更新 Webhook 统计
        await this._updateWebhookStats(webhookId, 'failed');

        this.app.logger.error(
          `[WebhookQueue] Webhook ${webhookId} failed permanently after ${job.attemptsMade} attempts:`,
          error.message
        );

        // 不再抛出错误，让任务标记为完成（虽然失败了）
        return {
          success: false,
          logId,
          error: error.message,
          duration,
        };
      }
    }
  }

  /**
   * 生成 HMAC-SHA256 签名
   * @param {Object} payload 负载数据
   * @param {String} secret 密钥
   * @return {String} 签名
   * @private
   */
  _generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return 'sha256=' + hmac.digest('hex');
  }

  /**
   * 判断是否应该重试
   * @param {Error} error 错误对象
   * @param {Number} attemptsMade 已尝试次数
   * @param {Number} maxRetries 最大重试次数
   * @return {Boolean} 是否应该重试
   * @private
   */
  _shouldRetry(error, attemptsMade, maxRetries) {
    // 已达到最大重试次数
    if (attemptsMade >= maxRetries) {
      return false;
    }

    // 网络错误应该重试
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }

    // 5xx 服务器错误应该重试
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // 429 Too Many Requests 应该重试
    if (error.response && error.response.status === 429) {
      return true;
    }

    // 408 Request Timeout 应该重试
    if (error.response && error.response.status === 408) {
      return true;
    }

    // 其他错误不重试（如 4xx 客户端错误）
    return false;
  }

  /**
   * 创建 Webhook 日志
   * @param {String} webhookId Webhook ID
   * @param {String} event 事件名称
   * @param {Object} payload 事件负载
   * @param {String} url 目标 URL
   * @param {Object} headers 请求头
   * @return {Promise<String>} 日志ID
   * @private
   */
  async _createLog(webhookId, event, payload, url, headers) {
    try {
      const ctx = this.app.createAnonymousContext();
      const logData = {
        webhookId,
        event,
        payload,
        request: {
          url,
          method: 'POST',
          headers,
          body: {
            event,
            timestamp: new Date().toISOString(),
            data: payload,
          },
        },
        status: 'pending',
        retryCount: 0,
      };

      const log = await ctx.service.webhook.logRepository.create(logData);
      return log.id;
    } catch (error) {
      this.app.logger.error('[WebhookQueue] Failed to create log:', error);
      throw error;
    }
  }

  /**
   * 更新日志为成功
   * @param {String} logId 日志ID
   * @param {Object} response 响应对象
   * @param {Number} duration 响应时间
   * @return {Promise<void>}
   * @private
   */
  async _updateLogSuccess(logId, response, duration) {
    try {
      const ctx = this.app.createAnonymousContext();
      await ctx.service.webhook.logRepository.markAsSuccess(
        logId,
        {
          statusCode: response.status,
          statusMessage: response.statusText,
          headers: response.headers,
          body: JSON.stringify(response.data),
        },
        duration
      );
    } catch (error) {
      this.app.logger.error('[WebhookQueue] Failed to update log as success:', error);
    }
  }

  /**
   * 更新日志为失败
   * @param {String} logId 日志ID
   * @param {Error} error 错误对象
   * @param {Number} duration 响应时间
   * @param {Object} response 响应对象（可选）
   * @return {Promise<void>}
   * @private
   */
  async _updateLogFailed(logId, error, duration, response) {
    try {
      const ctx = this.app.createAnonymousContext();
      await ctx.service.webhook.logRepository.markAsFailed(logId, error, duration, response);
    } catch (err) {
      this.app.logger.error('[WebhookQueue] Failed to update log as failed:', err);
    }
  }

  /**
   * 更新日志为重试中
   * @param {String} logId 日志ID
   * @param {Date} nextRetryAt 下次重试时间
   * @return {Promise<void>}
   * @private
   */
  async _updateLogRetrying(logId, nextRetryAt) {
    try {
      const ctx = this.app.createAnonymousContext();
      await ctx.service.webhook.logRepository.markAsRetrying(logId, nextRetryAt);
    } catch (error) {
      this.app.logger.error('[WebhookQueue] Failed to update log as retrying:', error);
    }
  }

  /**
   * 更新 Webhook 统计信息
   * @param {String} webhookId Webhook ID
   * @param {String} type 类型：success 或 failed
   * @return {Promise<void>}
   * @private
   */
  async _updateWebhookStats(webhookId, type) {
    try {
      const ctx = this.app.createAnonymousContext();
      await ctx.service.webhook.repository.incrementStats(webhookId, type);
    } catch (error) {
      this.app.logger.error('[WebhookQueue] Failed to update webhook stats:', error);
    }
  }

  /**
   * 设置队列事件监听器
   * @private
   */
  _setupEventListeners() {
    // 任务完成
    this.queue.on('completed', (job, result) => {
      this.app.logger.debug(`[WebhookQueue] Job ${job.id} completed:`, result);
    });

    // 任务失败
    this.queue.on('failed', (job, error) => {
      this.app.logger.error(`[WebhookQueue] Job ${job.id} failed:`, error.message);
    });

    // 任务停滞
    this.queue.on('stalled', job => {
      this.app.logger.warn(`[WebhookQueue] Job ${job.id} stalled`);
    });

    // 队列错误
    this.queue.on('error', error => {
      this.app.logger.error('[WebhookQueue] Queue error:', error);
    });
  }

  /**
   * 添加任务到队列
   * @param {String} name 任务名称
   * @param {Object} data 任务数据
   * @param {Object} options 任务选项
   * @return {Promise<Object>} 任务对象
   */
  async add(name, data, options = {}) {
    return await this.queue.add(name, data, options);
  }

  /**
   * 获取队列统计信息
   * @return {Promise<Object>} 统计信息
   */
  async getStats() {
    const counts = await this.queue.getJobCounts();
    return {
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed,
    };
  }

  /**
   * 清理队列
   * @param {Number} grace 保留时间（毫秒）
   * @return {Promise<void>}
   */
  async clean(grace = 0) {
    await this.queue.clean(grace, 'completed');
    await this.queue.clean(grace, 'failed');
    this.app.logger.info('[WebhookQueue] Queue cleaned');
  }

  /**
   * 关闭队列
   * @return {Promise<void>}
   */
  async close() {
    if (this.queue) {
      await this.queue.close();
      this.app.logger.info('[WebhookQueue] Webhook queue closed');
    }
  }
}

module.exports = WebhookQueue;
