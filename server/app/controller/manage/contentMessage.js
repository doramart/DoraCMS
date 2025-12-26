'use strict';
const xss = require('xss');
const _ = require('lodash');
const { contentMessageRule } = require('../../validate');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const DeleteParamsHelper = require('../../utils/deleteParamsHelper');

const { siteFunc } = require('../../utils');

const ContentMessageController = {
  async list(ctx) {
    const payload = ctx.query;

    // 🔥 参数标准化 - 使用操作符格式
    const options = {
      searchKeys: ['content', 'contentTitle'],
      fields: [
        'id',
        'contentId',
        'contentTitle',
        'content',
        'author',
        'adminAuthor',
        'utype',
        'state',
        'praise_num',
        'createdAt',
      ],
      filters: {},
      populate: [
        { path: 'contentId', select: ['title', 'stitle', 'id'] }, // 🔥 保持跨数据库兼容
        { path: 'author', select: ['userName', 'id', 'enable', 'createdAt', 'logo'] }, // User 表字段
        { path: 'adminAuthor', select: ['userName', 'id', 'status', 'createdAt', 'logo'] }, // 🔥 Admin 表字段：enable→status
      ],
    };

    // 🔥 动态构建filters对象 - 标准化查询条件
    if (payload.state !== undefined) {
      options.filters.state = { $eq: payload.state === 'true' };
    }
    if (payload.utype) {
      options.filters.utype = { $eq: payload.utype };
    }
    if (payload.contentId) {
      options.filters.contentId = { $eq: payload.contentId };
    }
    if (payload.author) {
      options.filters.author = { $eq: payload.author };
    }
    if (payload.adminAuthor) {
      options.filters.adminAuthor = { $eq: payload.adminAuthor };
    }

    const messageList = await ctx.service.message.find(payload, options);

    ctx.helper.renderSuccess(ctx, {
      data: messageList,
    });
  },

  async create(ctx) {
    const fields = ctx.request.body || {};

    // 🔥 统一异常处理版本 - 用户登录检查
    if (_.isEmpty(ctx.session.user) && _.isEmpty(ctx.session.adminUserInfo)) {
      throw RepositoryExceptions.auth.loginRequired();
    }

    const formObj = {
      contentId: fields.contentId,
      content: xss(fields.content),
      replyAuthor: fields.replyAuthor,
      adminReplyAuthor: fields.adminReplyAuthor,
      relationMsgId: fields.relationMsgId,
      utype: fields.utype || '0',
    };

    // 🔥 参数验证 - 使用异常抛出而非返回错误
    ctx.validate(contentMessageRule.form(ctx), formObj);

    // 🔥 业务验证 - 内容必填
    if (!formObj.content || formObj.content.trim() === '') {
      throw RepositoryExceptions.message.contentRequired();
    }

    // 🔥 设置作者信息
    if (fields.utype === '1') {
      // 管理员留言
      if (!ctx.session.adminUserInfo?.id) {
        throw RepositoryExceptions.auth.sessionExpired();
      }
      formObj.adminAuthor = ctx.session.adminUserInfo.id;
    } else {
      // 普通用户留言
      if (!ctx.session.user?.id) {
        throw RepositoryExceptions.auth.sessionExpired();
      }
      formObj.author = ctx.session.user.id;
    }

    const targetMessage = await ctx.service.message.create(formObj);

    // 🔥 发送消息通知 - 使用标准化查询
    try {
      const contentInfo = await ctx.service.content.findOne(
        { id: { $eq: fields.contentId } },
        {
          fields: ['uAuthor'],
        }
      );

      if (contentInfo) {
        const passiveUser = fields.replyAuthor ? fields.replyAuthor : contentInfo.uAuthor;
        const currentUser = ctx.session.user || ctx.session.adminUserInfo;

        siteFunc.addSiteMessage('3', currentUser, passiveUser, targetMessage.id, {
          targetMediaType: '1',
        });
      }
    } catch (notificationError) {
      // 通知发送失败不影响留言创建成功
      console.warn('留言通知发送失败:', notificationError.message);
    }

    // 🔥 返回完整的留言信息 - 使用标准化查询
    const returnMessage = await ctx.service.message.item({
      query: { id: targetMessage.id },
      populate: [
        { path: 'contentId', select: ['title', 'stitle', 'id'] }, // 🔥 保持跨数据库兼容
        { path: 'author', select: ['userName', 'id', 'enable', 'createdAt', 'logo'] }, // User 表字段
        { path: 'adminAuthor', select: ['userName', 'id', 'status', 'createdAt', 'logo'] }, // 🔥 Admin 表字段：enable→status
      ],
    });

    ctx.helper.renderSuccess(ctx, {
      data: returnMessage,
    });
  },

  /**
   * 获取单条留言 - 支持 RESTful 路由
   * GET /api/manage/contentMessage/:id 或 GET /api/manage/contentMessage/getOne?id=xxx
   * @param ctx
   */
  async getOne(ctx) {
    const id = ctx.params.id || ctx.query.id;

    // 🔥 参数验证
    if (!id) {
      throw RepositoryExceptions.message.notFound(id);
    }

    const targetItem = await ctx.service.message.item({
      query: { id },
      populate: [
        { path: 'contentId', select: ['title', 'stitle', 'id'] }, // 🔥 保持跨数据库兼容
        { path: 'author', select: ['userName', 'id', 'enable', 'createdAt', 'logo'] }, // User 表字段
        { path: 'replyAuthor', select: ['userName', 'id', 'enable', 'createdAt', 'logo'] }, // User 表字段
        { path: 'adminAuthor', select: ['userName', 'id', 'status', 'createdAt', 'logo'] }, // 🔥 Admin 表字段：enable→status
        { path: 'adminReplyAuthor', select: ['userName', 'id', 'status', 'createdAt', 'logo'] }, // 🔥 Admin 表字段：enable→status
      ],
    });

    if (!targetItem) {
      throw RepositoryExceptions.message.notFound(id);
    }

    ctx.helper.renderSuccess(ctx, {
      data: targetItem,
    });
  },

  async removes(ctx) {
    // 🔥 使用统一的参数处理工具
    const { idsArray } = DeleteParamsHelper.processDeleteParams(ctx, {
      fieldName: ctx.__('message.fields.content'),
    });

    // 🔥 批量大小检查
    if (idsArray.length > 100) {
      throw RepositoryExceptions.message.batchSizeTooLarge(idsArray.length, 100);
    }

    const result = await ctx.service.message.removes(idsArray);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: ctx.__('contentMessage.messages.deleteSuccess', [result.deletedCount || idsArray.length]),
    });
  },

  /**
   * 🔥 新增：批量更新留言状态
   * @param ctx
   */
  async batchUpdateState(ctx) {
    const { ids, state } = ctx.request.body;

    // 🔥 参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw RepositoryExceptions.message.emptyBatch();
    }

    if (state === undefined || (state !== true && state !== false)) {
      throw RepositoryExceptions.message.invalidState(state);
    }

    // 🔥 批量大小检查
    if (ids.length > 100) {
      throw RepositoryExceptions.message.batchSizeTooLarge(ids.length, 100);
    }

    const result = await ctx.service.message.batchUpdateState(ids, state);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: ctx.__('contentMessage.messages.updateStatusSuccess', [result.modifiedCount || ids.length]),
    });
  },

  /**
   * 🔥 新增：获取留言统计信息
   * @param ctx
   */
  async getStats(ctx) {
    const filters = {};

    // 🔥 动态构建统计过滤条件
    if (ctx.query.contentId) {
      filters.contentId = { $eq: ctx.query.contentId };
    }
    if (ctx.query.author) {
      filters.author = { $eq: ctx.query.author };
    }
    if (ctx.query.adminAuthor) {
      filters.adminAuthor = { $eq: ctx.query.adminAuthor };
    }

    const stats = await ctx.service.message.getMessageStats(filters);

    ctx.helper.renderSuccess(ctx, {
      data: stats,
    });
  },

  /**
   * 🔥 新增：审核留言 - 支持 RESTful 路由
   * POST /api/manage/contentMessage/:id/audit 或 POST /api/manage/contentMessage/auditMessage
   * @param ctx
   */
  async auditMessage(ctx) {
    const { messageId, auditStatus, auditReason } = ctx.request.body;

    // 🔥 统一异常处理：管理员身份验证
    if (_.isEmpty(ctx.session.adminUserInfo)) {
      throw RepositoryExceptions.auth.adminLoginRequired();
    }

    // 🔥 支持 RESTful 路由参数
    const id = ctx.params.id || messageId;

    // 🔥 参数验证
    if (!id) {
      throw RepositoryExceptions.message.notFound(id);
    }

    if (!['approved', 'rejected'].includes(auditStatus)) {
      throw RepositoryExceptions.message.invalidAuditStatus(auditStatus);
    }

    if (auditStatus === 'rejected' && (!auditReason || auditReason.trim() === '')) {
      throw RepositoryExceptions.message.auditReasonRequired();
    }

    const auditData = {
      auditStatus,
      auditReason: auditStatus === 'rejected' ? auditReason : null,
      auditBy: ctx.session.adminUserInfo.id,
      auditAt: new Date(),
    };

    const result = await ctx.service.message.update(id, auditData);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: `留言${auditStatus === 'approved' ? '审核通过' : '审核拒绝'}`,
    });
  },

  /**
   * 🔥 新增：批量审核留言
   * @param ctx
   */
  async batchAuditMessages(ctx) {
    const { messageIds, auditStatus, auditReason } = ctx.request.body;

    // 🔥 统一异常处理：管理员身份验证
    if (_.isEmpty(ctx.session.adminUserInfo)) {
      throw RepositoryExceptions.auth.adminLoginRequired();
    }

    // 🔥 参数验证
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      throw RepositoryExceptions.message.emptyBatch();
    }

    if (!['approved', 'rejected'].includes(auditStatus)) {
      throw RepositoryExceptions.message.invalidAuditStatus(auditStatus);
    }

    if (auditStatus === 'rejected' && (!auditReason || auditReason.trim() === '')) {
      throw RepositoryExceptions.message.auditReasonRequired();
    }

    // 🔥 批量大小检查
    if (messageIds.length > 100) {
      throw RepositoryExceptions.message.batchSizeTooLarge(messageIds.length, 100);
    }

    const auditData = {
      auditStatus,
      auditReason: auditStatus === 'rejected' ? auditReason : null,
      auditBy: ctx.session.adminUserInfo.id,
      auditAt: new Date(),
    };

    // 批量更新
    let successCount = 0;
    const errors = [];

    for (const messageId of messageIds) {
      try {
        await ctx.service.message.update(messageId, auditData);
        successCount++;
      } catch (error) {
        errors.push({ messageId, error: error.message });
      }
    }

    ctx.helper.renderSuccess(ctx, {
      data: {
        successCount,
        totalCount: messageIds.length,
        errors,
      },
      message: ctx.__('contentMessage.messages.auditSuccess', [successCount, messageIds.length]),
    });
  },
};

module.exports = ContentMessageController;
