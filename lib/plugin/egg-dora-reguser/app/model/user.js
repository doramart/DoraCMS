'use strict';
module.exports = (app) => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const shortid = require('shortid');
  const moment = require('moment');
  const CryptoJS = require('crypto-js');

  const UserSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    enable: {
      type: Boolean,
      default: true,
    }, // 用户是否有效
    name: String,
    userName: String,
    password: {
      type: String,
      set(val) {
        return CryptoJS.AES.encrypt(val, app.config.encrypt_key).toString();
      },
    },
    email: String,
    qq: Number,
    phoneNum: String,
    countryCode: {
      type: String,
    }, // 手机号前国家代码
    idNo: Number,
    idType: {
      type: String,
      default: '1',
    }, // 证件类型 1为身份证
    comments: {
      type: String,
      default: '',
    },
    introduction: {
      type: String,
      default: '',
    }, // 个人简介
    position: String, // 职位
    profession: String, // 职业
    industry: String, // 行业
    experience: String, // 教育经历
    company: String, // 大学或公司
    website: String, // 个人站点
    date: {
      type: Date,
      default: Date.now,
    },
    logo: {
      type: String,
      default: '/static/upload/images/defaultlogo.png',
    },
    group: {
      type: String,
      default: '0',
    }, // 0 普通用户
    province: String, // 所在省份
    city: String, // 所在城市
    birth: {
      type: Date,
      default: new Date('1770-01-01'),
    }, // 出生年月日 2018-03-21
    gender: {
      type: String,
      default: '0',
    }, // 性别 0男 1女
    despises: [
      {
        type: String,
        ref: 'Content',
      },
    ], // 文章或帖子
    despiseMessage: [
      {
        type: String,
        ref: 'Message',
      },
    ], // 评论

    favorites: [
      {
        type: String,
        ref: 'Content',
      },
    ], // 收藏文章或帖子

    praiseContents: [
      {
        type: String,
        ref: 'Content',
      },
    ], // 点赞的文章或帖子
    praiseMessages: [
      {
        type: String,
        ref: 'Message',
      },
    ], // 点赞的评论
    state: {
      type: String,
      default: '1', // 1正常，0删除
    },
    // category: {
    //   type: String,
    //   ref: 'ContentCategory'
    // }, // 文章类别
    followers: [
      {
        type: String,
        ref: 'User',
      },
    ], // 关注我的创作者
    watchers: [
      {
        type: String,
        ref: 'User',
      },
    ], // 我关注的创作者

    watchTags: [
      {
        type: String,
        ref: 'ContentTag',
      },
    ], // 我关注的标签
    retrieve_time: {
      type: Number,
    }, // 用户发送激活请求的时间
    loginActive: {
      type: Boolean,
      default: false,
    }, // 首次登录
    deviceId: String, // 针对游客的设备id
  });

  UserSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  UserSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  UserSchema.path('date').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  UserSchema.path('birth').get(function (v) {
    return moment(v).format('YYYY-MM-DD');
  });

  return mongoose.model('User', UserSchema, 'users');
};
