'use strict';

/**
 * egg-dora-mailtemplate default config
 * @member Config#eggDoraMailTemplate
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraMailTemplate = {
  alias: 'mailTemplate', // 插件目录，必须为英文
  pkgName: 'egg-dora-mailtemplate', // 插件包名
  enName: 'doraMailTemplate', // 插件名
  name: '邮件模板', // 插件名称
  description: '邮件模板', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_service', // 主菜单图标名称
  adminUrl: '/mailTemplate/js/app.js',
  adminApi: [
    {
      url: 'mailTemplate/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取邮件模板列表',
    },
    {
      url: 'mailTemplate/getTypeList',
      method: 'get',
      controllerName: 'typelist',
      details: '获取邮件模板类别列表',
    },
    {
      url: 'mailTemplate/getOne',
      method: 'get',
      controllerName: 'getOne',
      details: '获取单条邮件模板信息',
    },
    {
      url: 'mailTemplate/addOne',
      method: 'post',
      controllerName: 'create',
      details: '添加单个邮件模板',
    },
    {
      url: 'mailTemplate/updateOne',
      method: 'post',
      controllerName: 'update',
      details: '更新邮件模板信息',
    },
    {
      url: 'mailTemplate/delete',
      method: 'get',
      controllerName: 'removes',
      details: '删除邮件模板',
    },
  ],
  fontApi: [
    {
      url: 'mailTemplate/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取邮件模板列表',
    },
    {
      url: 'mailTemplate/getOne',
      method: 'get',
      controllerName: 'getOne',
      details: '获取邮件模板列表',
    },
    {
      url: 'mailTemplate/getTypeList',
      method: 'get',
      controllerName: 'typelist',
      details: '获取邮件模板类别列表',
    },
    {
      url: 'mailTemplate/sendEmail',
      method: 'post',
      controllerName: 'sendEmail',
      details: '发送邮件',
    },
  ],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n
         \n
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/mailTemplate'), ctx => ctx.path.startsWith('/api/mailTemplate')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
