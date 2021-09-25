'use strict';

/**
 * egg-dora-helpcenter default config
 * @member Config#eggDoraHelpCenter
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraHelpCenter = {
  alias: 'helpCenter', // 插件目录，必须为英文
  pkgName: 'egg-dora-helpcenter', // 插件包名
  enName: 'doraHelpCenter', // 插件名
  name: '帮助中心', // 插件名称
  description: '提供帮助文案管理', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_service', // 主菜单图标名称
  adminUrl: '/helpCenter/js/app.js',
  adminApi: [
    {
      url: 'helpCenter/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取帮助列表',
    },
    {
      url: 'helpCenter/getOne',
      method: 'get',
      controllerName: 'getOne',
      details: '获取单条帮助信息',
    },
    {
      url: 'helpCenter/addOne',
      method: 'post',
      controllerName: 'create',
      details: '添加单个帮助',
    },
    {
      url: 'helpCenter/updateOne',
      method: 'post',
      controllerName: 'update',
      details: '更新帮助信息',
    },
    {
      url: 'helpCenter/delete',
      method: 'get',
      controllerName: 'removes',
      details: '删除帮助',
    },
  ],
  fontApi: [],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-helpcenter',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/helpCenter'), ctx => ctx.path.startsWith('/api/helpCenter')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
