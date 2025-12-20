/**
 * AI 助手插件路由配置
 * 所有 AI 相关的管理接口
 *
 * @author DoraCMS Team
 * @date 2025-01-10
 */

'use strict';

module.exports = app => {
  const { router } = app;
  const prefix = '/manage';

  // 获取插件目录的 controller（插件 controller 需要手动加载）
  const AIConfigController = require('../../controller/aiConfig');
  const AIContentController = require('../../controller/aiContent');
  const ContentPublishController = require('../../controller/contentPublish');
  const ImageGenerationController = require('../../controller/imageGeneration');

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
   * GET /manage/ai/models?page=1&pageSize=20&provider=openai&isEnabled=true
   */
  router.get(`${prefix}/ai/models`, aiConfig.getModels);

  /**
   * 获取单个模型配置
   * GET /manage/ai/models/:id
   */
  router.get(`${prefix}/ai/models/:id`, aiConfig.getModel);

  /**
   * 创建模型配置
   * POST /manage/ai/models
   */
  router.post(`${prefix}/ai/models`, aiConfig.saveModel);

  /**
   * 更新模型配置
   * PUT /manage/ai/models/:id
   */
  router.put(`${prefix}/ai/models/:id`, aiConfig.saveModel);

  /**
   * 删除模型配置
   * DELETE /manage/ai/models/:id
   */
  router.delete(`${prefix}/ai/models/:id`, aiConfig.deleteModel);

  /**
   * 切换模型启用状态
   * PUT /manage/ai/models/:id/toggle
   */
  router.put(`${prefix}/ai/models/:id/toggle`, aiConfig.toggleModel);

  /**
   * 获取模型统计信息
   * GET /manage/ai/models/:id/stats
   */
  router.get(`${prefix}/ai/models/:id/stats`, aiConfig.getModelStats);

  /**
   * 批量删除模型配置
   * DELETE /manage/ai/models/batch
   */
  router.delete(`${prefix}/ai/models/batch`, aiConfig.batchDeleteModels);

  // ============================================================
  // AI 提供商管理
  // ============================================================

  /**
   * 获取可用的提供商列表
   * GET /manage/ai/providers
   */
  router.get(`${prefix}/ai/providers`, aiConfig.getProviders);

  // ============================================================
  // API Key 测试
  // ============================================================

  /**
   * 测试 API Key 是否有效
   * POST /manage/ai/test-api-key
   * Body: { provider, apiKey, apiEndpoint }
   */
  router.post(`${prefix}/ai/test-api-key`, aiConfig.testApiKey);

  // ============================================================
  // AI 内容生成 API
  // ============================================================

  /**
   * 生成文章标题
   * POST /manage/ai/content/generate-title
   */
  router.post(`${prefix}/ai/content/generate-title`, aiContent.generateTitle);

  /**
   * 生成文章摘要
   * POST /manage/ai/content/generate-summary
   */
  router.post(`${prefix}/ai/content/generate-summary`, aiContent.generateSummary);

  /**
   * 提取文章标签
   * POST /manage/ai/content/extract-tags
   */
  router.post(`${prefix}/ai/content/extract-tags`, aiContent.extractTags);

  /**
   * 提取 SEO 关键词
   * POST /manage/ai/content/extract-keywords
   */
  router.post(`${prefix}/ai/content/extract-keywords`, aiContent.extractKeywords);

  /**
   * 匹配文章分类
   * POST /manage/ai/content/match-category
   */
  router.post(`${prefix}/ai/content/match-category`, aiContent.matchCategory);

  /**
   * SEO 优化建议
   * POST /manage/ai/content/optimize-seo
   */
  router.post(`${prefix}/ai/content/optimize-seo`, aiContent.optimizeSEO);

  /**
   * 检查内容质量
   * POST /manage/ai/content/check-quality
   */
  router.post(`${prefix}/ai/content/check-quality`, aiContent.checkQuality);

  /**
   * 批量生成内容（标题、标签、摘要）
   * POST /manage/ai/content/generate-batch
   */
  router.post(`${prefix}/ai/content/generate-batch`, aiContent.generateBatch);

  /**
   * 清除 AI 内容缓存
   * DELETE /manage/ai/content/cache
   */
  router.delete(`${prefix}/ai/content/cache`, aiContent.clearCache);

  /**
   * 获取缓存统计信息
   * GET /manage/ai/content/cache/stats
   */
  router.get(`${prefix}/ai/content/cache/stats`, aiContent.getCacheStats);

  // ============================================================
  // 内容发布 API（AI 辅助）
  // ============================================================

  /**
   * AI 辅助发布内容
   * POST /manage/ai/content/publish
   */
  router.post(`${prefix}/ai/content/publish`, contentPublish.publishContent);

  /**
   * 批量 AI 增强发布
   * POST /manage/ai/content/batch-publish
   */
  router.post(`${prefix}/ai/content/batch-publish`, contentPublish.batchPublish);

  /**
   * 获取 AI 增强预览（不保存）
   * POST /manage/ai/content/preview
   */
  router.post(`${prefix}/ai/content/preview`, contentPublish.previewEnhancements);

  /**
   * 获取发布模式说明
   * GET /manage/ai/content/publish-modes
   */
  router.get(`${prefix}/ai/content/publish-modes`, contentPublish.getPublishModes);

  /**
   * 获取 AI 增强选项说明
   * GET /manage/ai/content/enhancement-options
   */
  router.get(`${prefix}/ai/content/enhancement-options`, contentPublish.getEnhancementOptions);

  // ============================================================
  // AI 图片生成 API（豆包文生图）
  // ============================================================

  /**
   * 生成图片
   * POST /manage/ai/image/generate
   * Body: { prompt, modelId?, size?, n?, responseFormat?, optimizePrompt?, language?, extraParams? }
   */
  router.post(`${prefix}/ai/image/generate`, imageGeneration.generateImage);

  /**
   * 优化图片生成提示词
   * POST /manage/ai/image/optimize-prompt
   * Body: { prompt, language? }
   */
  router.post(`${prefix}/ai/image/optimize-prompt`, imageGeneration.optimizePrompt);

  /**
   * 批量生成图片
   * POST /manage/ai/image/batch-generate
   * Body: { prompts: [...], modelId? }
   */
  router.post(`${prefix}/ai/image/batch-generate`, imageGeneration.batchGenerateImages);

  /**
   * 获取支持图片生成的模型列表
   * GET /manage/ai/image/models
   */
  router.get(`${prefix}/ai/image/models`, imageGeneration.getImageGenerationModels);

  /**
   * 获取模型支持的图片尺寸
   * GET /manage/ai/image/sizes/:modelId
   */
  router.get(`${prefix}/ai/image/sizes/:modelId`, imageGeneration.getSupportedSizes);

  /**
   * 获取图片生成能力说明
   * GET /manage/ai/image/capabilities
   */
  router.get(`${prefix}/ai/image/capabilities`, imageGeneration.getCapabilities);

  /**
   * 获取图片生成示例
   * GET /manage/ai/image/examples
   */
  router.get(`${prefix}/ai/image/examples`, imageGeneration.getExamples);
};
