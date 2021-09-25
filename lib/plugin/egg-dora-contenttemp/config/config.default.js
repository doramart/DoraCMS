'use strict';

/**
 * egg-dora-contenttemplate default config
 * @member Config#eggDoraContentTemp
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraContentTemp = {
  alias: 'contentTemp', // 插件目录，必须为英文
  pkgName: 'egg-dora-contenttemp', // 插件包名
  enName: 'doraContentTemp', // 插件名
  name: '模板编辑', // 插件名称
  description: '模板编辑', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_compile', // 主菜单图标名称
  adminUrl: '/contentTemp/js/app.js',
  adminApi: [
    {
      url: 'template/getTemplateForderList',
      method: 'get',
      controllerName: 'getContentDefaultTemplate',
      details: '获取模板文件列表',
    },
    {
      url: 'template/getTemplateFileText',
      method: 'get',
      controllerName: 'getFileInfo',
      details: '读取文件内容',
    },
    {
      url: 'template/updateTemplateFileText',
      method: 'post',
      controllerName: 'updateFileInfo',
      details: '更新文件内容',
    },
    {
      url: 'template/createInvoice',
      method: 'post',
      controllerName: 'createInvoice',
      details: '预创建支付订单',
      noPower: true,
    },
    {
      url: 'template/checkInvoice',
      method: 'post',
      controllerName: 'checkInvoice',
      details: '订单校验',
      noPower: true,
    },
  ],
  fontApi: [
    {
      url: 'contentTemplate/getDefaultTempInfo',
      method: 'get',
      controllerName: 'getDefaultTempInfo',
      details: '获取默认模板信息',
    },
  ],

  initData: 'contenttemplates.json', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-contenttemp',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: ['/manage/template/getTemplateForderList',
        '/manage/template/getTemplateFileText',
        '/manage/template/updateTemplateFileText',
        '/api/contentTemplate/getDefaultTempInfo',
      ],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
