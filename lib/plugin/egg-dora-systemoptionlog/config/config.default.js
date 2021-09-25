'use strict';

/**
 * egg-dora-systemoptionlog default config
 * @member Config#eggDoraSystemOptionLog
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraSystemOptionLog = {
  alias: 'systemOptionLog', // 插件目录，必须为英文
  pkgName: 'egg-dora-systemoptionlog', // 插件包名
  enName: 'doraSystemOptionLog', // 插件名
  name: '系统日志', // 插件名称
  description: '系统日志', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_logs', // 主菜单图标名称
  adminUrl: '/systemOptionLog/js/app.js',
  adminApi: [
    {
      url: 'systemOptionLog/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取日志列表',
    },
    {
      url: 'systemOptionLog/deleteLogItem',
      method: 'get',
      controllerName: 'removes',
      details: '删除单条日志',
    },
    {
      url: 'systemOptionLog/deleteAllLogItem',
      method: 'get',
      controllerName: 'removeAll',
      details: '清空日志',
    },
  ],
  fontApi: [],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-systemoptionlog',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/systemOptionLog')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
