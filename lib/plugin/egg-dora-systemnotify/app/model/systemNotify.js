/**
 * Created by Administrator on 2015/4/15.
 * 文章标签对象
 */
'use strict';
module.exports = (app) => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  const SystemNotifySchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    user: {
      type: String,
      ref: 'User',
    }, // 用户消息所属者
    systemUser: {
      type: String,
      ref: 'AdminUser',
    }, // 用户消息所属者
    notify: {
      type: String,
      ref: 'Announce',
    }, // 关联的Notify
    date: {
      type: Date,
      default: Date.now,
    },
  });

  SystemNotifySchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  SystemNotifySchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  SystemNotifySchema.path('date').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  SystemNotifySchema.index({
    date: -1,
  });

  return mongoose.model('SystemNotify', SystemNotifySchema, 'systemnotifies');
};
