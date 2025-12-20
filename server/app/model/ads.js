/**
 * Created by Administrator on 2017/4/15.
 * 广告管理
 */
'use strict';
module.exports = app => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  const moment = require('moment');

  require('./adsItems');
  const AdsSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    name: String,
    type: {
      type: String,
      default: '0',
    }, // 展示形式 0文字 1图片 2友情链接
    carousel: {
      type: Boolean,
      default: true,
    }, // 针对图片是否轮播
    state: {
      type: Boolean,
      default: true,
    }, // 广告状态，是否显示
    height: {
      type: Number,
      default: 50,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }, // 创建时间

    updatedAt: {
      type: Date,

      default: Date.now,
    }, // 更新时间
    items: [
      {
        type: String,
        ref: 'AdsItems',
      },
    ], // 广告列表id
    comments: String, // 描述
  });

  AdsSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  AdsSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  AdsSchema.path('createdAt').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('Ads', AdsSchema, 'ads');
};
