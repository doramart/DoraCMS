/**
 * Created by Administrator on 2015/4/15.
 * 系统资源
 */
'use strict';
module.exports = (app) => {
  const mongoose = app.mongoose;
  const shortid = require('shortid');
  const Schema = mongoose.Schema;

  const AdminResourceSchema = new Schema({
    _id: {
      type: String,
      default: shortid.generate,
    },
    label: String,
    type: String, // 0为普通菜单 1为功能菜单
    routePath: String, // 路由路径
    icon: String, // icon图标样式
    componentPath: String, // 模板路径
    api: String, // 资源路径
    parentId: String,
    isExt: {
      // 是否由插件安装而来
      type: Boolean,
      default: false,
    },
    enable: {
      // 是否可见
      type: Boolean,
      default: true,
    },
    sortId: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    comments: String,
  });

  return mongoose.model('AdminResource', AdminResourceSchema, 'adminresources');
};
