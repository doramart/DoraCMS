/**
 * Created by dora on 2017/5/19.
 *
 */

module.exports = {

    session_secret: 'doracms', // 务必修改
    auth_cookie_name: 'doracms',
    cache_maxAge: Math.floor(Date.now() / 1000) + 24 * 60 * 60, //1 hours
    serverPort: 8080,
    lang: 'zh-CN', // 设置默认语言
    languages: ['zh-CN', 'ja_jp', 'en'], // 可选语言

    // 密码盐
    encrypt_key: 'dora',
    salt_aes_key: "doracms_", // 可以解密，秘钥必须为：8/16/32位
    salt_md5_key: "dora", // MD5的盐，用于加密密码

    //    数据库配置
    URL: 'mongodb://127.0.0.1:27017/doracms2',
    DB: 'doracms2',
    HOST: '127.0.0.1',
    PORT: 27017,
    USERNAME: 'doracms',
    PASSWORD: 'password',

    // 七牛配置
    openqn: false, //是否开启,若为true 则下面的信息必须配置正确完整
    accessKey: 'your accessKey',
    secretKey: 'your secretKey',
    bucket: 'cmsupload', //上传的目标资源空间
    origin: 'http://cdn.html-js.cn', // cdn域名
    fsizeLimit: 1024 * 1024 * 5, // 上传文件大小限制默认为5M
    assetsCdn: true, // 静态资源使用cnd.请在build完成后将 elemt.*.js 上传的七牛的融合cdn

    // redis配置
    openRedis: true, // 测试或生产环境必须开启
    redis_host: '127.0.0.1',
    redis_port: 6379,
    redis_psd: 'your redis password',
    redis_db: 0,
    redis_ttl: 12, // 12 小时

    // 站点基础信息配置
    DORACMSAPI: 'http://api.html-js.cn', // 系统服务提供商
    SYSTEMTEMPFORDER: process.cwd() + '/views/', // 系统模板安装目录
    TEMPSTATICFOLDER: process.cwd() + '/public/themes/', // 模板静态文件路径
    SYSTEMLOGPATH: '/home/doraData/logsdir/doracms', // 服务器日志保存目录

    // 邮件相关设置
    email_findPsd: 'findPsd',
    email_reg_active: 'reg_active',
    email_notice_contentMsg: 'notice_contentMsg',
    email_notice_admin_byContactUs: 'notice_site_messages',
    email_notice_user_byContactUs: 'notice_user_site_messages',
    email_notice_contentBug: 'notice_contentBug',
    email_notice_user_contentMsg: 'notice_user_contentMsg',
    email_notice_user_reg: 'notice_user_reg',

    // 信息提示相关
    system_illegal_param: '非法参数',
    system_noPower: '对不起，您无权执行该操作！',
    system_atLeast_one: '请选择至少一项后再执行删除操作！',
    system_batch_delete_not_allowed: '对不起，该模块不允许批量删除！',
    system_error_imageType: '文件格式不正确，请重新上传',
    system_error_upload: '上传失败，请稍后重试'
};



