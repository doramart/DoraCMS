'use strict';

/**
 * egg-dora-doramiddleStage default config
 * @member Config#eggDoraDoraMiddleStage
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraMiddleStage = {
  alias: 'doraMiddleStage', // 插件目录，必须为英文
  pkgName: 'egg-dora-middleStage', // 插件包名
  enName: 'doraMiddleStage', // 插件名
  name: 'doracms middlestage', // 插件名称
  description: 'doracms middlestage', // 插件描述
  isadm: 0, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: '', // 主菜单图标名称
  adminUrl: '',
  adminApi: [
    {
      url: 'singleUser/sendVerificationCode',
      method: 'post',
      controllerName: 'sendVerificationCode',
      details: '发送验证码',
      noPower: true,
    },
    {
      url: 'singleUser/doReg',
      method: 'post',
      controllerName: 'doReg',
      details: '用户注册',
      noPower: true,
    },
    {
      url: 'singleUser/doLogin',
      method: 'post',
      controllerName: 'doLogin',
      details: '用户登录',
      noPower: true,
    },
    {
      url: 'singleUser/logOut',
      method: 'get',
      controllerName: 'logOut',
      details: '用户登出',
      noPower: true,
    },
    {
      url: 'singleUser/getUserInfo',
      method: 'get',
      controllerName: 'getUserInfo',
      details: '获取用户信息',
      noPower: true,
    },
    {
      url: 'singleUser/getClientNotice',
      method: 'get',
      controllerName: 'getClientNotice',
      details: '获取系统公告列表',
      noPower: true,
    },
    {
      url: 'singleUser/getVersionMaintenanceInfo',
      method: 'get',
      controllerName: 'getVersionMaintenanceInfo',
      details: '获取版本维护信息',
      noPower: true,
    },
  ],
  fontApi: [
    {
      url: 'singleUser/getClientNotice',
      method: 'get',
      controllerName: 'getClientNotice',
      details: '获取系统公告列表',
      noPower: true,
    },
  ],
  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-middleStage',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/singleUser')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
