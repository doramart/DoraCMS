/**
 * MessageInteraction Model - 留言交互记录模型
 * 用于存储点赞、踩等交互行为
 * Created: 2024-12-08
 */
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  const MessageInteractionSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
    }, // 用户ID
    messageId: {
      type: String,
      ref: 'Message',
      required: true,
    }, // 留言ID
    interactionType: {
      type: String,
      enum: ['praise', 'despise'],
      required: true,
    }, // 交互类型：praise-点赞，despise-踩
    createdAt: {
      type: Date,
      default: Date.now,
    }, // 创建时间
    ipAddress: String, // IP地址
    userAgent: String, // 用户代理信息
  });

  // 🔥 复合唯一索引：确保用户对同一留言的同一类型交互只能有一条记录
  MessageInteractionSchema.index(
    {
      userId: 1,
      messageId: 1,
      interactionType: 1,
    },
    { unique: true }
  );

  // 🔥 查询优化索引：按留言ID和交互类型查询（统计点赞数/踩数）
  MessageInteractionSchema.index({
    messageId: 1,
    interactionType: 1,
  });

  // 🔥 查询优化索引：按用户ID和创建时间查询（用户交互历史）
  MessageInteractionSchema.index({
    userId: 1,
    createdAt: -1,
  });

  MessageInteractionSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });

  MessageInteractionSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  MessageInteractionSchema.path('createdAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  // 🔥 静态方法：检查用户是否已交互
  MessageInteractionSchema.statics.hasInteraction = async function (userId, messageId, interactionType) {
    const count = await this.countDocuments({ userId, messageId, interactionType });
    return count > 0;
  };

  // 🔥 静态方法：获取留言的交互统计
  MessageInteractionSchema.statics.getInteractionStats = async function (messageId) {
    const praiseCount = await this.countDocuments({ messageId, interactionType: 'praise' });
    const despiseCount = await this.countDocuments({ messageId, interactionType: 'despise' });
    return { praiseCount, despiseCount };
  };

  // 🔥 静态方法：批量获取用户的交互状态
  MessageInteractionSchema.statics.getUserInteractionStatus = async function (userId, messageIds, interactionType) {
    const interactions = await this.find(
      {
        userId,
        messageId: { $in: messageIds },
        interactionType,
      },
      { messageId: 1 }
    );
    return interactions.map(item => item.messageId);
  };

  return mongoose.model('MessageInteraction', MessageInteractionSchema, 'message_interactions');
};
