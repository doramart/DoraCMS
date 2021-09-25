'use strict';
const path = require('path');
const fs = require('fs');
const defaultConfig = require('./ext/config');

module.exports = (appInfo) => {
  return {
    keys: 'doracms2',

    cluster: {
      listen: {
        port: 8080,
        hostname: '',
      },
    },

    session: {
      key: 'DORA_SESS',
      maxAge: 24 * 3600 * 1000, // 1 day
      httpOnly: true,
      encrypt: true,
      renew: true, // 延长会话有效期
    },

    // 前台会员登录有效时间
    userMaxAge: 1000 * 60 * 60 * 24 * 1, // 1 day

    // 后台管理员登录有效时间
    adminUserMaxAge: 1000 * 60 * 60 * 24 * 1, // 1 day

    // 设置网站图标
    siteFile: {
      '/favicon.ico': fs.readFileSync(
        path.join(appInfo.baseDir, 'app/public/favicon.ico')
      ),
    },

    // 配置需要的中间件,数组顺序即为中间件的加载顺序
    middleware: [
      'notfoundHandler',
      'crossHeader',
      'compress',
      'authUserToken',
      'authAdminToken',
      'authAdminPower',
    ],

    // gzip压缩
    compress: {
      threshold: 2048,
    },

    // 会员中心权限校验
    authPage: {
      threshold: 1024, // 小于 1k 的响应体不压缩
    },

    // nunjucks模板引擎
    view: {
      defaultViewEngine: 'nunjucks',
      mapping: {
        '.html': 'nunjucks',
      },
    },

    // 国际化
    i18n: {
      defaultLocale: 'zh-CN',
    },

    alinode: {
      enable: true,
      server: 'wss://agentserver.node.aliyun.com:8080',
      appid: '83778', // Node.js 性能平台给您的项目生成的 appid
      secret: '2e03f5c5d7a9826bb50737ed2832cafb4c3ca19b', // Node.js 性能平台给您的项目生成的 secret
    },

    // cdn域名
    origin: 'https://cdn.html-js.cn',
    // 系统服务提供商
    doracms_api: 'https://api.html-js.cn',
    // 模板文件目录
    temp_static_forder: process.cwd() + '/app/public/themes/',
    temp_view_forder: process.cwd() + '/app/view/',
    temp_locales_forder: process.cwd() + '/config/locale/',
    // 后台管理根目录
    admin_base_path: '/admin',

    // 加密解密
    session_secret: 'doracms_secret',
    auth_cookie_name: 'doracms',
    encrypt_key: 'dora',
    salt_aes_key: 'doracms_',
    salt_md5_key: 'dora',
    socket_prefix: 'dora_socket',

    // 安全性校验
    security: {
      csrf: {
        enable: false,
      },
    },

    // api跨域
    crossHeader: {
      match: ['/api'],
    },

    // 后台token校验
    authAdminToken: {
      match: ['/manage', '/admin'],
    },

    // 后台权限校验
    authAdminPower: {
      match: ['/manage'],
    },

    // 前台用户校验
    authUserToken: {
      ignore: ['/manage', '/admin'],
    },

    // 文件上传
    multipart: {
      fileSize: '5mb',
      mode: 'stream',
      fileExtensions: ['.doc', '.docx'], // 扩展几种上传的文件格式
    },

    // 数据备份定时
    backUpTick: '0 0 0 */1 * ?', // 每天凌晨0点执行一次

    io: {
      namespace: {
        '/': {
          connectionMiddleware: ['auth'],
          packetMiddleware: ['filter'],
        },
      },
    },

    backUpDataRouter: {
      match: [(ctx) => ctx.path.startsWith('/manage/backupDataManage')],
    },

    uploadFileRouter: {
      uploadFileFormat: {
        upload_path: process.cwd() + '/app/public',
        static_root_path: 'cms', // 针对云存储可设置
      },
      match: [
        (ctx) => ctx.path.startsWith('/manage/uploadFile'),
        (ctx) => ctx.path.startsWith('/api/upload/files'),
        (ctx) => ctx.path.startsWith('/api/upload/ueditor'),
        (ctx) => ctx.path.startsWith('/api/upload/filePath'),
      ],
    },
    // CONFIG_NORMALPLUGIN_BEGIN

    // doraRegUserPluginBegin
    regUserRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/regUser'),
        (ctx) => ctx.path.startsWith('/api/user'),
      ],
    },
    // doraRegUserPluginEnd

    // doraAdsPluginBegin
    adsRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/ads'),
        (ctx) => ctx.path.startsWith('/api/ads'),
      ],
    },
    // doraAdsPluginEnd

    // doraAnnouncePluginBegin
    announceRouter: {
      match: [(ctx) => ctx.path.startsWith('/manage/systemAnnounce')],
    },
    // doraAnnouncePluginEnd

    // doraContentPluginBegin
    contentRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/content'),
        (ctx) => ctx.path.startsWith('/api/content'),
      ],
    },
    // doraContentPluginEnd

    // doraContentCategoryPluginBegin
    contentCategoryRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/contentCategory'),
        (ctx) => ctx.path.startsWith('/api/contentCategory'),
      ],
    },
    // doraContentCategoryPluginEnd

    // doraContentMessagePluginBegin
    contentMessageRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/contentMessage'),
        (ctx) => ctx.path.startsWith('/api/contentMessage'),
      ],
    },
    // doraContentMessagePluginEnd

    // doraContentTagsPluginBegin
    contentTagRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/contentTag'),
        (ctx) => ctx.path.startsWith('/api/contentTag'),
      ],
    },
    // doraContentTagsPluginEnd

    // doraContentTempPluginBegin
    contentTempRouter: {
      match: [
        '/manage/template/getTemplateForderList',
        '/manage/template/getTemplateFileText',
        '/manage/template/updateTemplateFileText',
        '/api/contentTemplate/getDefaultTempInfo',
      ],
    },
    // doraContentTempPluginEnd

    // doraHelpCenterPluginBegin
    helpCenterRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/helpCenter'),
        (ctx) => ctx.path.startsWith('/api/helpCenter'),
      ],
    },
    // doraHelpCenterPluginEnd

    // doraSiteMessagePluginBegin
    siteMessageRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/siteMessage'),
        (ctx) => ctx.path.startsWith('/api/siteMessage'),
      ],
    },
    // doraSiteMessagePluginEnd

    // doraSystemNotifyPluginBegin
    systemNotifyRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/systemNotify'),
        (ctx) => ctx.path.startsWith('/api/systemNotify'),
      ],
    },
    // doraSystemNotifyPluginEnd

    // doraSystemOptionLogPluginBegin
    systemOptionLogRouter: {
      match: [(ctx) => ctx.path.startsWith('/manage/systemOptionLog')],
    },
    // doraSystemOptionLogPluginEnd

    // doraTemplateConfigPluginBegin
    templateConfigRouter: {
      match: [
        '/manage/template/getMyTemplateList',
        '/manage/template/addTemplateItem',
        '/manage/template/delTemplateItem',
        '/manage/template/getTemplateItemlist',
        '/manage/template/getTempsFromShop',
        '/manage/template/installTemp',
        '/manage/template/updateTemp',
        '/manage/template/uploadCMSTemplate',
        '/manage/template/enableTemp',
        '/manage/template/uninstallTemp',
      ],
    },
    // doraTemplateConfigPluginEnd

    // doraVersionManagePluginBegin
    versionManageRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/versionManage'),
        (ctx) => ctx.path.startsWith('/api/versionManage'),
      ],
    },
    // doraVersionManagePluginEnd

    // doraMailTemplatePluginBegin
    mailTemplateRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/mailTemplate'),
        (ctx) => ctx.path.startsWith('/api/mailTemplate'),
      ],
    },
    // doraMailTemplatePluginEnd

    // doraMailDeliveryPluginBegin
    mailDeliveryRouter: {
      match: [
        (ctx) => ctx.path.startsWith('/manage/mailDelivery'),
        (ctx) => ctx.path.startsWith('/api/mailDelivery'),
      ],
    },
    // doraMailDeliveryPluginEnd

    // doraMiddleStagePluginBegin
    doraMiddleStageRouter: {
      match: [(ctx) => ctx.path.startsWith('/manage/singleUser')],
    },
    // doraMiddleStagePluginEnd

    // CONFIG_NORMALPLUGIN_END

    // EGGCONFIGDEFAULT

    ...defaultConfig,
  };
};
