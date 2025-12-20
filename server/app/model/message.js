/**
 * Created by Administrator on 2015/4/15.
 * 留言管理
 */
'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  const MessageSchema = new Schema({
    _id: {
      type: String,

      default: shortid.generate,
    },
    contentId: {
      type: String,
      ref: 'Content',
    }, // 留言对应的内容ID
    contentTitle: String, // 留言对应的内容标题
    author: {
      type: String,
      ref: 'User',
    }, // 留言者ID
    adminAuthor: {
      type: String,
      ref: 'Admin',
    }, // 管理员ID
    replyAuthor: {
      type: String,
      ref: 'User',
    }, // 被回复者ID
    adminReplyAuthor: {
      type: String,
      ref: 'Admin',
    }, // 被回复者ID
    state: {
      type: Boolean,
      default: false,
    }, // 是否被举报
    utype: {
      type: String,
      default: '0',
    }, // 评论者类型 0,普通用户，1,管理员
    relationMsgId: String, // 关联的留言Id
    createdAt: {
      type: Date,
      default: Date.now,
    }, // 创建时间
    updatedAt: {
      type: Date,
      default: Date.now,
    }, // 更新时间
    // 🔥 新增：审核相关字段
    auditStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    }, // 审核状态
    auditReason: String, // 审核拒绝原因
    auditBy: {
      type: String,
      ref: 'Admin',
    }, // 审核人ID
    auditAt: Date, // 审核时间
    // 🔥 新增：回复统计
    replyCount: {
      type: Number,
      default: 0,
    }, // 回复数量
    // 🔥 新增：IP地址记录
    ipAddress: String, // 发布者IP地址
    // 🔥 新增：用户代理
    userAgent: String, // 用户代理信息
    content: {
      type: String,
      default: '输入评论内容...',
    }, // 留言内容
    // 🔥 新增：冗余计数字段（性能优化）
    praise_count: {
      type: Number,
      default: 0,
    }, // 点赞数
    despise_count: {
      type: Number,
      default: 0,
    }, // 踩数
  });

  MessageSchema.index({
    contentId: 1,
  }); // 添加索引

  MessageSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  MessageSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  MessageSchema.path('createdAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  MessageSchema.path('updatedAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('Message', MessageSchema, 'messages');
};
