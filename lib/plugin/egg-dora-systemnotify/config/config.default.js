'use strict';

/**
 * egg-dora-systemnotify default config
 * @member Config#eggDoraSystemNotify
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraSystemNotify = {
  alias: 'systemNotify', // 插件目录，必须为英文
  pkgName: 'egg-dora-systemnotify', // 插件包名
  enName: 'doraSystemNotify', // 插件名
  name: '系统消息', // 插件名称
  description: '系统消息', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_system_notic', // 主菜单图标名称
  adminUrl: '/systemNotify/js/app.js',
  adminApi: [
    {
      url: 'systemNotify/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取系统消息列表',
    },
    {
      url: 'systemNotify/setHasRead',
      method: 'get',
      controllerName: 'setMessageHasRead',
      details: '设为已读消息',
    },
    {
      url: 'systemNotify/deleteNotifyItem',
      method: 'get',
      controllerName: 'removes',
      details: '删除操作日志',
    },
  ],
  fontApi: [
    {
      url: 'systemNotify/getUserNotifys',
      method: 'get',
      controllerName: 'getUserNotifys',
      details: '获取我的消息列表',
      authToken: true,
    },
    {
      url: 'systemNotify/setNoticeRead',
      method: 'get',
      controllerName: 'setMessageHasRead',
      details: '设置消息已读',
      authToken: true,
    },
    {
      url: 'systemNotify/delUserNotify',
      method: 'get',
      controllerName: 'delUserNotify',
      details: '删除消息',
      authToken: true,
    },
  ],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-systemnotify',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/systemNotify'), ctx => ctx.path.startsWith('/api/systemNotify')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
