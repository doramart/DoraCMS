'use strict';

/**
 * egg-dora-contentmessage default config
 * @member Config#eggDoraContentMessage
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraContentMessage = {
  alias: 'contentMessage', // 插件目录，必须为英文
  pkgName: 'egg-dora-contentmessage', // 插件包名
  enName: 'doraContentMessage', // 插件名
  name: '文档留言', // 插件名称
  description: '文档留言管理', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_service', // 主菜单图标名称
  adminUrl: '/contentMessage/js/app.js',
  adminApi: [
    {
      url: 'contentMessage/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取留言列表',
    },
    {
      url: 'contentMessage/getOne',
      method: 'get',
      controllerName: 'getOne',
      details: '获取单条留言信息',
    },
    {
      url: 'contentMessage/addOne',
      method: 'post',
      controllerName: 'create',
      details: '添加单个留言',
    },
    {
      url: 'contentMessage/deleteMessage',
      method: 'get',
      controllerName: 'removes',
      details: '删除留言',
    },
  ],
  fontApi: [
    {
      url: 'contentMessage/postMessages',
      method: 'post',
      controllerName: 'postMessages',
      details: '发表留言',
      authToken: true,
    },
    {
      url: 'contentMessage/getMessages',
      method: 'get',
      controllerName: 'list',
      details: '获取留言列表',
    },
  ],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-contentmessage',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/contentMessage'),ctx => ctx.path.startsWith('/api/contentMessage')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
