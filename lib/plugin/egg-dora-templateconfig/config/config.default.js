'use strict';

/**
 * egg-dora-templateconfig default config
 * @member Config#eggDoraTemplateConfig
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraTemplateConfig = {
  alias: 'templateConfig', // 插件目录，必须为英文
  pkgName: 'egg-dora-templateconfig', // 插件包名
  enName: 'doraTemplateConfig', // 插件名
  name: '模板配置', // 插件名称
  description: '模板配置', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_skin', // 主菜单图标名称
  adminUrl: '/templateConfig/js/app.js',
  adminApi: [
    {
      url: 'template/getMyTemplateList',
      method: 'get',
      controllerName: 'getMyTemplateList',
      details: '获取已安装的模板列表',
    },
    {
      url: 'template/addTemplateItem',
      method: 'post',
      controllerName: 'addTemplateItem',
      details: '新增模板单元',
    },
    {
      url: 'template/delTemplateItem',
      method: 'get',
      controllerName: 'delTemplateItem',
      details: '删除模板单元',
    },
    {
      url: 'template/getTemplateItemlist',
      method: 'get',
      controllerName: 'getTempItemForderList',
      details: '获取默认模板的模板单元列表',
    },
    {
      url: 'template/getTempsFromShop',
      method: 'get',
      controllerName: 'getTempsFromShop',
      details: '获取模板市场中的模板列表',
      noPower: true,
    },
    {
      url: 'template/installTemp',
      method: 'get',
      controllerName: 'installTemp',
      details: '安装模板',
    },
    {
      url: 'template/updateTemp',
      method: 'get',
      controllerName: 'updateTemplate',
      details: '更新模板',
    },
    {
      url: 'template/uploadCMSTemplate',
      method: 'post',
      controllerName: 'uploadCMSTemplate',
      details: '上传自定义模板',
    },
    {
      url: 'template/enableTemp',
      method: 'get',
      controllerName: 'enableTemp',
      details: '上传自定义模板',
    },
    {
      url: 'template/uninstallTemp',
      method: 'get',
      controllerName: 'uninstallTemp',
      details: '卸载模板',
    },
  ],
  fontApi: [],

  initData: 'templateitems.json', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-templateconfig',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: ['/manage/template/getMyTemplateList',
        '/manage/template/addTemplateItem',
        '/manage/template/delTemplateItem',
        '/manage/template/getTemplateItemlist',
        '/manage/template/getTempsFromShop',
        '/manage/template/installTemp',
        '/manage/template/updateTemp',
        '/manage/template/uploadCMSTemplate',
        '/manage/template/enableTemp',
        '/manage/template/uninstallTemp',
      ],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
