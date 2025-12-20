/**
 * AI 配置管理控制器
 * 负责 AI 模型配置的 CRUD 操作
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

const Controller = require('egg').Controller;

class AIConfigController extends Controller {
  /**
   * 获取 AI 模型配置列表
   * GET /manage/ai/models
   */
  async getModels() {
    const { ctx } = this;

    try {
      const { page = 1, pageSize = 20, provider, isEnabled } = ctx.query;

      // 构建查询条件
      const filters = {};
      if (provider) {
        filters.provider = { $eq: provider };
      }
      // 只有当 isEnabled 是有效的布尔值字符串时才添加过滤条件
      // 空字符串表示"全部"，不添加过滤
      if (isEnabled === 'true' || isEnabled === 'false') {
        filters.isEnabled = { $eq: isEnabled === 'true' };
      }

      const result = await ctx.service.aiModelManager.getModelList({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        filters,
        maskApiKey: true, // 列表中掩码显示
      });

      ctx.helper.renderSuccess(ctx, {
        data: result,
      });
    } catch (error) {
      ctx.logger.error('[AIConfigController] getModels failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取模型列表失败',
      });
    }
  }

  /**
   * 获取单个模型配置
   * GET /manage/ai/models/:id
   */
  async getModel() {
    const { ctx } = this;

    try {
      const { id } = ctx.params;

      const model = await ctx.service.aiModelManager.getModelConfig(id, true);

      ctx.helper.renderSuccess(ctx, {
        data: model,
      });
    } catch (error) {
      ctx.logger.error('[AIConfigController] getModel failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取模型配置失败',
      });
    }
  }

  /**
   * 创建或更新模型配置
   * POST /manage/ai/models
   * PUT /manage/ai/models/:id
   */
  async saveModel() {
    const { ctx } = this;

    try {
      const data = ctx.request.body;
      const { id } = ctx.params;
      const incomingConfig = data.config || {};
      const apiKeyProvidedInRequest = Object.prototype.hasOwnProperty.call(incomingConfig, 'apiKey');

      // 如果是更新，添加 id
      if (id) {
        data.id = id;

        // 拉取原始模型配置（包含真实 apiKey），避免未传 apiKey 时被覆盖为空
        const existing = await ctx.service.aiModelManager.getModelConfig(id, false);
        const existingConfig = existing?.config || {};
        data.config = {
          ...existingConfig,
          ...incomingConfig,
        };

        // 如果请求未提供有效 apiKey，则回退为已有的 apiKey，避免被空值覆盖
        if (apiKeyProvidedInRequest && !incomingConfig.apiKey && existingConfig.apiKey) {
          data.config.apiKey = existingConfig.apiKey;
        }
      }

      const hasIncomingApiKey = apiKeyProvidedInRequest && incomingConfig.apiKey;

      // 验证必填字段
      ctx.validate(
        {
          provider: { type: 'string', required: true },
          modelName: { type: 'string', required: true },
          displayName: { type: 'string', required: true },
        },
        data
      );

      // API Key 验证（仅在请求中显式提供 apiKey 时）
      if (hasIncomingApiKey) {
        // 验证 config 对象中的 apiKey（不使用点号路径，直接验证嵌套对象）
        ctx.validate(
          {
            apiKey: { type: 'string', required: true, min: 10 },
          },
          data.config
        );

        // 测试 API Key 是否有效（可选，根据配置决定）
        if (ctx.app.config.aiAssistant.testApiKeyOnSave) {
          const isValid = await ctx.service.aiModelManager.testApiKey(data.provider, data.config.apiKey);

          if (!isValid) {
            ctx.helper.renderFail(ctx, {
              message: 'API Key 无效或无权限',
            });
            return;
          }
        }
      }

      const result = await ctx.service.aiModelManager.saveModelConfig(data);

      // 记录操作日志
      this._recordAuditLog(ctx, {
        action: id ? 'update' : 'create',
        content: `${id ? '更新' : '创建'} AI 模型配置: ${data.displayName}`,
        modelId: result.id || result._id,
      });

      ctx.helper.renderSuccess(ctx, {
        data: result,
        message: `${id ? '更新' : '创建'}成功`,
      });
    } catch (error) {
      ctx.logger.error('[AIConfigController] saveModel failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '保存模型配置失败',
      });
    }
  }

  /**
   * 删除模型配置
   * DELETE /manage/ai/models/:id
   */
  async deleteModel() {
    const { ctx } = this;

    try {
      const { id } = ctx.params;

      // 先获取模型信息（用于日志）
      const model = await ctx.service.aiModelManager.getModelConfig(id, true);

      await ctx.service.aiModelManager.deleteModel(id);

      // 记录操作日志
      this._recordAuditLog(ctx, {
        action: 'delete',
        content: `删除 AI 模型配置: ${model.displayName}`,
        modelId: id,
      });

      ctx.helper.renderSuccess(ctx, {
        message: '删除成功',
      });
    } catch (error) {
      ctx.logger.error('[AIConfigController] deleteModel failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '删除模型配置失败',
      });
    }
  }

  /**
   * 测试 API Key
   * POST /manage/ai/test-api-key
   *
   * 支持两种方式：
   * 1. 传递 modelId - 从数据库获取真实的 API Key 进行测试（列表页使用）
   * 2. 传递 provider + apiKey + apiEndpoint - 直接测试指定的配置（编辑对话框使用）
   */
  async testApiKey() {
    const { ctx } = this;

    try {
      const { modelId, provider, apiKey, apiEndpoint } = ctx.request.body;

      let testProvider, testApiKey, testApiEndpoint;

      // 方式 1: 通过模型 ID 测试（列表页使用）
      if (modelId) {
        // 使用 getActualConfig 获取真实的配置（包含明文 API Key）
        const model = await ctx.service.aiModelManager.getActualConfig(modelId);

        if (!model) {
          ctx.helper.renderFail(ctx, {
            message: '模型不存在',
          });
          return;
        }

        testProvider = model.provider;
        testApiKey = model.config?.apiKey; // 真实的 API Key（已解密）
        testApiEndpoint = model.config?.apiEndpoint;
      }
      // 方式 2: 直接传递配置测试（编辑对话框使用）
      else {
        // 验证必填字段
        ctx.validate({
          provider: { type: 'string', required: true },
        });

        testProvider = provider;
        testApiKey = apiKey;
        testApiEndpoint = apiEndpoint;
      }

      // Ollama 不需要 API Key
      if (testProvider !== 'ollama' && !testApiKey) {
        ctx.helper.renderFail(ctx, {
          message: 'API Key 不能为空',
        });
        return;
      }

      const isValid = await ctx.service.aiModelManager.testApiKey(testProvider, testApiKey, testApiEndpoint);

      ctx.helper.renderSuccess(ctx, {
        data: {
          valid: isValid,
          message: isValid ? 'API Key 有效' : 'API Key 无效或无权限',
        },
      });
    } catch (error) {
      ctx.logger.error('[AIConfigController] testApiKey failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || 'API Key 测试失败',
      });
    }
  }

  /**
   * 获取可用的提供商列表
   * GET /manage/ai/providers
   */
  async getProviders() {
    const { ctx } = this;

    try {
      const providers = [
        {
          id: 'openai',
          name: 'OpenAI',
          description: 'GPT-4, GPT-3.5-turbo 等模型',
          website: 'https://platform.openai.com',
          apiKeyUrl: 'https://platform.openai.com/api-keys',
          defaultEndpoint: 'https://api.openai.com/v1',
          models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          description: 'DeepSeek Chat 模型',
          website: 'https://www.deepseek.com',
          apiKeyUrl: 'https://platform.deepseek.com/api-keys',
          defaultEndpoint: 'https://api.deepseek.com',
          models: ['deepseek-chat', 'deepseek-coder'],
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          description: 'Claude-3 系列模型',
          website: 'https://www.anthropic.com',
          apiKeyUrl: 'https://console.anthropic.com/settings/keys',
          defaultEndpoint: 'https://api.anthropic.com',
          models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        },
        {
          id: 'ollama',
          name: 'Ollama',
          description: '本地部署的开源模型',
          website: 'https://ollama.ai',
          apiKeyUrl: null, // 本地部署不需要 API Key
          defaultEndpoint: 'http://localhost:11434',
          models: ['llama2', 'mistral', 'codellama', 'phi'],
        },
        {
          id: 'doubao',
          name: '豆包',
          description: '字节跳动豆包大模型，支持文本生成和图片生成',
          website: 'https://www.volcengine.com/product/doubao',
          apiKeyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
          defaultEndpoint: 'https://ark.cn-beijing.volces.com/api/v3',
          models: ['doubao-seedream-3-0-t2i-250415', 'doubao-seedream-4-0-250828'],
        },
      ];

      ctx.helper.renderSuccess(ctx, {
        data: providers,
      });
    } catch (error) {
      ctx.logger.error('[AIConfigController] getProviders failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取提供商列表失败',
      });
    }
  }

  /**
   * 切换模型启用状态
   * PUT /manage/ai/models/:id/toggle
   */
  async toggleModel() {
    const { ctx } = this;

    try {
      const { id } = ctx.params;
      const { isEnabled } = ctx.request.body;

      ctx.validate({
        isEnabled: { type: 'boolean', required: true },
      });

      const result = await ctx.service.aiModelManager.updateModel(id, {
        isEnabled,
      });

      // 记录操作日志
      this._recordAuditLog(ctx, {
        action: 'toggle',
        content: `${isEnabled ? '启用' : '禁用'} AI 模型: ${result.displayName}`,
        modelId: id,
      });

      ctx.helper.renderSuccess(ctx, {
        data: result,
        message: `${isEnabled ? '启用' : '禁用'}成功`,
      });
    } catch (error) {
      ctx.logger.error('[AIConfigController] toggleModel failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '操作失败',
      });
    }
  }

  /**
   * 获取模型统计信息
   * GET /manage/ai/models/:id/stats
   */
  async getModelStats() {
    const { ctx } = this;

    try {
      const { id } = ctx.params;
      const { startDate, endDate } = ctx.query;

      const stats = await ctx.service.aiModelManager.getModelStats(id, {
        startDate,
        endDate,
      });

      ctx.helper.renderSuccess(ctx, {
        data: stats,
      });
    } catch (error) {
      ctx.logger.error('[AIConfigController] getModelStats failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取统计信息失败',
      });
    }
  }

  /**
   * 批量删除模型配置
   * DELETE /manage/ai/models/batch
   */
  async batchDeleteModels() {
    const { ctx } = this;

    try {
      const { ids } = ctx.request.body;

      ctx.validate({
        ids: { type: 'array', required: true, itemType: 'string' },
      });

      const results = await Promise.all(ids.map(id => ctx.service.aiModelManager.deleteModel(id)));

      // 记录操作日志
      this._recordAuditLog(ctx, {
        action: 'batch_delete',
        content: `批量删除 ${ids.length} 个 AI 模型配置`,
        modelIds: ids,
      });

      ctx.helper.renderSuccess(ctx, {
        data: {
          deletedCount: results.filter(r => r).length,
        },
        message: '批量删除成功',
      });
    } catch (error) {
      ctx.logger.error('[AIConfigController] batchDeleteModels failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '批量删除失败',
      });
    }
  }

  /**
   * 记录审计日志
   * 如果 systemLog 服务存在则使用，否则只记录到应用日志
   * @param {Object} ctx - 上下文
   * @param {Object} options - 日志选项
   * @private
   */
  _recordAuditLog(ctx, options) {
    const { action, content, modelId, modelIds } = options;
    const userId = ctx.session.adminUserInfo?.id || ctx.session.adminUserInfo?._id || 'unknown';
    const userName = ctx.session.adminUserInfo?.userName || 'unknown';

    // 构建日志信息
    const logData = {
      type: 'ai_model_config',
      action,
      content,
      userId,
      userName,
      modelId,
      modelIds,
      ip: ctx.ip,
      userAgent: ctx.get('user-agent'),
      timestamp: new Date(),
    };

    // 记录到应用日志
    ctx.logger.info(`[AIConfigController] Audit: ${action} by ${userName}(${userId}) - ${content}`, logData);

    // 如果存在 systemLog 服务，记录到数据库
    if (ctx.service.systemLog && typeof ctx.service.systemLog.create === 'function') {
      // 异步记录，不影响主流程
      ctx.service.systemLog
        .create({
          type: 'ai_model_config',
          action,
          content,
          userId,
          metadata: {
            modelId,
            modelIds,
            ip: ctx.ip,
            userAgent: ctx.get('user-agent'),
          },
        })
        .catch(error => {
          ctx.logger.error('[AIConfigController] Failed to record audit log to database:', error);
        });
    }
  }
}

module.exports = AIConfigController;
