/*
 * @Author: doramart
 * @Date: 2019-08-14 17:20:30
 * @Last Modified by: doramart
 * @Last Modified time: 2025-05-30 09:45:09
 */
'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  const ContentCategorySchema = new Schema({
    _id: {
      type: String,

      default: shortid.generate,
    },
    uid: {
      type: Number,
      default: 0,
    },
    name: String,
    keywords: String,
    type: {
      type: String,
      default: '1',
    }, // 类别类型默认1,2单页面
    sortId: {
      type: Number,
      default: 1,
    }, // 排序 正整数
    parentId: {
      type: String,
      default: '0',
    },
    enable: {
      type: Boolean,
      default: true,
    }, // 是否公开 默认公开
    createdAt: {
      type: Date,
      default: Date.now,
    }, // 创建时间

    updatedAt: {
      type: Date,

      default: Date.now,
    }, // 更新时间
    contentTemp: {
      type: String,
      // ref: 'TemplateItems',
    }, // 内容模板（旧版兼容）

    // 🔥 新的主题配置字段 - JSON存储，灵活配置
    themeConfig: {
      type: Schema.Types.Mixed,
      default: null,
    }, // 主题配置信息
    defaultUrl: {
      type: String,
      default: '',
    }, // seo link
    homePage: {
      type: String,
      default: 'ui',
    }, // 必须唯一
    sortPath: {
      type: String,
      default: '0',
    }, // 存储所有父节点结构
    comments: String,
    // 分类图标
    icon: {
      type: String,
      default: '',
    },
    sImg: {
      type: String,
    },
  });

  ContentCategorySchema.index({
    creator: 1,
  }); // 添加索引

  ContentCategorySchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  ContentCategorySchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  ContentCategorySchema.path('createdAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  ContentCategorySchema.path('updatedAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  ContentCategorySchema.virtual('url').get(function () {
    return `/${this.defaultUrl}___${this.id}`;
  });

  return mongoose.model('ContentCategory', ContentCategorySchema, 'content_categories');
};
