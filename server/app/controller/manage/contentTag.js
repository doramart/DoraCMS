'use strict';

/**
 * ContentTag Controller - 2024统一异常处理优化版
 * 🔥 基于Admin/Menu/Role模块成功实践的最佳实践
 * ✅ 移除Controller层try-catch，交给全局错误中间件处理
 * ✅ 使用语义化异常，专注业务逻辑
 * ✅ 统一错误响应格式
 */

const _ = require('lodash');
const { contentTagRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const ContentTagController = {
  /**
   * 🔥 优化版：获取标签列表
   * 移除try-catch，让异常自然抛出
   * @param ctx
   */
  async list(ctx) {
    const payload = ctx.query;

    // 🎯 标准化查询选项
    const options = {
      sort: [
        { field: 'sortId', order: 'asc' },
        { field: 'createdAt', order: 'desc' },
      ],
    };

    const contentTagList = await ctx.service.contentTag.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: contentTagList,
    });
  },

  /**
   * 🔥 优化版：创建标签 - 统一异常处理标准
   * 无异常处理代码，专注业务逻辑
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

    ctx.helper.renderSuccess(ctx, { data: result });
  },

  /**
   * 🔥 优化版：获取单个标签
   * 使用语义化异常处理
   * @param ctx
   * @description 支持 RESTful 路由：GET /manage/v1/tags/:id
   */
  async getOne(ctx) {
    // 🔥 RESTful: 优先使用路径参数，也兼容查询参数
    const id = ctx.params.id || ctx.query.id;

    // 🔥 使用语义化的异常方法
    if (!id) {
      throw RepositoryExceptions.resource.notFound(ctx.__('contentTag.fields.id'), id);
    }

    // 🎯 标准化查询条件
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
   * 🔥 优化版：更新标签 - 统一异常处理标准
   * 专注业务逻辑，无异常处理代码
   * @param ctx
   * @description 支持 RESTful 路由：PUT /manage/v1/tags/:id
   */
  async update(ctx) {
    const fields = ctx.request.body || {};

    // 🔥 RESTful: 优先使用路径参数中的 id，也兼容 body 中的 id
    const tagId = ctx.params.id || fields.id;
    fields.id = tagId; // 确保 fields 中有 id 供后续验证使用

    const formObj = {
      name: fields.name,
      alias: fields.alias,
      comments: fields.comments,
    };

    // 参数验证
    ctx.validate(contentTagRule.form(ctx), formObj);

    // 🔥 ID验证
    if (!tagId) {
      throw RepositoryExceptions.resource.notFound(ctx.__('contentTag.fields.id'), tagId);
    }

    // 🔥 业务验证 - Service会自动抛出具体异常（统一调用方式）
    // 验证标签名称唯一性（排除当前记录）
    if (formObj.name) {
      await ctx.service.contentTag.checkNameUnique(formObj.name, tagId);
    }

    // 验证别名唯一性（排除当前记录）
    if (formObj.alias) {
      await ctx.service.contentTag.checkAliasUnique(formObj.alias, tagId);
    }

    // 更新标签
    const result = await ctx.service.contentTag.update(fields.id, formObj);

    ctx.helper.renderSuccess(ctx, { data: result });
  },

  /**
   * 🔥 优化版：批量删除标签
   * 移除try-catch，使用语义化异常
   * @param ctx
   */
  async removes(ctx) {
    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('contentTag.fields.name'),
    });

    const result = await ctx.service.contentTag.removes(idsArray);

    ctx.helper.renderSuccess(ctx, { data: result });
  },

  // ===== 🔥 新增业务方法（基于Repository完善的功能） =====

  /**
   * 🔥 新增：软删除标签
   * @param ctx
   */
  async safeDelete(ctx) {
    const targetIds = ctx.query.ids;

    if (!targetIds) {
      throw RepositoryExceptions.resource.notFound(ctx.__('contentTag.fields.id'), targetIds);
    }

    const result = await ctx.service.contentTag.safeDelete(targetIds);

    ctx.helper.renderSuccess(ctx, { data: result });
  },

  /**
   * 🔥 新增：获取热门标签
   * @param ctx
   */
  async getHotTags(ctx) {
    const payload = ctx.query;
    const hotTags = await ctx.service.contentTag.findHotTags(payload);

    ctx.helper.renderSuccess(ctx, {
      data: hotTags,
    });
  },

  /**
   * 🔥 新增：获取标签统计信息
   * @param ctx
   */
  async getTagStats(ctx) {
    const tagId = ctx.query.id;

    if (!tagId) {
      throw RepositoryExceptions.resource.notFound(ctx.__('contentTag.fields.id'), tagId);
    }

    const stats = await ctx.service.contentTag.getTagStats(tagId);

    ctx.helper.renderSuccess(ctx, {
      data: stats,
    });
  },

  /**
   * 🔥 新增：获取标签使用排行榜
   * @param ctx
   */
  async getTagRankings(ctx) {
    const payload = ctx.query;
    const rankings = await ctx.service.contentTag.getTagRankings(payload);

    ctx.helper.renderSuccess(ctx, {
      data: rankings,
    });
  },

  /**
   * 🔥 新增：按关键词查找相关标签
   * @param ctx
   */
  async findRelatedTags(ctx) {
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
   * 🔥 新增：批量更新标签状态
   * @param ctx
   */
  async batchUpdateStatus(ctx) {
    const { ids, status } = ctx.request.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw RepositoryExceptions.resource.notFound(ctx.__('contentTag.fields.ids'), ids);
    }

    if (!status || !['0', '1'].includes(status)) {
      throw RepositoryExceptions.contentTag.invalidStatus(status);
    }

    const result = await ctx.service.contentTag.updateMany(ids, { status });

    ctx.helper.renderSuccess(ctx, { data: result });
  },

  /**
   * 🔥 新增：批量创建或查找标签
   * @param ctx
   */
  async createOrFindTags(ctx) {
    const tagData = ctx.request.body.tags;

    if (!Array.isArray(tagData) || tagData.length === 0) {
      throw RepositoryExceptions.resource.notFound(ctx.__('contentTag.fields.tagData'), tagData);
    }

    const result = await ctx.service.contentTag.createOrFindTags(tagData);

    ctx.helper.renderSuccess(ctx, { data: result });
  },

  /**
   * 🔥 新增：清理未使用的标签
   * @param ctx
   */
  async cleanupUnusedTags(ctx) {
    const result = await ctx.service.contentTag.cleanupUnusedTags();

    ctx.helper.renderSuccess(ctx, { data: result });
  },
};

module.exports = ContentTagController;
