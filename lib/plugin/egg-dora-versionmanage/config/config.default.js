'use strict';

/**
 * egg-dora-versionmanage default config
 * @member Config#eggDoraVersionManage
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraVersionManage = {
  alias: 'versionManage', // 插件目录，必须为英文
  pkgName: 'egg-dora-versionmanage', // 插件包名
  enName: 'doraVersionManage', // 插件名
  name: 'app版本', // 插件名称
  description: 'app版本', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_app', // 主菜单图标名称
  adminUrl: '/versionManage/js/app.js',
  adminApi: [
    {
      url: 'versionManage/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取版本配置',
    },
    {
      url: 'versionManage/updateOne',
      method: 'post',
      controllerName: 'update',
      details: '更新版本信息',
    },
  ],
  fontApi: [
    {
      url: 'versionManage/getAppVersion',
      method: 'get',
      controllerName: 'list',
      details: '获取app版本信息',
    },
  ],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-versionmanage',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/versionManage'), ctx => ctx.path.startsWith('/api/versionManage')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
