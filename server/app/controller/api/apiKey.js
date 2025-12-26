const { Controller } = require('egg');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

/**
 * API Key 管理控制器
 * 用于管理用户的 API Key，支持创建、查询、更新、删除、启用、禁用、轮换等操作
 * @controller ApiKey
 */
class ApiKeyController extends Controller {
  /**
   * @summary 获取 API Key 列表
   * @description 分页查询当前用户的 API Key 列表，支持按状态过滤和关键词搜索
   * @router get /api/v1/user/api-keys
   * @request query integer page 页码（默认 1）
   * @request query integer pageSize 每页数量（默认 10）
   * @request query string searchkey 搜索关键词（可选）
   * @request query string status 状态过滤：active/disabled（可选）
   * @response 200 apiKeyListResponse API Key 列表
   * @response 401 errorResponse 未授权
   */
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

  /**
   * @summary 创建 API Key
   * @description 为当前用户创建新的 API Key，返回完整的 secret（仅此一次）
   * @router post /api/v1/user/api-keys
   * @request body apiKeyCreateRequest *请求体
   * @response 200 apiKeyCreateResponse 创建成功（包含完整 secret）
   * @response 400 errorResponse 参数错误
   * @response 401 errorResponse 未授权
   */
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

  /**
   * @summary 获取 API Key 详情
   * @description 查询指定 API Key 的详细信息（secret 已脱敏）
   * @router get /api/v1/user/api-keys/{id}
   * @request path string *id API Key ID
   * @response 200 apiKeyDetailResponse API Key 详情
   * @response 401 errorResponse 未授权
   * @response 404 errorResponse API Key 不存在
   */
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

  /**
   * @summary 更新 API Key
   * @description 更新指定 API Key 的配置信息（名称、权限、IP 白名单、速率限制等）
   * @router put /api/v1/user/api-keys/{id}
   * @request path string *id API Key ID
   * @request body apiKeyUpdateRequest *请求体
   * @response 200 apiKeyDetailResponse 更新成功
   * @response 400 errorResponse 参数错误
   * @response 401 errorResponse 未授权
   * @response 404 errorResponse API Key 不存在
   */
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

  /**
   * @summary 删除 API Key
   * @description 删除指定的 API Key（支持单个或批量删除）
   * @router delete /api/v1/user/api-keys/{id}
   * @request path string *id API Key ID（多个 ID 用逗号分隔）
   * @response 200 successResponse 删除成功
   * @response 401 errorResponse 未授权
   * @response 404 errorResponse API Key 不存在
   */
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

  /**
   * @summary 禁用 API Key
   * @description 禁用指定的 API Key，禁用后无法用于认证
   * @router put /api/v1/user/api-keys/{id}/disable
   * @request path string *id API Key ID
   * @response 200 apiKeyDetailResponse 禁用成功
   * @response 401 errorResponse 未授权
   * @response 404 errorResponse API Key 不存在
   */
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

  /**
   * @summary 启用 API Key
   * @description 启用指定的 API Key，启用后可用于认证
   * @router put /api/v1/user/api-keys/{id}/enable
   * @request path string *id API Key ID
   * @response 200 apiKeyDetailResponse 启用成功
   * @response 401 errorResponse 未授权
   * @response 404 errorResponse API Key 不存在
   */
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

  /**
   * @summary 轮换 API Key
   * @description 重新生成指定 API Key 的 secret，返回新的完整 secret（仅此一次）
   * @router post /api/v1/user/api-keys/{id}/rotate
   * @request path string *id API Key ID
   * @response 200 apiKeyCreateResponse 轮换成功（包含新的完整 secret）
   * @response 401 errorResponse 未授权
   * @response 404 errorResponse API Key 不存在
   */
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

  /**
   * @summary 获取 API Key 统计信息
   * @description 获取当前用户的 API Key 统计数据（总数、活跃数、禁用数、过期数）
   * @router get /api/v1/user/api-keys/stats
   * @response 200 apiKeyStatsResponse 统计信息
   * @response 401 errorResponse 未授权
   */
  async stats() {
    const { ctx } = this;
    const userId = ctx.requireCurrentUserId();

    if (!userId) {
      throw RepositoryExceptions.auth.sessionExpired();
    }

    const stats = await ctx.service.apiKey.getUserApiKeyStats(userId);

    ctx.helper.renderSuccess(ctx, { data: stats });
  }

  /**
   * @summary 清理过期的 API Key
   * @description 删除当前用户所有已过期的 API Key
   * @router post /api/v1/user/api-keys/cleanup
   * @response 200 apiKeyCleanupResponse 清理成功
   * @response 401 errorResponse 未授权
   */
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
