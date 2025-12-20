/**
 * ContentInteraction - 文章交互 模型
 * 记录用户对文章的点赞、收藏、踩等行为
 */
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ContentInteractionSchema = new Schema({
    _id: {
      type: String,
      default: require('shortid').generate,
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    contentId: {
      type: String,
      ref: 'Content',
      required: true,
    },
    interactionType: {
      type: String,
      enum: ['praise', 'favorite', 'despise'], // 点赞, 收藏, 踩
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String, // IP地址
    userAgent: String, // 用户代理
  });

  // 唯一索引：确保用户对同一文章的同一类型交互只能有一条记录
  ContentInteractionSchema.index({ userId: 1, contentId: 1, interactionType: 1 }, { unique: true });
  // 加速查询统计
  ContentInteractionSchema.index({ contentId: 1, interactionType: 1 });
  // 加速用户交互历史查询
  ContentInteractionSchema.index({ userId: 1, createdAt: -1 });

  return mongoose.model('ContentInteraction', ContentInteractionSchema, 'content_interactions');
};
