/**
 * 优化后的 Content 管理控制器
 * 🔥 基于Menu模块重构经验，优化参数规范化和异常处理
 * ✅ 移除重复的try-catch，使用统一异常处理中间件
 * ✅ 标准化查询参数格式
 * ✅ 业务验证异常化处理
 */
'use strict';

// const xss = require('xss');
const _ = require('lodash');
// const shortid = require('shortid');
const validator = require('validator');
const { validatorUtil } = require('../../utils');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const ContentController = {
  /**
   * 检查Content表单数据
   * @param {Context} ctx 上下文
   * @param {Object} fields 表单字段
   * @throws {ValidationError} 验证失败时抛出异常
   */
  checkContentFormData(ctx, fields) {
    if (fields.id && !ctx.validateId(fields.id)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    if (!validatorUtil.isRegularCharacter(fields.title)) {
      throw RepositoryExceptions.content.titleRequired();
    }
    if (!validator.isLength(fields.title, 2, 30)) {
      throw RepositoryExceptions.content.titleTooLong(30);
    }
    if (fields.stitle && !validator.isLength(fields.stitle, 2, 30)) {
      throw RepositoryExceptions.create.validation(
        ctx.__('validation.rangelength', [ctx.__('content.fields.stitle'), 2, 30])
      );
    }
    if (fields.type && !validator.isIn(fields.type + '', ['1', '2', '3'])) {
      throw RepositoryExceptions.content.invalidType(fields.type);
    }
    if (!fields.categories) {
      throw RepositoryExceptions.content.categoriesRequired();
    }
    if (!fields.sImg) {
      throw RepositoryExceptions.create.validation(
        ctx.__('validation.selectNull', [ctx.__('content.fields.thumbnail')])
      );
    }
    if (!validator.isLength(fields.discription, 5, 300)) {
      throw RepositoryExceptions.content.descriptionTooLong(300);
    }
    if (fields.comments && !validator.isLength(fields.comments, 5, 100000)) {
      throw RepositoryExceptions.content.contentTooLong(100000);
    }
    if (fields.state && !validator.isIn(fields.state + '', ['0', '1', '2', '3'])) {
      throw RepositoryExceptions.content.invalidState(fields.state);
    }
  },

  /**
   * 渲染内容标签
   * @param {Object} tags 标签数据
   * @return {Array} 处理后的标签列表
   */
  renderContentTags(tags) {
    const list = [];
    if (tags) {
      for (let i = 0; i < tags.length; i++) {
        const tagItem = tags[i];
        list.push(tagItem.name);
      }
    }
    return list;
  },

  /**
   * 🔥 优化版：内容列表查询 - 标准化参数处理
   * @param ctx
   */
  async list(ctx) {
    const payload = ctx.query;

    // 🔥 构建标准化查询条件
    const filters = { draft: { $eq: '0' } };
    const sort = [{ field: 'createdAt', order: 'desc' }];

    if (payload.title) {
      filters.title = { $regex: payload.title, $options: 'i' };
    }

    if (payload.stitle) {
      filters.stitle = { $regex: payload.stitle, $options: 'i' };
    }

    if (payload.discription) {
      filters.discription = { $regex: payload.discription, $options: 'i' };
    }

    // 分类筛选
    if (payload.categories) {
      filters.categories = { $eq: payload.categories };
    }

    // 作者筛选
    if (payload.author) {
      filters.author = { $eq: payload.author };
    }

    // 用户作者筛选
    if (payload.uAuthor) {
      filters.uAuthor = { $eq: payload.uAuthor };
    }

    // 状态筛选
    if (payload.state) {
      filters.state = { $eq: payload.state };
    }

    // 类型筛选
    if (payload.type) {
      filters.type = { $eq: payload.type };
    }

    if (payload.draft) {
      filters.draft = { $eq: payload.draft };
    }

    // 日期范围筛选
    if (payload.startTime && payload.endTime) {
      filters.createdAt = {
        $gte: new Date(payload.startTime),
        $lte: new Date(payload.endTime),
      };
    }

    const contentList = await ctx.service.content.find(payload, {
      filters,
      sort,
      searchKeys: ['title', 'stitle', 'discription', 'comments'],
      fields: getContentListFields().split(' ').filter(Boolean),
    });

    ctx.helper.renderSuccess(ctx, {
      data: contentList,
    });
  },

  /**
   * 🔥 优化版：获取单个内容详情
   * @param ctx
   * @description 支持 RESTful 路由：GET /manage/v1/content/:id
   */
  async getOne(ctx) {
    // 🔥 RESTful: 优先使用路径参数，也兼容查询参数
    const targetId = ctx.params.id || ctx.query.id;

    if (!targetId || !ctx.validateId(targetId)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    const targetContent = await ctx.service.content.findOne({
      id: { $eq: targetId },
    });

    if (_.isEmpty(targetContent)) {
      throw RepositoryExceptions.content.notFound(targetId);
    }

    ctx.helper.renderSuccess(ctx, {
      data: targetContent,
    });
  },

  /**
   * 🔥 优化版：添加内容 - 统一异常处理
   * @param ctx
   */
  async create(ctx) {
    const fields = ctx.request.body;

    // 🔥 业务验证 - 自动抛出异常
    ContentController.checkContentFormData(ctx, fields);

    // ✅ 使用 Service 层的预处理方法（统一处理）
    const newContent = await ctx.service.content.createWithPreprocessing(fields, {
      author: ctx.session.adminUserInfo.id,
      ctx,
    });

    // 记录操作日志
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'content',
        action: 'create',
        resource_type: 'content',
        resource_id: newContent.id,
        new_value: JSON.stringify({
          title: fields.title,
          state: fields.state,
          categories: fields.categories,
        }),
        logs: ctx.__('logs.content.create', [fields.title]),
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    ctx.helper.renderSuccess(ctx, {
      data: {
        id: newContent.id,
      },
    });
  },

  /**
   * 🔥 优化版：更新内容 - 统一异常处理
   * @param ctx
   * @description 支持 RESTful 路由：PUT /manage/v1/content/:id
   */
  async update(ctx) {
    const fields = ctx.request.body;

    // 🔥 RESTful: 优先使用路径参数中的 id，也兼容 body 中的 id
    const contentId = ctx.params.id || fields.id;
    fields.id = contentId; // 确保 fields 中有 id 供后续验证使用

    // 🔥 业务验证 - 自动抛出异常
    ContentController.checkContentFormData(ctx, fields);

    // 检查内容是否存在
    const targetContent = await ctx.service.content.findOne({
      id: { $eq: contentId },
    });

    if (_.isEmpty(targetContent)) {
      throw RepositoryExceptions.content.notFound(contentId);
    }

    // ✅ 使用 Service 层的预处理方法（统一处理）
    await ctx.service.content.updateWithPreprocessing(fields.id, fields, {
      author: ctx.session.adminUserInfo.id,
      ctx,
    });

    // 记录操作日志
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'content',
        action: 'update',
        resource_type: 'content',
        resource_id: fields.id,
        old_value: JSON.stringify({
          title: targetContent.title,
          state: targetContent.state,
        }),
        new_value: JSON.stringify({
          title: fields.title,
          state: fields.state,
        }),
        logs: ctx.__('logs.content.update', [fields.title]),
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 🔥 优化版：删除内容 - 统一异常处理 (废弃，使用removes)
   * @param ctx
   */
  async remove(ctx) {
    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('content.fields.title'),
    });

    // 获取删除前的数据（用于日志记录）
    const deletedContents = await Promise.all(
      idsArray.map(id =>
        ctx.service.content.findOne({ id: { $eq: id } }, { fields: ['id', 'title'] }).catch(() => null)
      )
    );

    await ctx.service.content.removes(idsArray);

    // 记录操作日志
    await ctx.service.systemOptionLog
      .logOperation({
        module: 'content',
        action: 'delete',
        resource_type: 'content',
        resource_id: idsArray.join(','),
        old_value: JSON.stringify(
          deletedContents
            .filter(c => c)
            .map(c => ({
              id: c.id,
              title: c.title,
            }))
        ),
        logs: ctx.__('logs.content.delete', [
          deletedContents
            .filter(c => c)
            .map(c => c.title)
            .join(', '),
        ]),
      })
      .catch(err => {
        console.error('[OperationLog] Failed to log:', err.message);
      });

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 🔥 优化版：批量更新内容状态
   * @param ctx
   */
  async updateContentToTop(ctx) {
    const targetIds = ctx.query.ids;
    const topState = ctx.query.topState || '1';

    if (!targetIds) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.selectNull', [ctx.__('content.fields.title')]));
    }

    const idsArr = targetIds.split(',');
    for (const contentId of idsArr) {
      if (!ctx.validateId(contentId)) {
        throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
      }
    }

    await ctx.service.content.updateMany(idsArr, { isTop: topState });

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 🔥 优化版：批量更新内容状态
   * @param ctx
   */
  async updateContentState(ctx) {
    const targetIds = ctx.query.ids;
    const state = ctx.query.state;

    if (!targetIds) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.selectNull', [ctx.__('content.fields.title')]));
    }

    if (!state || !validator.isIn(state, ['0', '1', '2', '3'])) {
      throw RepositoryExceptions.content.invalidState(state);
    }

    const idsArr = targetIds.split(',');
    for (const contentId of idsArr) {
      if (!ctx.validateId(contentId)) {
        throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
      }
    }

    await ctx.service.content.updateMany(idsArr, { state });

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 🔥 优化版：根据用户清除所有内容
   * @param ctx
   */
  async deleteContentByUser(ctx) {
    const userId = ctx.query.userId;

    if (!userId || !ctx.validateId(userId)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    await ctx.service.content.removes(
      {
        uAuthor: { $eq: userId },
      },
      true
    );

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 🔥 优化版：复制内容
   * @param ctx
   */
  async addContentByCopy(ctx) {
    const targetId = ctx.query.id;

    if (!targetId || !ctx.validateId(targetId)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    const targetContent = await ctx.service.content.findOne({
      id: { $eq: targetId },
    });

    if (_.isEmpty(targetContent)) {
      throw RepositoryExceptions.content.notFound(targetId);
    }

    const newContent = _.omit(targetContent, ['id', 'createdAt', 'updatedAt']);
    newContent.title = `${targetContent.title}_copy`;
    newContent.stitle = `${targetContent.stitle}_copy`;
    newContent.state = '0';
    newContent.author = ctx.session.adminUserInfo.id;

    const result = await ctx.service.content.create(newContent);

    ctx.helper.renderSuccess(ctx, {
      data: {
        id: result.id,
      },
    });
  },

  /**
   * 🔥 优化版：获取内容统计信息
   * @param ctx
   */
  async getContentStatistics(ctx) {
    const totalCount = await ctx.service.content.count({});
    const publishedCount = await ctx.service.content.count({ state: { $eq: '2' } });
    const draftCount = await ctx.service.content.count({ state: { $eq: '0' } });
    const reviewingCount = await ctx.service.content.count({ state: { $eq: '1' } });
    const topCount = await ctx.service.content.count({ isTop: { $eq: 1 } });

    const monthlyCount = await ctx.service.content.count({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lte: new Date(),
      },
    });

    ctx.helper.renderSuccess(ctx, {
      data: {
        total: totalCount,
        published: publishedCount,
        draft: draftCount,
        reviewing: reviewingCount,
        top: topCount,
        monthly: monthlyCount,
      },
    });
  },

  /**
   * 🔥 优化版：导出内容数据
   * @param ctx
   */
  async exportContent(ctx) {
    const payload = ctx.query;

    // 🔥 构建标准化查询条件
    const filters = {};

    if (payload.category) {
      filters.categories = { $eq: payload.category };
    }

    if (payload.state) {
      filters.state = { $eq: payload.state };
    }

    if (payload.startTime && payload.endTime) {
      filters.createdAt = {
        $gte: new Date(payload.startTime),
        $lte: new Date(payload.endTime),
      };
    }

    const contentList = await ctx.service.content.find(
      { isPaging: '0' },
      {
        filters,
        sort: [{ field: 'createdAt', order: 'desc' }],
        fields: ['title', 'stitle', 'author', 'uAuthor', 'state', 'createdAt', 'clickNum'],
      }
    );

    ctx.helper.renderSuccess(ctx, {
      data: contentList,
    });
  },

  /**
   * 🔥 优化版：文章置顶处理
   * @param ctx
   */
  async roofPlacement(ctx) {
    const fields = ctx.request.body;

    if (!fields.id || !ctx.validateId(fields.id)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    await ctx.service.content.update(fields.id, {
      roofPlacement: fields.roofPlacement || '0',
    });

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 🔥 优化版：给文章分配用户
   * @param ctx
   */
  async redictContentToUsers(ctx) {
    const fields = ctx.request.body;
    const targetIds = fields.ids;
    const targetUser = fields.targetUser;

    if (!targetUser || !ctx.validateId(targetUser)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    if (!targetIds || !Array.isArray(targetIds)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.selectNull', [ctx.__('content.fields.title')]));
    }

    // 验证所有ID
    for (const contentId of targetIds) {
      if (!ctx.validateId(contentId)) {
        throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
      }
    }

    await ctx.service.content.updateMany(targetIds, { uAuthor: targetUser });

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 🔥 优化版：更新内容编辑器
   * @param ctx
   */
  async updateContentEditor(ctx) {
    const fields = ctx.request.body;

    if (!fields.targetUser || !ctx.validateId(fields.targetUser)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    // 验证目标用户是否存在
    const targetUser = await ctx.service.user.findOne({
      id: { $eq: fields.targetUser },
    });

    if (_.isEmpty(targetUser)) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    const adminUserInfo = ctx.session.adminUserInfo;

    await ctx.service.admin.update(adminUserInfo.id, {
      targetEditor: fields.targetUser,
    });

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 🔥 优化版：移动内容到分类
   * @param ctx
   */
  async moveCate(ctx) {
    const fields = ctx.request.body;

    if (!fields.ids || !fields.categories) {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    const targetIds = fields.ids.split(',');

    // 验证所有ID
    for (const contentId of targetIds) {
      if (!ctx.validateId(contentId)) {
        throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
      }
    }

    // 批量更新分类
    await ctx.service.content.updateMany(targetIds, { categories: fields.categories });

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 🔥 优化版：批量删除内容 (兼容草稿删除)
   * @param ctx
   */
  async removes(ctx) {
    // 🔥 使用统一的参数处理工具
    const { idsArray, extraParams } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('content.fields.title'),
      extraParams: ['draft'],
    });

    const { draft } = extraParams;

    if (draft === '1') {
      // 草稿软删除
      await ctx.service.content.updateMany(idsArray, { draft: '1' });
    } else {
      // 删除相关消息
      await ctx.service.message.removes(idsArray, 'contentId');
      // 删除内容
      await ctx.service.content.removes(idsArray);
    }

    ctx.helper.renderSuccess(ctx);
  },

  /**
   * 🔥 优化版：批量更新内容
   * @param ctx
   */
  async updateContents(ctx) {
    const fields = ctx.request.body;
    const updates = fields.updates;

    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('content.fields.title'),
    });

    if (!updates || typeof updates !== 'object') {
      throw RepositoryExceptions.create.validation(ctx.__('validation.errorParams'));
    }

    await ctx.service.content.updateMany(idsArray, updates);

    ctx.helper.renderSuccess(ctx);
  },
};

module.exports = ContentController;
