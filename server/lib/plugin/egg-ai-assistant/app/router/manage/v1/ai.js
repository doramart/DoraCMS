/**
 * AI 助手插件路由配置 (v1)
 * 所有 AI 相关的管理接口
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 * @version 1.0.0
 */

'use strict';

module.exports = app => {
  const { router } = app;
  const prefix = '/manage/v1/ai';

  // 获取插件目录的 controller（插件 controller 需要手动加载）
  const AIConfigController = require('../../../controller/aiConfig');
  const AIContentController = require('../../../controller/aiContent');
  const ContentPublishController = require('../../../controller/contentPublish');
  const ImageGenerationController = require('../../../controller/imageGeneration');

  // 创建 controller 代理，在请求时动态创建实例

  // AI 配置管理 Controller
  const aiConfig = {};
  const configMethods = [
    'getModels',
    'getModel',
    'saveModel',
    'deleteModel',
    'toggleModel',
    'getModelStats',
    'batchDeleteModels',
    'testApiKey',
    'getProviders',
  ];

  configMethods.forEach(method => {
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
    'clearCache',
    'getCacheStats',
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
  // AI 模型配置管理
  // ============================================================
  // 注意：所有 /manage 开头的路由会自动应用 authAdminToken 和 authAdminPower 中间件
  //      无需在路由上显式添加，避免重复验证

  /**
   * 获取模型列表（支持分页、过滤）
   * GET /manage/v1/ai/models?page=1&pageSize=20&provider=openai&isEnabled=true
   */
  router.get(`${prefix}/models`, aiConfig.getModels);

  /**
   * 获取单个模型配置
   * GET /manage/v1/ai/models/:id
   */
  router.get(`${prefix}/models/:id`, aiConfig.getModel);

  /**
   * 创建模型配置
   * POST /manage/v1/ai/models
   */
  router.post(`${prefix}/models`, aiConfig.saveModel);

  /**
   * 更新模型配置
   * PUT /manage/v1/ai/models/:id
   */
  router.put(`${prefix}/models/:id`, aiConfig.saveModel);

  /**
   * 删除模型配置
   * DELETE /manage/v1/ai/models/:id
   */
  router.delete(`${prefix}/models/:id`, aiConfig.deleteModel);

  /**
   * 切换模型启用状态
   * PUT /manage/v1/ai/models/:id/toggle
   */
  router.put(`${prefix}/models/:id/toggle`, aiConfig.toggleModel);

  /**
   * 获取模型统计信息
   * GET /manage/v1/ai/models/:id/stats
   */
  router.get(`${prefix}/models/:id/stats`, aiConfig.getModelStats);

  /**
   * 批量删除模型配置
   * DELETE /manage/v1/ai/models/batch
   */
  router.delete(`${prefix}/models/batch`, aiConfig.batchDeleteModels);

  // ============================================================
  // AI 提供商管理
  // ============================================================

  /**
   * 获取可用的提供商列表
   * GET /manage/v1/ai/providers
   */
  router.get(`${prefix}/providers`, aiConfig.getProviders);

  // ============================================================
  // API Key 测试
  // ============================================================

  /**
   * 测试 API Key 是否有效
   * POST /manage/v1/ai/test-api-key
   * Body: { provider, apiKey, apiEndpoint }
   */
  router.post(`${prefix}/test-api-key`, aiConfig.testApiKey);

  // ============================================================
  // AI 内容生成 API
  // ============================================================

  /**
   * 生成文章标题
   * POST /manage/v1/ai/content/generate-title
   */
  router.post(`${prefix}/content/generate-title`, aiContent.generateTitle);

  /**
   * 生成文章摘要
   * POST /manage/v1/ai/content/generate-summary
   */
  router.post(`${prefix}/content/generate-summary`, aiContent.generateSummary);

  /**
   * 提取文章标签
   * POST /manage/v1/ai/content/extract-tags
   */
  router.post(`${prefix}/content/extract-tags`, aiContent.extractTags);

  /**
   * 提取 SEO 关键词
   * POST /manage/v1/ai/content/extract-keywords
   */
  router.post(`${prefix}/content/extract-keywords`, aiContent.extractKeywords);

  /**
   * 匹配文章分类
   * POST /manage/v1/ai/content/match-category
   */
  router.post(`${prefix}/content/match-category`, aiContent.matchCategory);

  /**
   * SEO 优化建议
   * POST /manage/v1/ai/content/optimize-seo
   */
  router.post(`${prefix}/content/optimize-seo`, aiContent.optimizeSEO);

  /**
   * 检查内容质量
   * POST /manage/v1/ai/content/check-quality
   */
  router.post(`${prefix}/content/check-quality`, aiContent.checkQuality);

  /**
   * 批量生成内容（标题、标签、摘要）
   * POST /manage/v1/ai/content/generate-batch
   */
  router.post(`${prefix}/content/generate-batch`, aiContent.generateBatch);

  /**
   * 清除 AI 内容缓存
   * DELETE /manage/v1/ai/content/cache
   */
  router.delete(`${prefix}/content/cache`, aiContent.clearCache);

  /**
   * 获取缓存统计信息
   * GET /manage/v1/ai/content/cache/stats
   */
  router.get(`${prefix}/content/cache/stats`, aiContent.getCacheStats);

  // ============================================================
  // 内容发布 API（AI 辅助）
  // ============================================================

  /**
   * AI 辅助发布内容
   * POST /manage/v1/ai/content/publish
   */
  router.post(`${prefix}/content/publish`, contentPublish.publishContent);

  /**
   * 批量 AI 增强发布
   * POST /manage/v1/ai/content/batch-publish
   */
  router.post(`${prefix}/content/batch-publish`, contentPublish.batchPublish);

  /**
   * 获取 AI 增强预览（不保存）
   * POST /manage/v1/ai/content/preview
   */
  router.post(`${prefix}/content/preview`, contentPublish.previewEnhancements);

  /**
   * 获取发布模式说明
   * GET /manage/v1/ai/content/publish-modes
   */
  router.get(`${prefix}/content/publish-modes`, contentPublish.getPublishModes);

  /**
   * 获取 AI 增强选项说明
   * GET /manage/v1/ai/content/enhancement-options
   */
  router.get(`${prefix}/content/enhancement-options`, contentPublish.getEnhancementOptions);

  // ============================================================
  // AI 图片生成 API（豆包文生图）
  // ============================================================

  /**
   * 生成图片
   * POST /manage/v1/ai/image/generate
   * Body: { prompt, modelId?, size?, n?, responseFormat?, optimizePrompt?, language?, extraParams? }
   */
  router.post(`${prefix}/image/generate`, imageGeneration.generateImage);

  /**
   * 优化图片生成提示词
   * POST /manage/v1/ai/image/optimize-prompt
   * Body: { prompt, language? }
   */
  router.post(`${prefix}/image/optimize-prompt`, imageGeneration.optimizePrompt);

  /**
   * 批量生成图片
   * POST /manage/v1/ai/image/batch-generate
   * Body: { prompts: [...], modelId? }
   */
  router.post(`${prefix}/image/batch-generate`, imageGeneration.batchGenerateImages);

  /**
   * 获取支持图片生成的模型列表
   * GET /manage/v1/ai/image/models
   */
  router.get(`${prefix}/image/models`, imageGeneration.getImageGenerationModels);

  /**
   * 获取模型支持的图片尺寸
   * GET /manage/v1/ai/image/sizes/:modelId
   */
  router.get(`${prefix}/image/sizes/:modelId`, imageGeneration.getSupportedSizes);

  /**
   * 获取图片生成能力说明
   * GET /manage/v1/ai/image/capabilities
   */
  router.get(`${prefix}/image/capabilities`, imageGeneration.getCapabilities);

  /**
   * 获取图片生成示例
   * GET /manage/v1/ai/image/examples
   */
  router.get(`${prefix}/image/examples`, imageGeneration.getExamples);
};
