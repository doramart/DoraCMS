'use strict';
module.exports = (app) => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  const SendLogSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    createTime: {
      // 发送时间
      type: Date,
    },
    recipientEmail: [
      {
        type: String,
      },
    ], // 接收者邮箱
    recipient: [
      {
        type: String,
        ref: 'User',
      },
    ], // 接收者
    taskId: {
      type: String,
      ref: 'MailDelivery',
    }, // 任务id
    state: {
      type: String,
      default: '0', // 0：发送失败  1：发送成功
    }, // 状态
  });

  SendLogSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  SendLogSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  SendLogSchema.path('createTime').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('SendLog', SendLogSchema, 'sendlogs');
};
