/**
 * Created by dora on 2017/5/19.
 *
 */

module.exports = {

	imgZip: true, // 上传图片是否压缩(如果为false则本地不需要安装gm)
	session_secret: 'doracms', // 务必修改
	auth_cookie_name: 'doracms',

	cache_maxAge: Math.floor(Date.now() / 1000) + 24 * 60 * 60, //1 hours

	// 密码盐
	encrypt_key: 'dora',
	salt_aes_key: "doracms_", // 可以解密，秘钥必须为：8/16/32位
	salt_md5_key: "dora", // MD5的盐，用于加密密码

	// 数据库配置
	URL: 'mongodb://127.0.0.1:27017/doracms2',
	DB: 'doracms2',
	HOST: '127.0.0.1',
	PORT: 27017,
	USERNAME: 'doracms',
	PASSWORD: 'password',

	// 站点基础信息配置
	DORACMSAPI: 'http://api.html-js.cn', // 系统服务提供商
	SYSTEMLOGPATH: '/home/doraData/logsdir/doracms', // 服务器日志保存目录
	// 邮件相关设置
	email_findPsd: 'findPsd',
	email_reg_active: 'reg_active',
	email_notice_contentMsg: 'notice_contentMsg',
	email_notice_contentBug: 'notice_contentBug',
	email_notice_user_contentMsg: 'notice_user_contentMsg',
	email_notice_user_reg: 'notice_user_reg',

	// 信息提示相关
	system_illegal_param: '非法参数',
	system_noPower: '对不起，您无权执行该操作！',
	system_atLeast_one: '请选择至少一项后再执行删除操作！',
	system_batch_delete_not_allowed: '对不起，该模块不允许批量删除！'
};



