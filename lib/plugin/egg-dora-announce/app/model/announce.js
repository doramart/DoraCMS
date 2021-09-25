/**
 * Created by Administrator on 2015/4/15.
 * 文章标签对象
 */
'use strict';
module.exports = (app) => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  // require('./user');
  // require('./adminUser');
  // require('./content');
  const moment = require('moment');

  const AnnounceSchema = new Schema({
    _id: {
      type: String,

      default: shortid.generate,
    },
    title: {
      type: String,
    }, // 消息的标题
    content: {
      type: String,
    }, // 消息的内容
    type: {
      type: String,
      enum: ['1', '2', '3'],
    }, // 消息的类型，1: 公告 Announce，2: 提醒 Remind，3：信息 Message
    target: {
      type: String,
      ref: 'Content',
    }, // 目标的ID
    targetType: {
      type: String,
    }, // 目标的类型
    action: {
      type: String,
    }, // 提醒信息的动作类型
    sender: {
      type: String,
      ref: 'User',
    }, // 发送者的ID
    adminSender: {
      type: String,
      ref: 'AdminUser',
    }, // 发送者的ID
    systemSender: {
      type: String,
    }, // 系统消息发送者
    date: {
      type: Date,
      default: Date.now,
    },
  });

  AnnounceSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  AnnounceSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  AnnounceSchema.path('date').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('Announce', AnnounceSchema, 'announces');
};
