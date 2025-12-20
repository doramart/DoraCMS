/**
 * 内容发布控制器（AI 辅助）
 * 提供内容发布相关的 HTTP API
 * 支持 manual、ai_smart、ai_full 三种发布模式
 *
 * @author DoraCMS Team
 * @date 2025-01-12
 */

'use strict';

const Controller = require('egg').Controller;

class ContentPublishController extends Controller {
  /**
   * AI 辅助发布内容
   * POST /manage/ai/content/publish
   *
   * Body:
   * {
   *   "contentData": {
   *     "title": "文章标题",
   *     "comments": "文章内容",
   *     "discription": "文章摘要",
   *     "tags": ["标签ID1", "标签ID2"],
   *     "categories": "分类ID",
   *     ...其他字段
   *   },
   *   "publishMode": "ai_smart",  // manual | ai_smart | ai_full
   *   "options": {
   *     "regenerateTitle": false,
   *     "regenerateSummary": false,
   *     "regenerateTags": false,
   *     "autoCategory": false,
   *     "seoOptimize": false,
   *     "qualityCheck": false,
   *     "language": "zh-CN",
   *     "titleStyle": "engaging",
   *     "summaryMaxLength": 200,
   *     "tagsMaxCount": 5
   *   }
   * }
   */
  async publishContent() {
    const { ctx } = this;

    try {
      const { contentData, publishMode = 'manual', options = {} } = ctx.request.body;

      // 验证必填字段
      if (!contentData) {
        ctx.helper.renderFail(ctx, {
          message: '内容数据不能为空',
        });
        return;
      }

      // 基础内容验证
      if (!contentData.comments) {
        ctx.helper.renderFail(ctx, {
          message: '文章内容不能为空',
        });
        return;
      }

      // 调用 ContentPublishService
      const result = await ctx.service.contentPublishService.publishContent(contentData, publishMode, options);

      if (!result.success) {
        ctx.helper.renderFail(ctx, {
          message: result.error || '内容发布失败',
        });
        return;
      }

      // 🔥 优化：智能检测调用来源，区分前台用户和后台管理员
      const authorInfo = this._detectAuthorInfo(ctx);

      // 🔥 服务端强制控制：普通用户发布的内容必须待审核
      if (authorInfo.type === 'user') {
        result.content.state = '1'; // 强制设置为待审核状态
        ctx.logger.info('[ContentPublishController] User content auto set to pending review state');
      }

      // 保存到数据库（使用带预处理的创建方法）
      let savedContent = null;
      if (ctx.service.content) {
        try {
          // 检查 session 中是否有作者信息
          if (!authorInfo.hasAuthor) {
            ctx.logger.warn('[ContentPublishController] No author info in session, skipping save');
          } else {
            // 🔥 根据调用来源传递不同的作者参数
            savedContent = await ctx.service.content.createWithPreprocessing(result.content, {
              author: authorInfo.adminId, // 后台管理员 ID
              uAuthor: authorInfo.userId, // 前台用户 ID
              authorType: authorInfo.type, // 'admin' | 'user'
              ctx,
            });

            // 更新返回数据，包含数据库生成的 ID
            result.content.id = savedContent.id || savedContent._id;

            ctx.logger.info(
              `[ContentPublishController] Content saved successfully by ${authorInfo.type}:`,
              savedContent.id
            );
          }
        } catch (error) {
          ctx.logger.error('[ContentPublishController] Failed to save content:', error);
          // 不影响 AI 增强结果的返回，但记录错误
          result.saveError = error.message;
        }
      }

      ctx.helper.renderSuccess(ctx, {
        data: {
          content: result.content,
          savedContent: savedContent ? { id: savedContent.id } : null,
          aiEnhancements: result.aiEnhancements,
          mode: result.mode,
        },
        message: savedContent ? '内容发布并保存成功' : '内容发布成功（未保存到数据库）',
      });
    } catch (error) {
      ctx.logger.error('[ContentPublishController] publishContent failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '内容发布失败',
      });
    }
  }

  /**
   * 🔥 新增：智能检测作者信息
   * 根据调用路径和 session 信息判断是前台用户还是后台管理员
   *
   * @param {Context} ctx 上下文
   * @return {Object} 作者信息
   * @return {Boolean} return.hasAuthor 是否有作者信息
   * @return {String} return.type 作者类型：'admin' | 'user' | null
   * @return {String} return.adminId 管理员 ID（如果是后台调用）
   * @return {String} return.userId 用户 ID（如果是前台调用）
   * @private
   */
  _detectAuthorInfo(ctx) {
    const path = ctx.path || '';

    // 方式1：通过路径判断（优先级最高）
    const isManageRoute = path.startsWith('/manage/');
    const isApiRoute = path.startsWith('/api/');

    // 方式2：通过 session 判断
    const hasAdmin = ctx.session.adminUserInfo && ctx.session.adminUserInfo.id;
    const hasUser = ctx.session.user && ctx.session.user.id;

    ctx.logger.debug('[ContentPublishController] Detecting author info:', {
      path,
      isManageRoute,
      isApiRoute,
      hasAdmin,
      hasUser,
    });

    // 🔥 优先级判断逻辑
    // 1. 如果是后台管理路由 (/manage/)，使用管理员信息
    if (isManageRoute && hasAdmin) {
      return {
        hasAuthor: true,
        type: 'admin',
        adminId: ctx.session.adminUserInfo.id,
        userId: null,
      };
    }

    // 2. 如果是前台 API 路由 (/api/)，使用用户信息
    if (isApiRoute && hasUser) {
      return {
        hasAuthor: true,
        type: 'user',
        adminId: null,
        userId: ctx.session.user.id,
      };
    }

    // 3. 兜底：根据 session 判断（支持自定义路由）
    if (hasAdmin) {
      return {
        hasAuthor: true,
        type: 'admin',
        adminId: ctx.session.adminUserInfo.id,
        userId: null,
      };
    }

    if (hasUser) {
      return {
        hasAuthor: true,
        type: 'user',
        adminId: null,
        userId: ctx.session.user.id,
      };
    }

    // 4. 无作者信息
    return {
      hasAuthor: false,
      type: null,
      adminId: null,
      userId: null,
    };
  }

  /**
   * 批量 AI 增强发布
   * POST /manage/ai/content/batch-publish
   *
   * Body:
   * {
   *   "contentList": [
   *     { "title": "文章1", "comments": "内容1", ... },
   *     { "title": "文章2", "comments": "内容2", ... }
   *   ],
   *   "publishMode": "ai_smart",
   *   "options": {
   *     "regenerateTitle": true,
   *     "regenerateSummary": true,
   *     "regenerateTags": true,
   *     "autoCategory": false,
   *     "seoOptimize": false,
   *     "qualityCheck": false,
   *     "batchSize": 3
   *   }
   * }
   */
  async batchPublish() {
    const { ctx } = this;

    try {
      const { contentList, publishMode = 'ai_smart', options = {} } = ctx.request.body;

      // 验证必填字段
      if (!contentList || !Array.isArray(contentList) || contentList.length === 0) {
        ctx.helper.renderFail(ctx, {
          message: '内容列表不能为空',
        });
        return;
      }

      // 调用 ContentPublishService
      const result = await ctx.service.contentPublishService.batchPublish(contentList, publishMode, options);

      ctx.helper.renderSuccess(ctx, {
        data: result,
        message: `批量发布完成：成功 ${result.succeeded} 个，失败 ${result.failed} 个`,
      });
    } catch (error) {
      ctx.logger.error('[ContentPublishController] batchPublish failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '批量发布失败',
      });
    }
  }

  /**
   * 获取 AI 增强预览（不保存）
   * POST /manage/ai/content/preview
   *
   * Body:
   * {
   *   "contentData": {
   *     "title": "文章标题",
   *     "comments": "文章内容",
   *     "discription": "文章摘要",
   *     "tags": ["标签1", "标签2"],
   *     "categories": "分类ID"
   *   },
   *   "options": {
   *     "regenerateTitle": true,
   *     "regenerateSummary": true,
   *     "regenerateTags": true,
   *     "autoCategory": false,
   *     "language": "zh-CN"
   *   }
   * }
   */
  async previewEnhancements() {
    const { ctx } = this;

    try {
      const { contentData, options = {} } = ctx.request.body;

      // 验证必填字段
      if (!contentData || !contentData.comments) {
        ctx.helper.renderFail(ctx, {
          message: '文章内容不能为空',
        });
        return;
      }

      // 使用 AI Smart 模式进行增强，但不保存
      const publishResult = await ctx.service.contentPublishService.publishContent(contentData, 'ai_smart', {
        regenerateTitle: options.regenerateTitle !== false,
        regenerateSummary: options.regenerateSummary !== false,
        regenerateTags: options.regenerateTags !== false,
        seoOptimize: options.seoOptimize !== false,
        autoCategory: options.autoCategory || false,
        language: options.language || 'zh-CN',
        generateCoverImage: options.generateCoverImage || false,
      });

      if (!publishResult.success) {
        ctx.helper.renderFail(ctx, {
          message: publishResult.error || 'AI 增强预览失败',
        });
        return;
      }

      ctx.helper.renderSuccess(ctx, {
        data: {
          originalContent: {
            title: contentData.title,
            discription: contentData.discription,
            tags: contentData.tags,
            categories: contentData.categories,
          },
          enhancedContent: {
            title: publishResult.content.title,
            discription: publishResult.content.discription,
            keywords: publishResult.content.keywords,
            sImg: publishResult.content.sImg,
            tags: publishResult.content.aiGeneratedTags || [],
            tagIds: publishResult.content.tags || [],
            categories: publishResult.content.categories,
          },
          aiEnhancements: publishResult.aiEnhancements,
        },
        message: 'AI 增强预览生成成功',
      });
    } catch (error) {
      ctx.logger.error('[ContentPublishController] previewEnhancements failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || 'AI 增强预览失败',
      });
    }
  }

  /**
   * 获取发布模式说明
   * GET /manage/ai/content/publish-modes
   */
  async getPublishModes() {
    const { ctx } = this;

    try {
      const modes = [
        {
          mode: 'manual',
          name: '手动发布',
          description: '传统手动发布，用户完全控制所有内容',
          features: ['无 AI 干预', '完全手动控制', '快速发布'],
          useCase: '内容已经完整，不需要 AI 辅助',
        },
        {
          mode: 'ai_smart',
          name: 'AI 智能辅助',
          description: 'AI 智能辅助发布，根据需要生成元数据',
          features: [
            '可选择性生成标题',
            '可选择性生成摘要',
            '可选择性提取标签',
            '可选择性匹配分类',
            'SEO 优化',
            '质量检查',
          ],
          useCase: '有基础内容，需要 AI 优化部分字段',
          recommended: true,
        },
        {
          mode: 'ai_full',
          name: 'AI 完全发布',
          description: 'AI 自动生成所有元数据和优化',
          features: ['自动生成标题', '自动生成摘要', '自动提取标签', '自动匹配分类', 'SEO 优化', '质量检查'],
          useCase: '只有正文内容，需要 AI 生成所有元数据',
        },
      ];

      ctx.helper.renderSuccess(ctx, {
        data: modes,
      });
    } catch (error) {
      ctx.logger.error('[ContentPublishController] getPublishModes failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取发布模式失败',
      });
    }
  }

  /**
   * 获取 AI 增强选项说明
   * GET /manage/ai/content/enhancement-options
   */
  async getEnhancementOptions() {
    const { ctx } = this;

    try {
      const options = [
        {
          key: 'regenerateTitle',
          name: '重新生成标题',
          description: '使用 AI 根据内容生成吸引人的标题',
          default: false,
          type: 'boolean',
          dependsOn: null,
        },
        {
          key: 'regenerateSummary',
          name: '重新生成摘要',
          description: '使用 AI 提取内容要点生成摘要',
          default: false,
          type: 'boolean',
          dependsOn: null,
        },
        {
          key: 'regenerateTags',
          name: '重新生成标签',
          description: '使用 AI 从内容中提取关键标签',
          default: false,
          type: 'boolean',
          dependsOn: null,
        },
        {
          key: 'autoCategory',
          name: '自动匹配分类',
          description: '使用 AI 自动匹配最合适的分类',
          default: false,
          type: 'boolean',
          dependsOn: null,
        },
        {
          key: 'seoOptimize',
          name: 'SEO 优化',
          description: '使用 AI 优化标题、摘要和关键词以提升 SEO',
          default: false,
          type: 'boolean',
          dependsOn: null,
          note: '耗时较长，建议在重要内容上使用',
        },
        {
          key: 'qualityCheck',
          name: '质量检查',
          description: '使用 AI 检查内容质量并提供改进建议',
          default: false,
          type: 'boolean',
          dependsOn: null,
          note: '耗时较长，建议在重要内容上使用',
        },
        {
          key: 'language',
          name: '语言',
          description: '内容语言',
          default: 'zh-CN',
          type: 'string',
          enum: ['zh-CN', 'en-US', 'ja-JP'],
        },
        {
          key: 'titleStyle',
          name: '标题风格',
          description: '标题生成风格',
          default: 'engaging',
          type: 'string',
          enum: ['engaging', 'professional', 'simple'],
          dependsOn: 'regenerateTitle',
        },
        {
          key: 'summaryMaxLength',
          name: '摘要最大长度',
          description: '生成摘要的最大字符数',
          default: 200,
          type: 'number',
          range: [50, 500],
          dependsOn: 'regenerateSummary',
        },
        {
          key: 'tagsMaxCount',
          name: '标签最大数量',
          description: '提取标签的最大数量',
          default: 5,
          type: 'number',
          range: [1, 10],
          dependsOn: 'regenerateTags',
        },
        {
          key: 'batchSize',
          name: '批量处理大小',
          description: '批量发布时每批处理的数量',
          default: 3,
          type: 'number',
          range: [1, 10],
          dependsOn: null,
          note: '仅用于批量发布',
        },
      ];

      ctx.helper.renderSuccess(ctx, {
        data: options,
      });
    } catch (error) {
      ctx.logger.error('[ContentPublishController] getEnhancementOptions failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取增强选项失败',
      });
    }
  }
}

module.exports = ContentPublishController;
