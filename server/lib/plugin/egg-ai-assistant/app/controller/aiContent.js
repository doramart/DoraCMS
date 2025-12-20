/**
 * AI 内容生成控制器
 * 提供 AI 内容生成相关的 HTTP API
 * 包括标题生成、摘要生成、标签提取、分类匹配等
 *
 * @author DoraCMS Team
 * @date 2025-01-12
 */

'use strict';

const Controller = require('egg').Controller;

class AIContentController extends Controller {
  /**
   * 生成文章标题
   * POST /manage/ai/content/generate-title
   *
   * Body:
   * {
   *   "content": "文章内容",
   *   "style": "engaging",  // engaging | professional | simple
   *   "keywords": "关键词",
   *   "language": "zh-CN",
   *   "maxLength": 30,
   *   "useCache": true,
   *   "strategy": "balanced"  // balanced | cost_optimal | performance_optimal
   * }
   */
  async generateTitle() {
    const { ctx } = this;

    try {
      const {
        content,
        style = 'engaging',
        keywords,
        language = 'zh-CN',
        maxLength = 30,
        useCache = true,
        strategy = 'balanced',
      } = ctx.request.body;

      // 验证必填字段
      if (!content) {
        ctx.helper.renderFail(ctx, {
          message: '内容不能为空',
        });
        return;
      }

      // 调用 AIContentService
      const result = await ctx.service.aiContentService.generateTitle(content, {
        style,
        keywords,
        language,
        maxLength,
        useCache,
        strategy,
      });

      if (!result.success) {
        ctx.helper.renderFail(ctx, {
          message: result.error || '标题生成失败',
        });
        return;
      }

      ctx.helper.renderSuccess(ctx, {
        data: {
          title: result.title,
          metadata: result.metadata,
          fromCache: result.fromCache || false,
        },
      });
    } catch (error) {
      ctx.logger.error('[AIContentController] generateTitle failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '标题生成失败',
      });
    }
  }

  /**
   * 生成文章摘要
   * POST /manage/ai/content/generate-summary
   *
   * Body:
   * {
   *   "content": "文章内容",
   *   "maxLength": 200,
   *   "style": "concise",  // concise | detailed
   *   "language": "zh-CN",
   *   "useCache": true,
   *   "strategy": "performance_optimal"
   * }
   */
  async generateSummary() {
    const { ctx } = this;

    try {
      const {
        content,
        maxLength = 200,
        style = 'concise',
        language = 'zh-CN',
        useCache = true,
        strategy = 'performance_optimal',
      } = ctx.request.body;

      // 验证必填字段
      if (!content) {
        ctx.helper.renderFail(ctx, {
          message: '内容不能为空',
        });
        return;
      }

      // 调用 AIContentService
      const result = await ctx.service.aiContentService.generateSummary(content, {
        maxLength,
        style,
        language,
        useCache,
        strategy,
      });

      if (!result.success) {
        ctx.helper.renderFail(ctx, {
          message: result.error || '摘要生成失败',
        });
        return;
      }

      ctx.helper.renderSuccess(ctx, {
        data: {
          summary: result.summary,
          metadata: result.metadata,
          fromCache: result.fromCache || false,
        },
      });
    } catch (error) {
      ctx.logger.error('[AIContentController] generateSummary failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '摘要生成失败',
      });
    }
  }

  /**
   * 提取文章标签
   * POST /manage/ai/content/extract-tags
   *
   * Body:
   * {
   *   "content": "文章内容",
   *   "maxTags": 8,
   *   "category": "技术",
   *   "language": "zh-CN",
   *   "useCache": true,
   *   "strategy": "cost_optimal"
   * }
   */
  async extractTags() {
    const { ctx } = this;

    try {
      const {
        content,
        maxTags = 8,
        category,
        language = 'zh-CN',
        useCache = true,
        strategy = 'cost_optimal',
      } = ctx.request.body;

      // 验证必填字段
      if (!content) {
        ctx.helper.renderFail(ctx, {
          message: '内容不能为空',
        });
        return;
      }

      // 调用 AIContentService
      const result = await ctx.service.aiContentService.extractTags(content, {
        maxTags,
        category,
        language,
        useCache,
        strategy,
      });

      if (!result.success) {
        ctx.helper.renderFail(ctx, {
          message: result.error || '标签提取失败',
        });
        return;
      }

      ctx.helper.renderSuccess(ctx, {
        data: {
          tags: result.tags,
          metadata: result.metadata,
          fromCache: result.fromCache || false,
        },
      });
    } catch (error) {
      ctx.logger.error('[AIContentController] extractTags failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '标签提取失败',
      });
    }
  }

  /**
   * 提取 SEO 关键词
   * POST /manage/ai/content/extract-keywords
   *
   * Body:
   * {
   *   "content": "文章内容",
   *   "maxKeywords": 8,
   *   "category": "技术",
   *   "title": "文章标题",
   *   "language": "zh-CN",
   *   "useCache": true,
   *   "strategy": "cost_optimal"
   * }
   */
  async extractKeywords() {
    const { ctx } = this;

    try {
      const {
        content,
        maxKeywords = 4,
        category,
        title,
        language = 'zh-CN',
        useCache = true,
        strategy = 'cost_optimal',
      } = ctx.request.body;

      // 验证必填字段
      if (!content) {
        ctx.helper.renderFail(ctx, {
          message: '内容不能为空',
        });
        return;
      }

      // 调用 AIContentService
      const result = await ctx.service.aiContentService.extractKeywords(content, {
        maxKeywords,
        category,
        title,
        language,
        useCache,
        strategy,
      });

      if (!result.success) {
        ctx.helper.renderFail(ctx, {
          message: result.error || '关键词提取失败',
        });
        return;
      }

      ctx.helper.renderSuccess(ctx, {
        data: {
          keywords: result.keywords,
          metadata: result.metadata,
          fromCache: result.fromCache || false,
        },
      });
    } catch (error) {
      ctx.logger.error('[AIContentController] extractKeywords failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '关键词提取失败',
      });
    }
  }

  /**
   * 匹配文章分类
   * POST /manage/ai/content/match-category
   *
   * Body:
   * {
   *   "content": "文章内容",
   *   "title": "文章标题",
   *   "tags": ["标签1", "标签2"],
   *   "language": "zh-CN",
   *   "useCache": true,
   *   "strategy": "balanced"
   * }
   */
  async matchCategory() {
    const { ctx } = this;

    try {
      const { content, title, tags, language = 'zh-CN', useCache = true, strategy = 'balanced' } = ctx.request.body;

      // 验证必填字段
      if (!content) {
        ctx.helper.renderFail(ctx, {
          message: '内容不能为空',
        });
        return;
      }

      // 获取所有可用的分类列表（包含完整信息以便构建树形结构）
      const categoryList = await ctx.service.contentCategory.find(
        { isPaging: '0' },
        {
          filters: {
            enable: { $eq: true },
          },
          fields: ['id', '_id', 'name', 'enName', 'description', 'parentId'],
        }
      );

      if (!categoryList || categoryList.length === 0) {
        ctx.helper.renderFail(ctx, {
          message: '没有可用的分类',
        });
        return;
      }

      // 使用 CategoryHelper 提取所有分类和叶子节点
      const { allCategories, leafCategories } = ctx.helper.categoryHelper.extractLeafCategories(categoryList);

      ctx.logger.info(
        `[AIContentController] 原始分类数: ${categoryList.length}, 展开后总数: ${allCategories.length}, 叶子分类数: ${leafCategories.length}`
      );
      ctx.logger.debug('[AIContentController] 叶子分类列表:', leafCategories.map(c => c.name).join(', '));

      // 使用 CategoryHelper 格式化叶子分类列表传给AI
      const formattedCategories = ctx.helper.categoryHelper.formatCategoriesForAI(leafCategories);

      // 调用 AIContentService
      const result = await ctx.service.aiContentService.matchCategory(content, formattedCategories, {
        title,
        tags,
        language,
        useCache,
        strategy,
      });

      if (!result.success) {
        ctx.helper.renderFail(ctx, {
          message: result.error || '分类匹配失败',
        });
        return;
      }

      ctx.helper.renderSuccess(ctx, {
        data: {
          categories: result.categories,
          metadata: result.metadata,
          fromCache: result.fromCache || false,
        },
      });
    } catch (error) {
      ctx.logger.error('[AIContentController] matchCategory failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '分类匹配失败',
      });
    }
  }

  /**
   * SEO 优化建议
   * POST /manage/ai/content/optimize-seo
   *
   * Body:
   * {
   *   "title": "文章标题",
   *   "content": "文章内容",
   *   "keywords": ["关键词1", "关键词2"],
   *   "language": "zh-CN",
   *   "useCache": true,
   *   "strategy": "balanced"
   * }
   */
  async optimizeSEO() {
    const { ctx } = this;

    try {
      const { title, content, keywords, language = 'zh-CN', useCache = true, strategy = 'balanced' } = ctx.request.body;

      // 验证必填字段
      if (!title || !content) {
        ctx.helper.renderFail(ctx, {
          message: '标题和内容不能为空',
        });
        return;
      }

      // 调用 AIContentService
      const result = await ctx.service.aiContentService.optimizeSEO(title, content, {
        keywords,
        language,
        useCache,
        strategy,
      });

      if (!result.success) {
        ctx.helper.renderFail(ctx, {
          message: result.error || 'SEO 优化失败',
        });
        return;
      }

      ctx.helper.renderSuccess(ctx, {
        data: {
          suggestions: result.suggestions,
          metadata: result.metadata,
          fromCache: result.fromCache || false,
        },
      });
    } catch (error) {
      ctx.logger.error('[AIContentController] optimizeSEO failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || 'SEO 优化失败',
      });
    }
  }

  /**
   * 检查内容质量
   * POST /manage/ai/content/check-quality
   *
   * Body:
   * {
   *   "title": "文章标题",
   *   "content": "文章内容",
   *   "language": "zh-CN",
   *   "useCache": true,
   *   "strategy": "performance_optimal"
   * }
   */
  async checkQuality() {
    const { ctx } = this;

    try {
      const {
        title,
        content,
        language = 'zh-CN',
        useCache = true,
        strategy = 'performance_optimal',
      } = ctx.request.body;

      // 验证必填字段
      if (!title || !content) {
        ctx.helper.renderFail(ctx, {
          message: '标题和内容不能为空',
        });
        return;
      }

      // 调用 AIContentService
      const result = await ctx.service.aiContentService.checkQuality(title, content, {
        language,
        useCache,
        strategy,
      });

      if (!result.success) {
        ctx.helper.renderFail(ctx, {
          message: result.error || '质量检查失败',
        });
        return;
      }

      ctx.helper.renderSuccess(ctx, {
        data: {
          assessment: result.assessment,
          metadata: result.metadata,
          fromCache: result.fromCache || false,
        },
      });
    } catch (error) {
      ctx.logger.error('[AIContentController] checkQuality failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '质量检查失败',
      });
    }
  }

  /**
   * 批量生成内容（标题、标签、摘要）
   * POST /manage/ai/content/generate-batch
   *
   * Body:
   * {
   *   "content": "文章内容",
   *   "language": "zh-CN",
   *   "strategy": "balanced",
   *   "title": { "style": "engaging", "maxLength": 30 },
   *   "tags": { "maxTags": 8 },
   *   "summary": { "maxLength": 200, "style": "concise" }
   * }
   */
  async generateBatch() {
    const { ctx } = this;

    try {
      const { content, language = 'zh-CN', strategy = 'balanced', title, tags, summary } = ctx.request.body;

      // 验证必填字段
      if (!content) {
        ctx.helper.renderFail(ctx, {
          message: '内容不能为空',
        });
        return;
      }

      // 调用 AIContentService
      const result = await ctx.service.aiContentService.generateBatch(content, {
        language,
        strategy,
        title,
        tags,
        summary,
      });

      if (!result.success) {
        ctx.helper.renderFail(ctx, {
          message: result.error || '批量生成失败',
        });
        return;
      }

      ctx.helper.renderSuccess(ctx, {
        data: result,
      });
    } catch (error) {
      ctx.logger.error('[AIContentController] generateBatch failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '批量生成失败',
      });
    }
  }

  /**
   * 清除 AI 内容缓存
   * DELETE /manage/ai/content/cache
   *
   * Query:
   * - type: 缓存类型（可选）title | tags | summary | category | seo | quality
   */
  async clearCache() {
    const { ctx } = this;

    try {
      const { type } = ctx.query;

      await ctx.service.aiContentService.clearCache(type);

      ctx.helper.renderSuccess(ctx, {
        message: '缓存清除成功',
      });
    } catch (error) {
      ctx.logger.error('[AIContentController] clearCache failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '缓存清除失败',
      });
    }
  }

  /**
   * 获取缓存统计信息
   * GET /manage/ai/content/cache/stats
   */
  async getCacheStats() {
    const { ctx } = this;

    try {
      const stats = ctx.service.aiContentService.getCacheStats();

      ctx.helper.renderSuccess(ctx, {
        data: stats,
      });
    } catch (error) {
      ctx.logger.error('[AIContentController] getCacheStats failed:', error);
      ctx.helper.renderFail(ctx, {
        message: error.message || '获取缓存统计失败',
      });
    }
  }
}

module.exports = AIContentController;
