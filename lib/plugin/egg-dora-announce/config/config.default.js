'use strict';

/**
 * egg-dora-announce default config
 * @member Config#eggDoraAnnounce
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraAnnounce = {
  alias: 'announce', // 插件目录，必须为英文
  pkgName: 'egg-dora-announce', // 插件包名
  enName: 'doraAnnounce', // 插件名
  name: '系统公告', // 插件名称
  description: '系统公告', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_inform_fill', // 主菜单图标名称
  adminUrl: '/announce/js/app.js',
  adminApi: [
    {
      url: 'systemAnnounce/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取系统公告列表',
    },
    {
      url: 'systemAnnounce/addOne',
      method: 'post',
      controllerName: 'create',
      details: '新增公告',
    },
    {
      url: 'systemAnnounce/deleteItem',
      method: 'get',
      controllerName: 'removes',
      details: '删除公告',
    },
  ],
  fontApi: [],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-announce',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/systemAnnounce')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
