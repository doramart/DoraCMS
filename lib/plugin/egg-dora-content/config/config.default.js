'use strict'

/**
 * egg-dora-content default config
 * @member Config#eggDoraContent
 * @property {String} SOME_KEY - some description
 */

const pkgInfo = require('../package.json');
exports.doraContent = {
    alias: 'content', // 插件目录，必须为英文
    pkgName: 'egg-dora-content', // 插件包名
    enName: 'doraContent', // 插件名
    name: '文档管理', // 插件名称
    description: '提供文档文案管理', // 插件描述
    isadm: 1, // 是否有后台管理，1：有，0：没有，入口地址:'/ext/devteam/admin/index'
    isindex: 0, // 是否需要前台访问，1：需要，0：不需要,入口地址:'/ext/devteam/index/index'
    version: pkgInfo.version, // 版本号
    iconName: 'icon_doc_fill', // 主菜单图标名称
    adminUrl: '/content/js/app.js',
    adminApi: [{
        url: 'content/getList',
        method: 'get',
        controllerName: 'list',
        details: '获取文档列表',
    }, {
        url: 'content/getContent',
        method: 'get',
        controllerName: 'getOne',
        details: '获取单条文档信息',
    }, {
        url: 'content/addOne',
        method: 'post',
        controllerName: 'create',
        details: '添加单个文档',
    }, {
        url: 'content/updateOne',
        method: 'post',
        controllerName: 'update',
        details: '更新文档信息',
    }, {
        url: 'content/deleteContent',
        method: 'get',
        controllerName: 'removes',
        details: '删除文档',
    }, {
        url: 'content/topContent',
        method: 'post',
        controllerName: 'updateContentToTop',
        details: '文档推荐',
    }, {
        url: 'content/roofContent',
        method: 'post',
        controllerName: 'roofPlacement',
        details: '文档置顶',
    }, {
        url: 'content/redictContentToUsers',
        method: 'post',
        controllerName: 'redictContentToUsers',
        details: '分配用户',
    }, {
        url: 'content/updateContentEditor',
        method: 'post',
        controllerName: 'updateContentEditor',
        details: '绑定编辑',
    }],
    fontApi: [{
        url: 'content/getMyFavoriteContents',
        method: 'get',
        controllerName: 'getMyFavoriteContents',
        details: '获取收藏的文档列表',
        authToken: true
    }, {
        url: 'content/getUserContents',
        method: 'get',
        controllerName: 'list',
        details: '获取用户的文档列表',
    }, {
        url: 'content/getList',
        method: 'get',
        controllerName: 'list',
        details: '获取文档列表',
    }, {
        url: 'content/getRadomContents',
        method: 'get',
        controllerName: 'getRadomContents',
        details: '获取随机文档列表',
    }, {
        url: 'content/getRandomContentImg',
        method: 'get',
        controllerName: 'getRandomContentImg',
        details: '获取随机文档首图',
    }, {
        url: 'content/getRecommendedList',
        method: 'get',
        controllerName: 'getTopIndexContents',
        details: '获取推荐文档列表',
    }, {
        url: 'content/getContent',
        method: 'get',
        controllerName: 'getOneContent',
        details: '获取单个文档信息',
    }, {
        url: 'content/addOne',
        method: 'post',
        controllerName: 'addContent',
        details: '新增文档',
        authToken: true
    }, {
        url: 'content/updateOne',
        method: 'post',
        controllerName: 'updateContent',
        details: '更新文档',
        authToken: true
    }, {
        url: 'content/getNearbyContent',
        method: 'get',
        controllerName: 'getNearbyContent',
        details: '上一篇/下一篇',
    }],

    initData: 'contents.json', // 初始化数据脚本
    pluginsConfig: ` 
    exports.doraContent = {\n
        enable: true,\n        package: 'egg-dora-content',
    };\n
    `, // 插入到 plugins.js 中的配置
    defaultConfig: `
    contentRouter:{\n
        match: [ctx => ctx.path.startsWith('/manage/content'), ctx => ctx.path.startsWith('/api/content')],\n
    },\n
    `, // 插入到 config.default.js 中的配置
}