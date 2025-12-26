/**
 * ContentTag API控制器 - 2024统一异常处理优化版
 * 🔥 基于repository-modules规则优化：
 * 1. 参数标准化：使用操作符格式查询条件和标准化字段选择
 * 2. 异常处理统一：使用RepositoryExceptions统一错误处理
 * 3. 业务验证优化：直接调用Service验证方法，自动抛出语义化异常
 * 4. 查询条件优化：使用filters而非直接查询条件
 * 5. 语义化异常：清晰的异常描述和类型分类
 */
'use strict';

const _ = require('lodash');
const { contentTagRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');

const ContentTagController = {
  /**
   * 🔥 优化版：获取标签列表 - 使用TemplateService缓存
   * @param ctx
   */
  async list(ctx) {
    try {
      // 🚀 使用TemplateService的优化缓存方法
      const contentTagList = await ctx.service.templateService.fetchContent('tags', {
        isPaging: ctx.query.isPaging || '0',
        pageSize: ctx.query.pageSize,
        searchKeys: ['name', 'alias'],
        ...ctx.query,
      });

      ctx.helper.renderSuccess(ctx, {
        data: contentTagList,
      });
    } catch (error) {
      ctx.logger.error('Get tag list error:', error);
      ctx.helper.renderFail(ctx, {
        data: error.message,
      });
    }
  },

  /**
   * 🔥 优化版：获取热门标签 - 使用TemplateService解决N+1问题
   * @param ctx
   */
  async hot(ctx) {
    try {
      // 🚀 直接使用TemplateService的优化缓存方法
      const hotTags = await ctx.service.templateService.fetchContent('hotTags', {
        pageSize: ctx.query.pageSize || 10,
        ...ctx.query,
      });

      ctx.helper.renderSuccess(ctx, {
        data: hotTags,
      });
    } catch (error) {
      ctx.logger.error('Get hot tags error:', error);
      ctx.helper.renderFail(ctx, {
        data: error.message,
      });
    }
  },

  /**
   * 🔥 优化版：创建标签 - 统一异常处理标准
   * @param ctx
   */
  async create(ctx) {
    const fields = ctx.request.body || {};
    const formObj = {
      name: fields.name,
      alias: fields.alias,
      comments: fields.comments,
    };

    // 参数验证
    ctx.validate(contentTagRule.form(ctx), formObj);

    // 🔥 业务验证 - Service会自动抛出具体异常（统一调用方式）
    // 无需手动检查返回值，Service会自动抛出语义化异常
    if (formObj.name) {
      await ctx.service.contentTag.checkNameUnique(formObj.name);
    }

    if (formObj.alias) {
      await ctx.service.contentTag.checkAliasUnique(formObj.alias);
    }

    // 创建标签
    const result = await ctx.service.contentTag.create(formObj);

    ctx.helper.renderSuccess(ctx, {
      data: result?.id || result?._id,
    });
  },

  /**
   * 🔥 优化版：根据标签名称搜索 - 使用RepositoryExceptions统一异常处理
   * @param ctx
   */
  async searchByNames(ctx) {
    const { tagNames } = ctx.request.body || {};

    // 🔥 参数验证 - 使用RepositoryExceptions语义化异常
    if (!tagNames) {
      throw RepositoryExceptions.resource.notFound('标签名称数组', tagNames);
    }

    if (!Array.isArray(tagNames)) {
      throw RepositoryExceptions.contentTag.invalidStatus('tagNames 必须是数组格式');
    }

    if (tagNames.length === 0) {
      throw RepositoryExceptions.contentTag.nameRequired();
    }

    const matchedIds = await ctx.service.contentTag.searchByNames(tagNames);

    ctx.helper.renderSuccess(ctx, {
      data: matchedIds.length ? matchedIds : ['noTagsFound'],
    });
  },

  /**
   * 🔥 新增：获取标签详情
   * @param ctx
   * @description 支持 RESTful 路由：GET /api/v1/tags/:id
   */
  async getOne(ctx) {
    // 🔥 RESTful: 优先使用路径参数，也兼容查询参数
    const id = ctx.params.id || ctx.query.id;

    // 🔥 使用语义化的异常方法
    if (!id) {
      throw RepositoryExceptions.resource.notFound('标签ID', id);
    }

    const targetItem = await ctx.service.contentTag.findOne({
      id: { $eq: id },
    });

    if (!targetItem) {
      throw RepositoryExceptions.contentTag.notFound(id);
    }

    ctx.helper.renderSuccess(ctx, {
      data: targetItem,
    });
  },

  /**
   * 🔥 新增：获取相关标签
   * @param ctx
   */
  async getRelated(ctx) {
    const keyword = ctx.query.keyword;

    if (!keyword) {
      throw RepositoryExceptions.resource.notFound('搜索关键词', keyword);
    }

    const options = {
      limit: ctx.query.limit || 10,
    };

    const relatedTags = await ctx.service.contentTag.findRelatedTags(keyword, options);

    ctx.helper.renderSuccess(ctx, {
      data: relatedTags,
    });
  },

  /**
   * 🔥 新增：获取标签统计信息
   * @param ctx
   */
  async getStats(ctx) {
    const tagId = ctx.query.id;

    if (!tagId) {
      throw RepositoryExceptions.resource.notFound('标签ID', tagId);
    }

    const stats = await ctx.service.contentTag.getTagStats(tagId);

    ctx.helper.renderSuccess(ctx, {
      data: stats,
    });
  },

  /**
   * 🔥 新增：获取标签排行榜
   * @param ctx
   */
  async getRankings(ctx) {
    const payload = ctx.query;
    const rankings = await ctx.service.contentTag.getTagRankings(payload);

    ctx.helper.renderSuccess(ctx, {
      data: rankings,
    });
  },

  /**
   * 🔥 AI标签智能处理：根据标签名查找或创建标签
   * @description 用于AI生成标签后的批量处理，已存在的标签直接返回，不存在的自动创建
   * @param ctx
   */
  async findOrCreateByNames(ctx) {
    const { tagNames } = ctx.request.body || {};

    // 🔥 参数验证
    if (!tagNames) {
      throw RepositoryExceptions.resource.notFound('标签名称数组', tagNames);
    }

    if (!Array.isArray(tagNames)) {
      throw RepositoryExceptions.contentTag.invalidStatus('tagNames 必须是数组格式');
    }

    if (tagNames.length === 0) {
      throw RepositoryExceptions.contentTag.nameRequired();
    }

    // 过滤空标签并去重
    const uniqueTagNames = [...new Set(tagNames.filter(name => name && name.trim()))];

    if (uniqueTagNames.length === 0) {
      throw RepositoryExceptions.contentTag.nameRequired();
    }

    // 调用Service处理
    const tags = await ctx.service.contentTag.findOrCreateByNames(uniqueTagNames);

    ctx.helper.renderSuccess(ctx, {
      data: {
        tags, // 完整标签对象数组
        tagIds: tags.map(tag => tag.id || tag._id), // 标签ID数组
      },
    });
  },
};

module.exports = ContentTagController;
