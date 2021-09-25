'use strict';

/**
 * egg-dora-sitemessage default config
 * @member Config#eggDoraSiteMessage
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraSiteMessage = {
  alias: 'siteMessage', // 插件目录，必须为英文
  pkgName: 'egg-dora-sitemessage', // 插件包名
  enName: 'doraSiteMessage', // 插件名
  name: '站点消息管理', // 插件名称
  description: '站点消息管理', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_shakehands_fill', // 主菜单图标名称
  adminUrl: '',
  adminApi: [
    {
      url: 'siteMessage/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取站点消息列表',
    },
    {
      url: 'siteMessage/delete',
      method: 'get',
      controllerName: 'removes',
      details: '删除站点消息',
    },
  ],
  fontApi: [
    {
      url: 'siteMessage/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取站点消息列表',
      authToken: true,
    },
    {
      url: 'siteMessage/setHasRead',
      method: 'get',
      controllerName: 'setMessageHasRead',
      details: '设置消息已读',
      authToken: true,
    },
    {
      url: 'siteMessage/getSiteMessageOutline',
      method: 'get',
      controllerName: 'getSiteMessageOutline',
      details: '获取消息总览',
      authToken: true,
    },
  ],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-sitemessage',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/siteMessage'), ctx => ctx.path.startsWith('/api/siteMessage')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
