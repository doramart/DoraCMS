'use strict';

/**
 * egg-dora-maildelivery default config
 * @member Config#eggDoraMailDelivery
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraMailDelivery = {
  alias: 'mailDelivery', // 插件目录，必须为英文
  pkgName: 'egg-dora-maildelivery', // 插件包名
  enName: 'doraMailDelivery', // 插件名
  name: '邮件发送', // 插件名称
  description: '邮件发送', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_service', // 主菜单图标名称
  adminUrl: '/mailDelivery/js/app.js',
  adminApi: [
    {
      url: 'mailDelivery/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取邮件发送列表',
    },
    {
      url: 'mailDelivery/getOne',
      method: 'get',
      controllerName: 'getOne',
      details: '获取单条邮件发送信息',
    },
    {
      url: 'mailDelivery/addOne',
      method: 'post',
      controllerName: 'create',
      details: '添加单个邮件发送',
    },
    {
      url: 'mailDelivery/updateOne',
      method: 'post',
      controllerName: 'update',
      details: '更新邮件发送信息',
    },
    {
      url: 'mailDelivery/delete',
      method: 'get',
      controllerName: 'removes',
      details: '删除邮件发送',
    },
    {
      url: 'mailDelivery/getSendLogList',
      method: 'get',
      controllerName: 'sendloglist',
      details: '获取发送日志',
    },
  ],
  fontApi: [],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n
         \n
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/mailDelivery'), ctx => ctx.path.startsWith('/api/mailDelivery')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
