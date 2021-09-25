'use strict';
module.exports = (app) => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const path = require('path');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  const MailTemplateSchema = new Schema({
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
    comment: String, // 备注
    title: String, // 标题
    subTitle: String, // 概要
    content: String, // 内容
    type: String, // 模板类型
  });

  MailTemplateSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  MailTemplateSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  MailTemplateSchema.path('createTime').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });
  MailTemplateSchema.path('updateTime').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('MailTemplate', MailTemplateSchema, 'mailtemplates');
};
