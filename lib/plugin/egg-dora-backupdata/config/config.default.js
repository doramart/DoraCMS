'use strict';

/**
 * egg-dora-backupdata default config
 * @member Config#eggDoraBackUpData
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraBackUpData = {
  alias: 'backUpData', // 插件目录，必须为英文
  pkgName: 'egg-dora-backupdata', // 插件包名
  enName: 'doraBackUpData', // 插件名
  name: '数据管理', // 插件名称
  description: '数据管理', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_cspace', // 主菜单图标名称
  adminUrl: '/backUpData/js/app.js',
  adminApi: [
    {
      url: 'backupDataManage/getBakList',
      method: 'get',
      controllerName: 'list',
      details: '获取备份数据列表',
    },
    {
      url: 'backupDataManage/backUp',
      method: 'post',
      controllerName: 'backUpData',
      details: '执行数据备份',
    },
    {
      url: 'backupDataManage/restore',
      method: 'post',
      controllerName: 'restoreData',
      details: '执行数据还原',
    },
    {
      url: 'backupDataManage/deleteDataItem',
      method: 'get',
      controllerName: 'removes',
      details: '删除备份数据',
    },
  ],
  fontApi: [],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-backupdata',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/backupDataManage')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
