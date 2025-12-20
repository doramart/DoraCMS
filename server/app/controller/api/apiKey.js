const { Controller } = require('egg');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

class ApiKeyController extends Controller {
  // List API Keys
  async list() {
    const { ctx } = this;
    const { page = 1, pageSize = 10, searchkey, status } = ctx.query;
    const userId = ctx.requireCurrentUserId();

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    // 🔥 标准化参数格式
    const payload = {
      current: Number(page),
      pageSize: Number(pageSize),
      searchkey,
      isPaging: '1',
    };

    const filters = { userId: { $eq: userId } };

    // 添加状态过滤
    if (status) {
      filters.status = { $eq: status };
    }

    const options = {
      filters,
      fields: [
        'id',
        'name',
        'key',
        'status',
        'expiresAt',
        'lastUsedAt',
        'createdAt',
        'permissions',
        'ipWhitelist',
        // 注意：不在列表中返回 secret，只返回 secretMasked（由 Repository 自动生成）
        // 'secret', // ❌ 不安全
      ],
      sort: [{ field: 'createdAt', order: 'desc' }],
      populate: [{ path: 'userId', select: ['userName', 'email'] }],
    };

    const result = await ctx.service.apiKey.find(payload, options);

    ctx.helper.renderSuccess(ctx, { data: result });
  }

  // Create API Key
  async create() {
    const { ctx } = this;
    const userId = ctx.requireCurrentUserId();
    const data = ctx.request.body;

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    // 🔥 业务验证 - Repository会自动抛出具体异常
    if (data.name) {
      await ctx.service.apiKey.checkNameUnique(data.name, userId);
    }

    // 🔥 创建时需要返回完整的 secret（这是用户唯一能看到完整 secret 的机会）
    const apiKey = await ctx.service.apiKey.createApiKey(userId, data);

    // 注意：createApiKey 应该已经包含完整的 secret，因为是新创建的
    ctx.helper.renderSuccess(ctx, { data: apiKey });
  }

  // Get API Key detail
  async detail() {
    const { ctx } = this;
    const { id } = ctx.params;
    const userId = ctx.requireCurrentUserId();

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const apiKey = await ctx.service.apiKey.detail(userId, id);

    ctx.helper.renderSuccess(ctx, { data: apiKey });
  }

  // Update API Key
  async update() {
    const { ctx } = this;
    const { id } = ctx.params;
    const userId = ctx.requireCurrentUserId();
    const data = ctx.request.body;

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const apiKey = await ctx.service.apiKey.updateApiKey(userId, id, data);

    ctx.helper.renderSuccess(ctx, { data: apiKey });
  }

  // Delete API Key
  async delete() {
    const { ctx } = this;
    const userId = ctx.requireCurrentUserId();

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    // 🔥 使用统一的参数处理工具
    const targetId = DeleteParamsHelper.extractTargetIds(ctx, 'API Key ID');

    await ctx.service.apiKey.deleteApiKey(userId, targetId);

    ctx.helper.renderSuccess(ctx, {});
  }

  // Disable API Key
  async disable() {
    const { ctx } = this;
    const { id } = ctx.params;
    const userId = ctx.requireCurrentUserId();

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const apiKey = await ctx.service.apiKey.disable(userId, id);

    ctx.helper.renderSuccess(ctx, { data: apiKey });
  }

  // Enable API Key
  async enable() {
    const { ctx } = this;
    const { id } = ctx.params;
    const userId = ctx.requireCurrentUserId();

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const apiKey = await ctx.service.apiKey.enable(userId, id);

    ctx.helper.renderSuccess(ctx, { data: apiKey });
  }

  // Rotate API Key
  async rotate() {
    const { ctx } = this;
    const { id } = ctx.params;
    const userId = ctx.requireCurrentUserId();

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const apiKey = await ctx.service.apiKey.rotate(userId, id);

    ctx.helper.renderSuccess(ctx, { data: apiKey });
  }

  // Get API Key Statistics
  async stats() {
    const { ctx } = this;
    const userId = ctx.requireCurrentUserId();

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const stats = await ctx.service.apiKey.getUserApiKeyStats(userId);

    ctx.helper.renderSuccess(ctx, { data: stats });
  }

  // Cleanup Expired API Keys
  async cleanup() {
    const { ctx } = this;
    const userId = ctx.requireCurrentUserId();

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const result = await ctx.service.apiKey.cleanupExpiredKeys(userId);

    ctx.helper.renderSuccess(ctx, { data: result });
  }
}

module.exports = ApiKeyController;
