'use strict';

/**
 * egg-dora-reguser default config
 * @member Config#eggDoraRegUser
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraRegUser = {
  alias: 'regUser', // 插件目录，必须为英文
  pkgName: 'egg-dora-reguser', // 插件包名
  enName: 'doraRegUser', // 插件名
  name: '会员管理', // 插件名称
  description: '会员管理', // 插件描述
  isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
  isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
  version: pkgInfo.version, // 版本号
  iconName: 'icon_people_fill', // 主菜单图标名称
  adminUrl: '/regUser/js/app.js',
  adminApi: [
    {
      url: 'regUser/getList',
      method: 'get',
      controllerName: 'list',
      details: '获取会员列表',
    },
    {
      url: 'regUser/getOne',
      method: 'get',
      controllerName: 'getOne',
      details: '获取单条会员信息',
    },
    {
      url: 'regUser/updateOne',
      method: 'post',
      controllerName: 'update',
      details: '更新会员信息',
    },
    {
      url: 'regUser/deleteUser',
      method: 'get',
      controllerName: 'removes',
      details: '删除会员',
    },
  ],
  fontApi: [
    {
      url: 'user/sendVerificationCode',
      method: 'post',
      controllerName: 'sendVerificationCode',
      details: '发送验证码',
    },
    {
      url: 'user/doLogin',
      method: 'post',
      controllerName: 'loginAction',
      details: '用户登录',
    },
    {
      url: 'user/touristLogin',
      method: 'post',
      controllerName: 'touristLoginAction',
      details: '游客登录',
    },
    {
      url: 'user/doReg',
      method: 'post',
      controllerName: 'regAction',
      details: '用户注册',
    },
    {
      url: 'user/bindInfo',
      method: 'post',
      controllerName: 'bindEmailOrPhoneNum',
      details: '信息绑定',
      authToken: true,
    },
    {
      url: 'user/resetPassword',
      method: 'post',
      controllerName: 'resetMyPassword',
      details: '重设密码',
    },
    {
      url: 'user/modifyMyPsd',
      method: 'post',
      controllerName: 'modifyMyPsd',
      details: '修改密码',
      authToken: true,
    },
    {
      url: 'user/userInfo',
      method: 'get',
      controllerName: 'getUserInfoBySession',
      details: '获取用户信息',
      authToken: true,
    },
    {
      url: 'user/followCreator',
      method: 'get',
      controllerName: 'followCreator',
      details: '关注作者',
      authToken: true,
    },
    {
      url: 'user/addTags',
      method: 'get',
      controllerName: 'addTags',
      details: '关注标签',
      authToken: true,
    },
    {
      url: 'user/askContentThumbsUp',
      method: 'get',
      controllerName: 'askContentThumbsUp',
      details: '点赞',
      authToken: true,
    },
    {
      url: 'user/favoriteContent',
      method: 'get',
      controllerName: 'favoriteContent',
      details: '收藏',
      authToken: true,
    },
    {
      url: 'user/despiseContent',
      method: 'get',
      controllerName: 'despiseContent',
      details: '踩帖',
      authToken: true,
    },
    {
      url: 'user/checkPhoneNumExist',
      method: 'get',
      controllerName: 'checkPhoneNumExist',
      details: '检测手机号是否存在',
    },
    {
      url: 'user/checkHadSetLoginPassword',
      method: 'get',
      controllerName: 'checkHadSetLoginPassword',
      details: '检测是否已设置登录密码',
      authToken: true,
    },
    {
      url: 'user/updateInfo',
      method: 'post',
      controllerName: 'updateUser',
      details: '更新用户信息',
      authToken: true,
    },
    {
      url: 'user/getMyFollowInfos',
      method: 'get',
      controllerName: 'getMyFollowInfos',
      details: '获取我关注的信息',
      authToken: true,
    },
    {
      url: 'user/logOut',
      method: 'get',
      controllerName: 'logOut',
      details: '退出登录',
      authToken: true,
    },
    {
      url: 'user/sentConfirmEmail',
      method: 'post',
      controllerName: 'sentConfirmEmail',
      details: '发送确认邮件',
    },
    {
      url: 'user/updateNewPsd',
      method: 'post',
      controllerName: 'updateNewPsd',
      details: '设置新密码',
    },
    {
      url: 'user/reset_pass',
      method: 'get',
      controllerName: 'reSetPass',
      details: '重设密码链接',
    },
  ],

  initData: '', // 初始化数据脚本
  pluginsConfig: ` 
    module.exports = {\n
        enable: true,\n        package: 'egg-dora-reguser',
    };\n
    `, // 插入到 plugins.js 中的配置
  defaultConfig: `
    module.exports = {\n
        match: [ctx => ctx.path.startsWith('/manage/regUser'), ctx => ctx.path.startsWith('/api/user')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
};
