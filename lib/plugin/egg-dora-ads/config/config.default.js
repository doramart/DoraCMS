'use strict';

/**
 * egg-dora-ads default config
 * @member Config#eggDoraAds
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraAds = {
  alias: 'ads', // 插件目录，必须为英文
  pkgName: 'egg-dora-ads', // 插件包名
  enName: 'doraAds', // 插件名
  name: '广告管理', // 插件名称
  description: '广告管理', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_shakehands_fill', // 主菜单图标名称
  adminUrl: '/ads/js/app.js',
  adminApi: [
    {
      url: 'ads/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取广告列表',
    },
    {
      url: 'ads/getOne',
      method: 'get',
      controllerName: 'getOne',
      details: '获取单条广告信息',
    },
    {
      url: 'ads/addOne',
      method: 'post',
      controllerName: 'create',
      details: '添加单个广告',
    },
    {
      url: 'ads/updateOne',
      method: 'post',
      controllerName: 'update',
      details: '更新广告信息',
    },
    {
      url: 'ads/delete',
      method: 'get',
      controllerName: 'removes',
      details: '删除广告',
    },
  ],
  fontApi: [
    {
      url: 'ads/getOne',
      method: 'get',
      controllerName: 'getOne',
      details: '获取单条广告',
    },
  ],
  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-ads',    
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/ads'), ctx => ctx.path.startsWith('/api/ads')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
