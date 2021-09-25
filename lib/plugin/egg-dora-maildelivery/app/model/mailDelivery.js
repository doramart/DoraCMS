'use strict';
module.exports = (app) => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const path = require('path');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  const MailDeliverySchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    createTime: {
      type: Date,
    },
    updateTime: {
      type: Date,
    },
    sender: {
      type: String,
      ref: 'AdminUser',
    }, // 创建者
    emailType: {
      type: String,
      ref: 'MailTemplate',
    }, // 邮件类型
    state: {
      type: String,
      default: '0', // 0：待发送 1：未完成  2：发送成功
    }, // 状态
    timing: {
      type: Date,
    }, // 定时
    comments: String, // 备注
    content: String, // 邮件内容
    type: {
      type: String,
      default: '0',
    }, // 任务类型  0:立即，1：定时
    targetType: {
      type: String, // 发送对象类型 0:全部 1:指定
    },
    targets: [
      {
        type: String,
        ref: 'User',
      },
    ], // 发送目标
  });

  MailDeliverySchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  MailDeliverySchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  MailDeliverySchema.path('timing').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });
  MailDeliverySchema.path('createTime').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });
  MailDeliverySchema.path('updateTime').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('MailDelivery', MailDeliverySchema, 'maildeliverys');
};
