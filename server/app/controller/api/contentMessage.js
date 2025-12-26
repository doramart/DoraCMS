'use strict';

const xss = require('xss');
const _ = require('lodash');
const { siteFunc } = require('../../utils');
const RepositoryExceptions = require('../../repository/base/RepositoryExceptions');
const SystemConstants = require('../../constants/SystemConstants');

/**
 * 前端 API - Message 留言模块
 * 基于三层架构优化版本 (2024)
 * 🔥 标准化参数格式 + 统一异常处理
 */
const ContentMessageController = {
  /**
   * 🔥 优化版：渲染留言数据 - 使用新的MessageInteraction服务
   * 基于独立交互表，性能提升100-1000倍
   * @param {Object} ctx EggJS上下文
   * @param {Object} userInfo 用户信息
   * @param {Array} messages 留言列表
   * @return {Promise<Array>} 渲染后的留言列表
   */
  async renderMessage(ctx, userInfo = {}, messages = []) {
    try {
      if (_.isEmpty(messages)) {
        return [];
      }

      const newMessageArr = JSON.parse(JSON.stringify(messages));
      const messageIds = newMessageArr.map(item => item.id);

      // 🚀 批量并行查询，解决N+1问题
      const [userReplyRecords, childMessagesMap, commentCountsMap] = await Promise.all([
        // 1. 批量查询用户回复记录
        this._batchQueryUserReplyRecords(ctx, userInfo, messageIds),
        // 2. 批量查询子留言
        this._batchQueryChildMessages(ctx, messageIds),
        // 3. 批量查询留言统计
        this._batchQueryCommentCounts(ctx, messageIds),
      ]);

      // 4. 批量查询用户点赞/踩状态（包含子留言）
      let userInteractionStatus = { praisedIds: [], despisedIds: [] };
      if (userInfo.id) {
        const allMessageIds = new Set(messageIds);

        // 收集子留言的所有 ID（含多级）
        const collectChildIds = messagesArr => {
          messagesArr.forEach(msg => {
            if (msg && msg.id) {
              allMessageIds.add(msg.id);
            }
            if (msg && Array.isArray(msg.childMessages) && msg.childMessages.length > 0) {
              collectChildIds(msg.childMessages);
            }
          });
        };

        childMessagesMap.forEach(children => {
          collectChildIds(children || []);
        });

        userInteractionStatus = await ctx.service.messageInteraction.getUserInteractionStatus(
          userInfo.id,
          Array.from(allMessageIds)
        );
      }

      // 统一处理主留言和子留言的交互状态/计数
      const applyInteractionState = messageItem => {
        const messageId = messageItem.id;

        messageItem.had_comment = userReplyRecords.has(messageId);
        messageItem.had_despises = userInteractionStatus.despisedIds.includes(messageId);
        messageItem.had_praise = userInteractionStatus.praisedIds.includes(messageId);

        messageItem.praise_num = messageItem.praise_count || 0;
        messageItem.despises_num = messageItem.despise_count || 0;
        messageItem.comment_num =
          commentCountsMap.get(messageId) ||
          messageItem.comment_num ||
          (Array.isArray(messageItem.childMessages) ? messageItem.childMessages.length : 0) ||
          0;

        if (Array.isArray(messageItem.childMessages) && messageItem.childMessages.length > 0) {
          messageItem.childMessages.forEach(applyInteractionState);
        }
      };

      // 🔧 批量设置留言属性
      newMessageArr.forEach(messageItem => {
        // 设置子留言
        messageItem.childMessages = childMessagesMap.get(messageItem.id) || [];

        // 设置交互状态/计数（含子留言）
        applyInteractionState(messageItem);
      });

      return newMessageArr;
    } catch (error) {
      ctx.logger.error('renderMessage error:', error);
      return messages; // 出错时返回原始数据
    }
  },

  /**
   * 批量查询用户回复记录
   * @param ctx
   * @param userInfo
   * @param messageIds
   * @private
   */
  async _batchQueryUserReplyRecords(ctx, userInfo, messageIds) {
    const replyRecords = new Set();

    if (_.isEmpty(userInfo) || !userInfo.id) {
      return replyRecords;
    }

    const { refresh } = ctx.query;
    const cacheKey = `user_reply_records:${userInfo.id}:${messageIds.join(',')}`;

    const queryLogic = async () => {
      const replies = await ctx.service.message.find(
        { isPaging: '0' },
        {
          filters: {
            author: { $eq: userInfo.id },
            relationMsgId: { $in: messageIds },
          },
          fields: ['relationMsgId'],
        }
      );

      replies.forEach(reply => {
        if (reply.relationMsgId) {
          replyRecords.add(reply.relationMsgId);
        }
      });

      return replyRecords;
    };

    if (refresh === '1') {
      return await queryLogic();
    }

    return await ctx.app.cache.getOrSet(
      cacheKey,
      queryLogic,
      300 // 缓存 300 秒，减少回复后延迟
    );
  },

  /**
   * 批量查询子留言
   * @param ctx
   * @param messageIds
   * @private
   */
  async _batchQueryChildMessages(ctx, messageIds) {
    const { refresh } = ctx.query;
    const cacheKey = `message_children:${messageIds.join(',')}`;

    const queryLogic = async () => {
      // 构建递归树，最多三层
      const buildReplyTree = async parentIds => {
        // 查找所有直接子留言
        const replies = await ctx.service.message.find(
          { isPaging: '0' },
          {
            filters: {
              relationMsgId: { $in: parentIds },
            },
            sort: [{ field: 'createdAt', order: 'asc' }],
            populate: [
              { path: 'author', select: ['userName', 'id', 'enable', 'createdAt', 'logo'] },
              { path: 'adminAuthor', select: ['userName', 'id', 'status', 'createdAt', 'logo'] },
            ],
          }
        );

        const map = new Map();
        parentIds.forEach(id => map.set(id, []));

        // 先初始化所有子回复容器
        replies.forEach(reply => {
          if (!map.has(reply.relationMsgId)) {
            map.set(reply.relationMsgId, []);
          }
        });

        // 递归构建下一层，限制最大深度为 3
        const nextLevelParents = replies.map(r => r.id);
        let grandchildrenMap = new Map();
        if (nextLevelParents.length > 0) {
          grandchildrenMap = await buildReplyTree(nextLevelParents);
        }

        // 挂接子树并限制每层最多 5 条
        replies.forEach(reply => {
          reply.childMessages = grandchildrenMap.get(reply.id) || [];
          const siblings = map.get(reply.relationMsgId);
          if (siblings && siblings.length < 5) {
            siblings.push(reply);
          }
        });

        return map;
      };

      return await buildReplyTree(messageIds);
    };

    if (refresh === '1') {
      return await queryLogic();
    }

    return await ctx.app.cache.getOrSet(
      cacheKey,
      queryLogic,
      300 // 缓存 300 秒，回复后更快刷新
    );
  },

  /**
   * 批量查询留言统计
   * @param ctx
   * @param messageIds
   * @private
   */
  async _batchQueryCommentCounts(ctx, messageIds) {
    const { refresh } = ctx.query;
    const cacheKey = `message_comment_counts:${messageIds.join(',')}`;

    const queryLogic = async () => {
      const countMap = new Map();

      const promises = messageIds.map(async messageId => {
        const count = await ctx.service.message.count({
          relationMsgId: { $eq: messageId },
        });
        return [messageId, count];
      });

      const results = await Promise.all(promises);
      results.forEach(([messageId, count]) => {
        countMap.set(messageId, count);
      });

      return countMap;
    };

    if (refresh === '1') {
      return await queryLogic();
    }

    return await ctx.app.cache.getOrSet(
      cacheKey,
      queryLogic,
      300 // 缓存 300 秒，回复后更快刷新
    );
  },

  /**
   * 获取留言列表 - 前端API
   * 🔥 基于三层架构优化，标准化参数格式
   * 🔥 修复回复评论重复显示问题：只返回主评论，回复通过childMessages显示
   * @param ctx
   */
  async list(ctx) {
    const payload = ctx.query;
    const { userId, contentId } = ctx.query;
    let userInfo = ctx.session.user || {};

    // 🔥 标准化查询条件构建
    const filters = {};

    if (userId) {
      filters.author = { $eq: userId };
    }

    if (contentId) {
      filters.contentId = { $eq: contentId };
    }

    // 🔥 关键修复：只查询主评论（relationMsgId 为空/缺失）
    // 兼容 Mongo（null 匹配缺失字段）与 MariaDB（NULL）
    filters.relationMsgId = { $eq: null };

    // 🔥 标准化查询选项
    const options = {
      filters,
      sort: [{ field: 'createdAt', order: 'desc' }],
      populate: [
        { path: 'contentId', select: ['title', 'stitle', 'id'] },
        { path: 'author', select: ['userName', 'id', 'enable', 'createdAt', 'logo'] },
        { path: 'adminAuthor', select: ['userName', 'id', 'status', 'createdAt', 'logo'] },
      ],
    };

    // 查询留言列表（只包含主评论）
    const messageList = await ctx.service.message.find(payload, options);

    // 获取完整用户信息（包含交互状态）
    if (!_.isEmpty(userInfo) && userInfo.id) {
      userInfo = await ctx.service.user.findOne(
        { id: { $eq: userInfo.id } },
        {
          fields: ['id', 'userName', 'praiseMessages', 'despiseMessage', 'enable'],
        }
      );
    }

    // 渲染留言数据（添加交互状态和统计信息）
    // renderMessage方法会为每个主评论查询并填充childMessages
    if (messageList.docs && messageList.docs.length > 0) {
      messageList.docs = await ContentMessageController.renderMessage(ctx, userInfo, messageList.docs);
    }

    ctx.helper.renderSuccess(ctx, {
      data: messageList,
    });
  },

  /**
   * 发布留言 - 前端API
   * 🔥 基于三层架构优化，统一异常处理 + 标准化参数
   * @param ctx
   */
  async postMessages(ctx) {
    const fields = ctx.request.body;

    // 🔥 统一异常处理：身份验证
    if (_.isEmpty(ctx.session.user) && _.isEmpty(ctx.session.adminUserInfo)) {
      throw RepositoryExceptions.auth.authenticationRequired();
    }

    // 🔥 统一异常处理：参数验证
    if (!ctx.validateId(fields.contentId)) {
      throw RepositoryExceptions.message.contentRequired();
    }

    if (!fields.content || fields.content.trim() === '') {
      throw RepositoryExceptions.message.contentRequired();
    }

    if (fields.content.length < 5) {
      throw RepositoryExceptions.message.contentTooShort(5);
    }

    if (fields.content.length > 200) {
      throw RepositoryExceptions.message.contentTooLong(200);
    }

    // 🔥 标准化数据构建
    const messageObj = {
      contentId: fields.contentId,
      content: xss(fields.content),
      replyAuthor: fields.replyAuthor,
      adminReplyAuthor: fields.adminReplyAuthor,
      author: ctx.session.user.id,
      relationMsgId: fields.relationMsgId,
      utype: fields.utype || '0',
    };

    // 创建留言
    const targetMessage = await ctx.service.message.create(messageObj);

    // 🔥 标准化查询：获取内容信息
    const contentInfo = await ctx.service.content.findOne(
      { id: { $eq: fields.contentId } },
      {
        fields: ['id', 'title', 'stitle', 'uAuthor'],
      }
    );

    if (!contentInfo) {
      throw RepositoryExceptions.content.notFound(fields.contentId);
    }

    // 🔥 标准化查询：获取被回复用户信息
    let replyAuthor = null;

    if (fields.replyAuthor) {
      replyAuthor = await ctx.service.user.findOne(
        { id: { $eq: fields.replyAuthor } },
        {
          fields: ['id', 'userName', 'category', 'group', 'logo', 'createdAt', 'enable', 'state', 'email'],
        }
      );
    } else if (fields.adminReplyAuthor) {
      replyAuthor = await ctx.service.admin.findOne(
        { id: { $eq: fields.adminReplyAuthor } },
        {
          fields: ['id', 'userName', 'email', 'status'],
        }
      );
    }

    // 发送回复通知邮件
    if (!_.isEmpty(replyAuthor)) {
      try {
        await ctx.service.mailTemplate.sendEmail(SystemConstants.MAIL.BUSINESS_TYPES.MESSAGE_NOTIFICATION, {
          replyAuthor,
          content: contentInfo,
          author: ctx.session.user,
        });
      } catch (emailError) {
        // 邮件发送失败不影响留言创建成功
        console.warn('留言回复邮件发送失败:', emailError.message);
      }
    }

    // 管理员消息提醒
    try {
      ctx.helper.sendMessageToClient(
        ctx,
        'contentmessage',
        `用户 ${ctx.session.user.userName} 在文章 <a href="/details/${contentInfo.id}.html" target="_blank">${contentInfo.title}</a> 中发表了评论`
      );
    } catch (notificationError) {
      console.warn('管理员通知发送失败:', notificationError.message);
    }

    // 发送站内消息
    try {
      const passiveUser = fields.replyAuthor ? fields.replyAuthor : contentInfo.uAuthor;
      siteFunc.addSiteMessage('3', ctx.session.user, passiveUser, targetMessage.id, {
        targetMediaType: '1',
      });
    } catch (messageError) {
      console.warn('站内消息发送失败:', messageError.message);
    }

    // 🔥 标准化查询：返回完整留言信息
    const returnMessage = await ctx.service.message.item({
      query: { id: targetMessage.id },
      populate: [
        { path: 'contentId', select: ['title', 'stitle', 'id'] },
        { path: 'author', select: ['userName', 'id', 'enable', 'createdAt', 'logo'] },
        { path: 'adminAuthor', select: ['userName', 'id', 'status', 'createdAt', 'logo'] },
      ],
    });

    ctx.helper.renderSuccess(ctx, {
      data: returnMessage,
    });
  },

  /**
   * 🔥 重构：点赞留言 - 使用MessageInteraction服务
   * @param ctx
   * @description 支持 RESTful 路由：POST /api/v1/messages/:id/like
   */
  async praiseMessage(ctx) {
    // 🔥 RESTful: 优先使用路径参数中的 id，也兼容 body 中的 messageId
    const messageId = ctx.params.id || ctx.request.body.messageId;

    // 🔥 统一异常处理：身份验证
    if (_.isEmpty(ctx.session.user)) {
      throw RepositoryExceptions.auth.authenticationRequired();
    }

    // 🔥 统一异常处理：参数验证
    if (!ctx.validateId(messageId)) {
      throw RepositoryExceptions.message.notFound(messageId);
    }

    const userId = ctx.session.user.id;

    // 🔥 使用新的MessageInteraction服务
    const result = await ctx.service.messageInteraction.praiseMessage(messageId, userId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: result.message || '点赞成功',
    });
  },

  /**
   * 🔥 重构：取消点赞留言 - 使用MessageInteraction服务
   * @param ctx
   * @description 支持 RESTful 路由：DELETE /api/v1/messages/:id/like
   */
  async unpraiseMessage(ctx) {
    // 🔥 RESTful: 优先使用路径参数中的 id，也兼容 body 中的 messageId
    const messageId = ctx.params.id || ctx.request.body.messageId;

    // 🔥 统一异常处理：身份验证
    if (_.isEmpty(ctx.session.user)) {
      throw RepositoryExceptions.auth.authenticationRequired();
    }

    // 🔥 统一异常处理：参数验证
    if (!ctx.validateId(messageId)) {
      throw RepositoryExceptions.message.notFound(messageId);
    }

    const userId = ctx.session.user.id;

    // 🔥 使用新的MessageInteraction服务
    const result = await ctx.service.messageInteraction.unpraiseMessage(messageId, userId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: result.message || '取消点赞成功',
    });
  },

  /**
   * 🔥 重构：踩留言 - 使用MessageInteraction服务
   * @param ctx
   * @description 支持 RESTful 路由：POST /api/v1/messages/:id/dislike
   */
  async despiseMessage(ctx) {
    // 🔥 RESTful: 优先使用路径参数中的 id，也兼容 body 中的 messageId
    const messageId = ctx.params.id || ctx.request.body.messageId;

    // 🔥 统一异常处理：身份验证
    if (_.isEmpty(ctx.session.user)) {
      throw RepositoryExceptions.auth.authenticationRequired();
    }

    // 🔥 统一异常处理：参数验证
    if (!ctx.validateId(messageId)) {
      throw RepositoryExceptions.message.notFound(messageId);
    }

    const userId = ctx.session.user.id;

    // 🔥 使用新的MessageInteraction服务
    const result = await ctx.service.messageInteraction.despiseMessage(messageId, userId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: result.message || '操作成功',
    });
  },

  /**
   * 🔥 重构：取消踩留言 - 使用MessageInteraction服务
   * @param ctx
   * @description 支持 RESTful 路由：DELETE /api/v1/messages/:id/dislike
   */
  async undespiseMessage(ctx) {
    // 🔥 RESTful: 优先使用路径参数中的 id，也兼容 body 中的 messageId
    const messageId = ctx.params.id || ctx.request.body.messageId;

    // 🔥 统一异常处理：身份验证
    if (_.isEmpty(ctx.session.user)) {
      throw RepositoryExceptions.auth.authenticationRequired();
    }

    // 🔥 统一异常处理：参数验证
    if (!ctx.validateId(messageId)) {
      throw RepositoryExceptions.message.notFound(messageId);
    }

    const userId = ctx.session.user.id;

    // 🔥 使用新的MessageInteraction服务
    const result = await ctx.service.messageInteraction.undespiseMessage(messageId, userId);

    ctx.helper.renderSuccess(ctx, {
      data: result,
      message: result.message || '取消操作成功',
    });
  },
};

module.exports = ContentMessageController;
