/**
 * 图片生成控制器
 * 负责处理图片生成相关的 HTTP 请求
 * 支持豆包等文生图模型
 *
 * @author DoraCMS Team
 * @date 2025-01-21
 */

'use strict';

const Controller = require('egg').Controller;

class ImageGenerationController extends Controller {
  /**
   * 生成图片
   * POST /api/ai/image/generate
   * POST /manage/ai/image/generate
   *
   * Body:
   * {
   *   "prompt": "图片描述",
   *   "modelId": "模型ID（可选）",
   *   "size": "1024x1024（可选）",
   *   "n": 1（可选，生成数量）,
   *   "responseFormat": "url（可选，url 或 b64_json）",
   *   "optimizePrompt": false（可选，是否优化提示词）,
   *   "language": "zh-CN（可选，zh-CN 或 en-US）",
   *   "extraParams": {}（可选）
   * }
   */
  async generateImage() {
    const { ctx } = this;

    try {
      const params = ctx.request.body;

      // 验证必填参数
      ctx.validate(
        {
          prompt: { type: 'string', required: true },
          modelId: { type: 'string', required: false },
          size: { type: 'string', required: false },
          n: { type: 'number', required: false },
          responseFormat: { type: 'string', required: false },
          optimizePrompt: { type: 'boolean', required: false },
          language: { type: 'string', required: false },
        },
        params
      );

      // 调用服务生成图片
      const result = await ctx.service.imageGenerationService.generateImage(params);

      ctx.helper.renderSuccess(ctx, {
        data: result.data,
        usage: result.usage,
        cost: result.cost,
      });
    } catch (error) {
      ctx.logger.error('[ImageGenerationController] generateImage failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '生成图片失败',
      });
    }
  }

  /**
   * 优化图片生成提示词
   * POST /api/ai/image/optimize-prompt
   * POST /manage/ai/image/optimize-prompt
   *
   * Body:
   * {
   *   "prompt": "简单描述",
   *   "language": "zh-CN（可选，zh-CN 或 en-US）"
   * }
   */
  async optimizePrompt() {
    const { ctx } = this;

    try {
      const params = ctx.request.body;

      // 验证必填参数
      ctx.validate(
        {
          prompt: { type: 'string', required: true },
          language: { type: 'string', required: false },
        },
        params
      );

      const { prompt, language = 'zh-CN' } = params;

      // 调用服务优化提示词
      const result = await ctx.service.imageGenerationService.optimizeImagePrompt(prompt, { language });

      if (result.success) {
        ctx.helper.renderSuccess(ctx, {
          data: {
            originalPrompt: result.originalPrompt,
            optimizedPrompt: result.optimizedPrompt,
            metadata: result.metadata,
          },
        });
      } else {
        ctx.helper.renderFail(ctx, {
          message: result.error || '优化提示词失败',
        });
      }
    } catch (error) {
      ctx.logger.error('[ImageGenerationController] optimizePrompt failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '优化提示词失败',
      });
    }
  }

  /**
   * 批量生成图片
   * POST /api/ai/image/batch-generate
   * POST /manage/ai/image/batch-generate
   *
   * Body:
   * {
   *   "prompts": [
   *     { "prompt": "描述1", "size": "1024x1024", "n": 1 },
   *     { "prompt": "描述2", "size": "2K", "n": 1 }
   *   ],
   *   "modelId": "模型ID（可选）"
   * }
   */
  async batchGenerateImages() {
    const { ctx } = this;

    try {
      const { prompts, modelId } = ctx.request.body;

      // 验证必填参数
      ctx.validate(
        {
          prompts: { type: 'array', required: true },
          modelId: { type: 'string', required: false },
        },
        { prompts, modelId }
      );

      if (!Array.isArray(prompts) || prompts.length === 0) {
        return ctx.helper.renderFail(ctx, {
          message: 'prompts 数组不能为空',
        });
      }

      // 调用服务批量生成图片
      const result = await ctx.service.imageGenerationService.batchGenerateImages(prompts, modelId);

      ctx.helper.renderSuccess(ctx, {
        data: result.data,
      });
    } catch (error) {
      ctx.logger.error('[ImageGenerationController] batchGenerateImages failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '批量生成图片失败',
      });
    }
  }

  /**
   * 获取支持图片生成的模型列表
   * GET /api/ai/image/models
   * GET /manage/ai/image/models
   */
  async getImageGenerationModels() {
    const { ctx } = this;

    try {
      const models = await ctx.service.imageGenerationService.getImageGenerationModels();

      ctx.helper.renderSuccess(ctx, {
        data: {
          models,
          count: models.length,
        },
      });
    } catch (error) {
      ctx.logger.error('[ImageGenerationController] getImageGenerationModels failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取图片生成模型列表失败',
      });
    }
  }

  /**
   * 获取模型支持的图片尺寸
   * GET /api/ai/image/sizes/:modelId
   * GET /manage/ai/image/sizes/:modelId
   */
  async getSupportedSizes() {
    const { ctx } = this;

    try {
      const { modelId } = ctx.params;

      if (!modelId) {
        return ctx.helper.renderFail(ctx, {
          message: '模型ID不能为空',
        });
      }

      const sizes = await ctx.service.imageGenerationService.getSupportedSizes(modelId);

      ctx.helper.renderSuccess(ctx, {
        data: {
          modelId,
          sizes,
        },
      });
    } catch (error) {
      ctx.logger.error('[ImageGenerationController] getSupportedSizes failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取支持的图片尺寸失败',
      });
    }
  }

  /**
   * 图片生成能力说明
   * GET /api/ai/image/capabilities
   */
  async getCapabilities() {
    const { ctx } = this;

    try {
      ctx.helper.renderSuccess(ctx, {
        data: {
          description: 'AI 图片生成服务，支持文生图功能',
          providers: [
            {
              name: 'doubao',
              displayName: '豆包（火山引擎）',
              models: [
                {
                  name: 'doubao-seedream-3-0-t2i-250415',
                  displayName: 'SeeDream 3.0',
                  supportedSizes: ['1024x1024', '1024x768', '768x1024', '1280x720', '720x1280'],
                  features: ['文生图', '多尺寸', '水印控制'],
                },
                {
                  name: 'doubao-seedream-4-0-250828',
                  displayName: 'SeeDream 4.0',
                  supportedSizes: ['1024x1024', '2K', '4K', '1280x720', '720x1280'],
                  features: ['文生图', '高分辨率', '2K/4K', '流式生成', '水印控制'],
                },
              ],
            },
          ],
          responseFormats: [
            {
              format: 'url',
              description: '返回图片 URL 地址',
            },
            {
              format: 'b64_json',
              description: '返回图片 Base64 编码',
            },
          ],
          limits: {
            maxImagesPerRequest: 10,
            maxPromptLength: 1000,
          },
        },
      });
    } catch (error) {
      ctx.logger.error('[ImageGenerationController] getCapabilities failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取能力说明失败',
      });
    }
  }

  /**
   * 获取图片生成示例
   * GET /api/ai/image/examples
   */
  async getExamples() {
    const { ctx } = this;

    try {
      ctx.helper.renderSuccess(ctx, {
        data: {
          examples: [
            {
              title: '基础文生图',
              prompt: '一只可爱的橘猫在阳光下打盹',
              params: {
                size: '1024x1024',
                n: 1,
              },
            },
            {
              title: '艺术风格图片',
              prompt: '星际穿越，黑洞，电影大片，超现实主义',
              params: {
                size: '2K',
                n: 1,
              },
            },
            {
              title: '建筑设计图',
              prompt: '现代简约风格别墅，落地窗，花园，建筑摄影',
              params: {
                size: '1280x720',
                n: 1,
              },
            },
            {
              title: '人物肖像',
              prompt: '年轻女性，微笑，专业摄影，自然光，高清',
              params: {
                size: '768x1024',
                n: 1,
              },
            },
          ],
          tips: [
            '提示词尽量详细具体，包含主体、风格、场景、光影等要素',
            '使用专业术语可以提高生成质量，如"oc渲染"、"光线追踪"等',
            '避免使用模糊或矛盾的描述',
            '可以参考摄影、绘画等艺术领域的表达方式',
          ],
        },
      });
    } catch (error) {
      ctx.logger.error('[ImageGenerationController] getExamples failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取示例失败',
      });
    }
  }
}

module.exports = ImageGenerationController;
