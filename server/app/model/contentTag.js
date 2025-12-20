/**
 * Created by Administrator on 2015/4/15.
 * 文章标签对象
 */
'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  const ContentTagSchema = new Schema({
    _id: {
      type: String,

      default: shortid.generate,
    },
    name: String,
    alias: String, // 别名
    createdAt: {
      type: Date,
      default: Date.now,
    }, // 创建时间
    updatedAt: {
      type: Date,
      default: Date.now,
    }, // 更新时间
    comments: String,
  });

  ContentTagSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  ContentTagSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  ContentTagSchema.path('createdAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  ContentTagSchema.path('updatedAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  ContentTagSchema.virtual('url').get(function () {
    return `/tag/${this.name}`;
  });

  return mongoose.model('ContentTag', ContentTagSchema, 'content_tags');
};
