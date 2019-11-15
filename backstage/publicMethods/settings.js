module.exports = {

  title: 'DoraCMS Admin',

  /**
   * @type {boolean} true | false
   * @description Whether fix the header
   */
  fixedHeader: true,

  /**
   * @type {boolean} true | false
   * @description Whether show the logo in sidebar
   */
  sidebarLogo: true,

  server_api: '',
  // 加密key
  token_key: 'admin_doracms',
  // 中台tokenkey
  admin_token_key: 'admin_doracmsapi',
  // 宿主后台管理根目录
  admin_base_path: '/admin',

  // 宿主工程目录
  host_project_path: '/Users/dora/Documents/dora/coding.net/egg-cms',
  // 七牛文件上传目录
  qiniuStaticPath: 'cms/plugins/static/admin/'
}