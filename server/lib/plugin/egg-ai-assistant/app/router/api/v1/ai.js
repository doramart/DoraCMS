/**
 * AI 助手插件 - API 路由配置 (v1)
 * 提供给普通用户的 AI 功能接口
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 * @version 1.0.0
 */

'use strict';

module.exports = app => {
  const { router } = app;
  const prefix = '/api/v1/ai';

  // 获取插件目录的 controller（插件 controller 需要手动加载）
  const AIConfigController = require('../../../controller/aiConfig');
  const AIContentController = require('../../../controller/aiContent');
  const ContentPublishController = require('../../../controller/contentPublish');
  const ImageGenerationController = require('../../../controller/imageGeneration');

  // 可选的 API Token 验证中间件（根据项目需要决定是否启用）
  const authApiToken = app.middleware.authApiToken ? app.middleware.authApiToken({}) : null;

  // 创建 controller 代理，在请求时动态创建实例

  // AI 配置管理 Controller（只读接口，供普通用户查询）
  const aiConfig = {};
  const readOnlyConfigMethods = [
    'getModels', // 获取模型列表（只读）
  ];

  readOnlyConfigMethods.forEach(method => {
    aiConfig[method] = async (ctx, next) => {
      const controller = new AIConfigController(ctx);
      await controller[method]();
    };
  });

  // AI 内容生成 Controller
  const aiContent = {};
  const contentMethods = [
    'generateTitle',
    'generateSummary',
    'extractTags',
    'extractKeywords',
    'matchCategory',
    'optimizeSEO',
    'checkQuality',
    'generateBatch',
    // 注意：clearCache 和 getCacheStats 仅供管理员使用，不暴露给普通用户
  ];

  contentMethods.forEach(method => {
    aiContent[method] = async (ctx, next) => {
      const controller = new AIContentController(ctx);
      await controller[method]();
    };
  });

  // 内容发布 Controller
  const contentPublish = {};
  const publishMethods = [
    'publishContent',
    'batchPublish',
    'previewEnhancements',
    'getPublishModes',
    'getEnhancementOptions',
  ];

  publishMethods.forEach(method => {
    contentPublish[method] = async (ctx, next) => {
      const controller = new ContentPublishController(ctx);
      await controller[method]();
    };
  });

  // 图片生成 Controller
  const imageGeneration = {};
  const imageGenerationMethods = [
    'generateImage',
    'optimizePrompt',
    'batchGenerateImages',
    'getImageGenerationModels',
    'getSupportedSizes',
    'getCapabilities',
    'getExamples',
  ];

  imageGenerationMethods.forEach(method => {
    imageGeneration[method] = async (ctx, next) => {
      const controller = new ImageGenerationController(ctx);
      await controller[method]();
    };
  });

  // ============================================================
  // AI 模型查询 API（只读，普通用户可查询可用模型）
  // ============================================================

  /**
   * 获取 AI 模型列表（只读）
   * GET /api/v1/ai/models?page=1&pageSize=20&isEnabled=true
   * 注意：普通用户只能查询已启用的模型，不能进行增删改操作
   */
  router.get(`${prefix}/models`, aiConfig.getModels);

  // ============================================================
  // AI 内容生成 API（普通用户可用）
  // ============================================================
  // 注意：这些接口根据业务需求可以选择性添加 authApiToken 中间件
  //      如果需要用户登录才能使用，在路由中添加 authApiToken

  /**
   * 生成文章标题
   * POST /api/v1/ai/content/generate-title
   * Body: { content: string, count?: number }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/generate-title`, authApiToken, aiContent.generateTitle);
  } else {
    router.post(`${prefix}/content/generate-title`, aiContent.generateTitle);
  }

  /**
   * 生成文章摘要
   * POST /api/v1/ai/content/generate-summary
   * Body: { content: string, maxLength?: number }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/generate-summary`, authApiToken, aiContent.generateSummary);
  } else {
    router.post(`${prefix}/content/generate-summary`, aiContent.generateSummary);
  }

  /**
   * 提取文章标签
   * POST /api/v1/ai/content/extract-tags
   * Body: { title?: string, content: string, count?: number }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/extract-tags`, authApiToken, aiContent.extractTags);
  } else {
    router.post(`${prefix}/content/extract-tags`, aiContent.extractTags);
  }

  /**
   * 提取 SEO 关键词
   * POST /api/v1/ai/content/extract-keywords
   * Body: { title?: string, content: string, count?: number }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/extract-keywords`, authApiToken, aiContent.extractKeywords);
  } else {
    router.post(`${prefix}/content/extract-keywords`, aiContent.extractKeywords);
  }

  /**
   * 匹配文章分类
   * POST /api/v1/ai/content/match-category
   * Body: { title: string, content: string, categories: Array }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/match-category`, authApiToken, aiContent.matchCategory);
  } else {
    router.post(`${prefix}/content/match-category`, aiContent.matchCategory);
  }

  /**
   * SEO 优化建议
   * POST /api/v1/ai/content/optimize-seo
   * Body: { title: string, content: string, keywords?: Array }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/optimize-seo`, authApiToken, aiContent.optimizeSEO);
  } else {
    router.post(`${prefix}/content/optimize-seo`, aiContent.optimizeSEO);
  }

  /**
   * 检查内容质量
   * POST /api/v1/ai/content/check-quality
   * Body: { title: string, content: string }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/check-quality`, authApiToken, aiContent.checkQuality);
  } else {
    router.post(`${prefix}/content/check-quality`, aiContent.checkQuality);
  }

  /**
   * 批量生成内容（标题、标签、摘要）
   * POST /api/v1/ai/content/generate-batch
   * Body: { content: string, options: { title?, summary?, tags?, keywords? } }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/generate-batch`, authApiToken, aiContent.generateBatch);
  } else {
    router.post(`${prefix}/content/generate-batch`, aiContent.generateBatch);
  }

  // ============================================================
  // 内容发布 API（AI 辅助，普通用户可用）
  // ============================================================

  /**
   * AI 辅助发布内容
   * POST /api/v1/ai/content/publish
   * Body: { content: object, mode: string, enhanceOptions?: object }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/publish`, authApiToken, contentPublish.publishContent);
  } else {
    router.post(`${prefix}/content/publish`, contentPublish.publishContent);
  }

  /**
   * 批量 AI 增强发布
   * POST /api/v1/ai/content/batch-publish
   * Body: { contents: Array, mode: string, enhanceOptions?: object }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/batch-publish`, authApiToken, contentPublish.batchPublish);
  } else {
    router.post(`${prefix}/content/batch-publish`, contentPublish.batchPublish);
  }

  /**
   * 获取 AI 增强预览（不保存）
   * POST /api/v1/ai/content/preview
   * Body: { content: object, enhanceOptions?: object }
   */
  if (authApiToken) {
    router.post(`${prefix}/content/preview`, authApiToken, contentPublish.previewEnhancements);
  } else {
    router.post(`${prefix}/content/preview`, contentPublish.previewEnhancements);
  }

  /**
   * 获取发布模式说明
   * GET /api/v1/ai/content/publish-modes
   */
  router.get(`${prefix}/content/publish-modes`, contentPublish.getPublishModes);

  /**
   * 获取 AI 增强选项说明
   * GET /api/v1/ai/content/enhancement-options
   */
  router.get(`${prefix}/content/enhancement-options`, contentPublish.getEnhancementOptions);

  // ============================================================
  // AI 图片生成 API（豆包文生图）
  // ============================================================

  /**
   * 生成图片
   * POST /api/v1/ai/image/generate
   * Body: { prompt, modelId?, size?, n?, responseFormat?, optimizePrompt?, language?, extraParams? }
   */
  if (authApiToken) {
    router.post(`${prefix}/image/generate`, authApiToken, imageGeneration.generateImage);
  } else {
    router.post(`${prefix}/image/generate`, imageGeneration.generateImage);
  }

  /**
   * 优化图片生成提示词
   * POST /api/v1/ai/image/optimize-prompt
   * Body: { prompt, language? }
   */
  if (authApiToken) {
    router.post(`${prefix}/image/optimize-prompt`, authApiToken, imageGeneration.optimizePrompt);
  } else {
    router.post(`${prefix}/image/optimize-prompt`, imageGeneration.optimizePrompt);
  }

  /**
   * 批量生成图片
   * POST /api/v1/ai/image/batch-generate
   * Body: { prompts: [...], modelId? }
   */
  if (authApiToken) {
    router.post(`${prefix}/image/batch-generate`, authApiToken, imageGeneration.batchGenerateImages);
  } else {
    router.post(`${prefix}/image/batch-generate`, imageGeneration.batchGenerateImages);
  }

  /**
   * 获取支持图片生成的模型列表
   * GET /api/v1/ai/image/models
   */
  router.get(`${prefix}/image/models`, imageGeneration.getImageGenerationModels);

  /**
   * 获取模型支持的图片尺寸
   * GET /api/v1/ai/image/sizes/:modelId
   */
  router.get(`${prefix}/image/sizes/:modelId`, imageGeneration.getSupportedSizes);

  /**
   * 获取图片生成能力说明
   * GET /api/v1/ai/image/capabilities
   */
  router.get(`${prefix}/image/capabilities`, imageGeneration.getCapabilities);

  /**
   * 获取图片生成示例
   * GET /api/v1/ai/image/examples
   */
  router.get(`${prefix}/image/examples`, imageGeneration.getExamples);

  // ============================================================
  // AI 服务状态和统计 API（可选）
  // ============================================================
  // 注意：这些接口目前在子应用中已导入但可能未实际使用
  //      controller 中可能还未实现这些方法，需要根据实际需求添加

  /**
   * 检查 AI 服务状态
   * GET /api/v1/ai/status
   * 返回：{ status: 'ok'|'error', message: string, models: { available: number, enabled: number } }
   */
  // router.get(`${prefix}/status`, async (ctx) => {
  //   // TODO: 实现 AI 服务状态检查逻辑
  //   ctx.body = {
  //     status: 200,
  //     data: {
  //       status: 'ok',
  //       message: 'AI service is running',
  //       timestamp: Date.now(),
  //     },
  //   };
  // });

  /**
   * 获取 AI 使用统计
   * GET /api/v1/ai/usage-stats
   * 返回：{ totalCalls: number, successRate: number, averageResponseTime: number }
   */
  // router.get(`${prefix}/usage-stats`, async (ctx) => {
  //   // TODO: 实现使用统计逻辑
  //   ctx.body = {
  //     status: 200,
  //     data: {
  //       totalCalls: 0,
  //       successRate: 0,
  //       averageResponseTime: 0,
  //     },
  //   };
  // });
};
