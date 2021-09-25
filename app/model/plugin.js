/*
 * @Author: doramart
 * @Date: 2019-09-23 13:28:28
 * @Last Modified by: doramart
 * @Last Modified time: 2021-04-17 21:42:14
 */
'use strict';
module.exports = (app) => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;
  const moment = require('moment');
  require('./adminUser');

  const PluginSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    pluginId: String, // 来自插件源id
    alias: String, // 插件别名
    pkgName: String, // 包名
    name: String, // 插件名称
    enName: String, // 插件英文名
    description: String, // 插件描述
    state: {
      type: Boolean,
      default: false,
    }, // 是否启用
    amount: {
      type: Number,
      default: 0,
    }, // 价格
    isadm: {
      type: String,
      default: '1',
    }, // 有后管
    isindex: {
      type: String,
      default: '0',
    }, // 有前台
    version: String, // 版本号
    operationInstructions: String, // 操作说明
    author: String, // 作者
    adminUrl: {
      type: Schema.Types.Mixed,
    }, // 后台插件地址
    iconName: String, // 主菜单图标名称
    adminApi: {
      type: Schema.Types.Mixed,
    }, // 后台插件地址
    fontApi: {
      type: Schema.Types.Mixed,
    }, // 后台插件地址
    authUser: {
      type: Boolean, // 是否鉴权用户
      default: false,
    },
    initDataPath: String, // 初始化表路径
    hooks: [
      {
        type: String,
      },
    ], // 钩子
    defaultConfig: String, // 插入到 config.default.js 中的配置
    pluginsConfig: String, // 插入到 plugins.js 中的配置
    type: {
      type: String, // 插件类型
      default: '1',
    },
    installor: {
      type: String,
      ref: 'AdminUser', // 安装者
    },
    createTime: {
      type: Date,
      default: Date.now,
    },
    updateTime: {
      type: Date,
      default: Date.now,
    },
  });

  PluginSchema.set('toJSON', {
    getters: true,
    virtuals: true,
  });
  PluginSchema.set('toObject', {
    getters: true,
    virtuals: true,
  });

  PluginSchema.path('createTime').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });
  PluginSchema.path('updateTime').get(function (v) {
    return moment(v).format('YYYY-MM-DD HH:mm:ss');
  });

  return mongoose.model('Plugin', PluginSchema, 'plugins');
};
