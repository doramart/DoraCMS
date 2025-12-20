/**
 * Created by Administrator on 2015/4/15.
 * 广告管理,广告单元
 */
'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const moment = require('moment');
  const Schema = mongoose.Schema;

  const AdsItemsSchema = new Schema({
    _id: {
      type: String,

      default: shortid.generate,
    },

    title: String,
    link: String, // 广告链接
    appLink: String, // app广告链接
    appLinkType: String, // app跳转类别 0文章，
    width: Number,
    height: {
      type: Number,
      default: 1,
    },
    target: {
      type: String,
      default: '_blank',
    },
    sImg: String, // 图片路径
    createdAt: {
      type: Date,
      default: Date.now,
    }, // 创建时间

    updatedAt: {
      type: Date,

      default: Date.now,
    }, // 更新时间
    alt: String, // 广告alt标识
  });

  AdsItemsSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  AdsItemsSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  AdsItemsSchema.path('createdAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });
  AdsItemsSchema.path('updatedAt').get(function (v) {
    return v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '';
  });

  return mongoose.model('AdsItems', AdsItemsSchema, 'ads_items');
};
