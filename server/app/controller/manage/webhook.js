'use strict';

/**
 * Webhook Controller - 2024统一异常处理优化版
 * 🔥 基于最佳实践的 Webhook 管理接口
 * ✅ 移除Controller层try-catch，交给全局错误中间件处理
 * ✅ 使用语义化异常，专注业务逻辑
 * ✅ 统一错误响应格式
 */

const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const WebhookController = {
  /**
   * 🔥 获取 Webhook 列表
   * @param ctx
   * @description GET /manage/v1/webhooks
   */
  async list(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const query = ctx.query;

    const result = await ctx.service.webhook.list(userId, query);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },

  /**
   * 🔥 获取 Webhook 详情
   * @param ctx
   * @description GET /manage/v1/webhooks/:id
   */
  async getOne(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const webhookId = ctx.params.id || ctx.query.id;

    if (!webhookId) {
      throw RepositoryExceptions.webhook.notFound(webhookId);
    }

    const result = await ctx.service.webhook.detail(userId, webhookId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },

  /**
   * 🔥 创建 Webhook
   * @param ctx
   * @description POST /manage/v1/webhooks
   */
  async create(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const fields = ctx.request.body || {};

    // 参数验证
    if (!fields.name) {
      throw RepositoryExceptions.webhook.nameRequired();
    }

    if (!fields.url) {
      throw RepositoryExceptions.webhook.urlRequired();
    }

    if (!fields.events || !Array.isArray(fields.events) || fields.events.length === 0) {
      throw RepositoryExceptions.webhook.eventsRequired();
    }

    const result = await ctx.service.webhook.createWebhook(userId, fields);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: 'Webhook 创建成功，请妥善保管 Secret',
    });
  },

  /**
   * 🔥 更新 Webhook
   * @param ctx
   * @description PUT /manage/v1/webhooks/:id
   */
  async update(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const webhookId = ctx.params.id || ctx.request.body.id;
    const fields = ctx.request.body || {};

    if (!webhookId) {
      throw RepositoryExceptions.webhook.notFound(webhookId);
    }

    // 参数验证
    if (fields.name !== undefined && !fields.name) {
      throw RepositoryExceptions.webhook.nameRequired();
    }

    if (fields.url !== undefined && !fields.url) {
      throw RepositoryExceptions.webhook.urlRequired();
    }

    if (fields.events !== undefined && (!Array.isArray(fields.events) || fields.events.length === 0)) {
      throw RepositoryExceptions.webhook.eventsRequired();
    }

    const result = await ctx.service.webhook.updateWebhook(userId, webhookId, fields);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: 'Webhook 更新成功',
    });
  },

  /**
   * 🔥 删除 Webhook
   * @param ctx
   * @description DELETE /manage/v1/webhooks/:id
   */
  async removes(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: 'Webhook',
    });

    // 批量删除
    const results = [];
    for (const id of idsArray) {
      const result = await ctx.service.webhook.deleteWebhook(userId, id);
      results.push(result);
    }

    ctx.helper.renderSuccess(ctx, {
      data: { deletedCount: results.length },
      message: `成功删除 ${results.length} 个 Webhook`,
    });
  },

  /**
   * 🔥 启用 Webhook
   * @param ctx
   * @description PUT /manage/v1/webhooks/:id/enable
   */
  async enable(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const webhookId = ctx.params.id;

    if (!webhookId) {
      throw RepositoryExceptions.webhook.notFound(webhookId);
    }

    const result = await ctx.service.webhook.enable(userId, webhookId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: 'Webhook 已启用',
    });
  },

  /**
   * 🔥 禁用 Webhook
   * @param ctx
   * @description PUT /manage/v1/webhooks/:id/disable
   */
  async disable(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const webhookId = ctx.params.id;

    if (!webhookId) {
      throw RepositoryExceptions.webhook.notFound(webhookId);
    }

    const result = await ctx.service.webhook.disable(userId, webhookId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: 'Webhook 已禁用',
    });
  },

  /**
   * 🔥 重新生成 Webhook Secret
   * @param ctx
   * @description POST /manage/v1/webhooks/:id/regenerate-secret
   */
  async regenerateSecret(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const webhookId = ctx.params.id;

    if (!webhookId) {
      throw RepositoryExceptions.webhook.notFound(webhookId);
    }

    const result = await ctx.service.webhook.regenerateSecret(userId, webhookId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: 'Secret 已重新生成，请妥善保管',
    });
  },

  /**
   * 🔥 获取用户的 Webhook 统计信息
   * @param ctx
   * @description GET /manage/v1/webhooks/stats
   */
  async getStats(ctx) {
    const userId = ctx.session.adminUserInfo.id;

    const result = await ctx.service.webhook.getUserWebhookStats(userId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },

  /**
   * 🔥 批量更新 Webhook 状态
   * @param ctx
   * @description PUT /manage/v1/webhooks/batch/status
   */
  async batchUpdateStatus(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const { ids, active } = ctx.request.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw RepositoryExceptions.resource.notFound('Webhook IDs', ids);
    }

    if (active === undefined || typeof active !== 'boolean') {
      throw RepositoryExceptions.create.validation('active 参数必须是布尔值');
    }

    const result = await ctx.service.webhook.batchUpdateActive(userId, ids, active);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: `成功${active ? '启用' : '禁用'} ${ids.length} 个 Webhook`,
    });
  },

  /**
   * 🔥 获取所有支持的事件列表
   * @param ctx
   * @description GET /manage/v1/webhooks/events
   */
  async getEvents(ctx) {
    const result = ctx.service.webhook.getAllEvents();

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },

  // ===== Webhook 日志相关接口 =====

  /**
   * 🔥 获取 Webhook 日志列表
   * @param ctx
   * @description GET /manage/v1/webhooks/:id/logs
   */
  async getLogs(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const webhookId = ctx.params.id;
    const query = ctx.query;

    if (!webhookId) {
      throw RepositoryExceptions.webhook.notFound(webhookId);
    }

    const result = await ctx.service.webhook.getLogs(userId, webhookId, query);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },

  /**
   * 🔥 获取 Webhook 日志详情
   * @param ctx
   * @description GET /manage/v1/webhooks/:id/logs/:logId
   */
  async getLogDetail(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const webhookId = ctx.params.id;
    const logId = ctx.params.logId;

    if (!webhookId) {
      throw RepositoryExceptions.webhook.notFound(webhookId);
    }

    if (!logId) {
      throw RepositoryExceptions.webhookLog.notFound(logId);
    }

    const result = await ctx.service.webhook.getLogDetail(userId, webhookId, logId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },

  /**
   * 🔥 手动重试失败的 Webhook
   * @param ctx
   * @description POST /manage/v1/webhooks/:id/logs/:logId/retry
   */
  async retryWebhook(ctx) {
    const userId = ctx.session.adminUserInfo.id;
    const webhookId = ctx.params.id;
    const logId = ctx.params.logId;

    if (!webhookId) {
      throw RepositoryExceptions.webhook.notFound(webhookId);
    }

    if (!logId) {
      throw RepositoryExceptions.webhookLog.notFound(logId);
    }

    const result = await ctx.service.webhook.retryWebhook(userId, webhookId, logId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: 'Webhook 已重新加入发送队列',
    });
  },

  /**
   * 🔥 获取 Webhook 统计信息
   * @param ctx
   * @description GET /manage/v1/webhooks/:id/stats
   */
  async getWebhookStats(ctx) {
    const userId = ctx.session.adminUserInfo._id;
    const webhookId = ctx.params.id;
    const { startDate, endDate } = ctx.query;

    if (!webhookId) {
      throw RepositoryExceptions.webhook.notFound(webhookId);
    }

    const dateRange = {};
    if (startDate) {
      dateRange.start = new Date(startDate);
    }
    if (endDate) {
      dateRange.end = new Date(endDate);
    }

    const result = await ctx.service.webhook.getWebhookStats(
      userId,
      webhookId,
      Object.keys(dateRange).length > 0 ? dateRange : null
    );

    ctx.helper.renderSuccess(ctx, {
      data: result,
    });
  },
};

module.exports = WebhookController;
