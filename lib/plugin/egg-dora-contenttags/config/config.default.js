'use strict';

/**
 * egg-dora-contenttags default config
 * @member Config#eggDoraContentTag
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraContentTags = {
  alias: 'contentTags', // 插件目录，必须为英文
  pkgName: 'egg-dora-contenttags', // 插件包名
  enName: 'doraContentTags', // 插件名
  name: '文档标签', // 插件名称
  description: '文档标签', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_tags', // 主菜单图标名称
  adminUrl: '/contentTags/js/app.js',
  adminApi: [
    {
      url: 'contentTag/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取标签列表',
    },
    {
      url: 'contentTag/getOne',
      method: 'get',
      controllerName: 'getOne',
      details: '获取单条标签信息',
    },
    {
      url: 'contentTag/addOne',
      method: 'post',
      controllerName: 'create',
      details: '添加单个标签',
    },
    {
      url: 'contentTag/updateOne',
      method: 'post',
      controllerName: 'update',
      details: '更新标签信息',
    },
    {
      url: 'contentTag/deleteTag',
      method: 'get',
      controllerName: 'removes',
      details: '删除标签',
    },
  ],
  fontApi: [
    {
      url: 'contentTag/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取标签列表',
    },
    {
      url: 'contentTag/getHotList',
      method: 'get',
      controllerName: 'hot',
      details: '获取热门标签列表',
    },
  ],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-contenttags',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/contentTag'), ctx => ctx.path.startsWith('/api/contentTag')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
