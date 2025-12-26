/**
 * API 路由 (兼容层)
 *
 * 🔥 重要说明：
 *
 * 1. 所有业务 API 已迁移至 /api/v1/* 路由（见 router/api/v1.js）
 * 2. 本文件仅保留系统级 API 和页面渲染路由
 * 3. 未来新功能应在 /api/v1/* 中实现，不建议在此添加新路由
 *
 * 路由分类：
 * - 系统工具：验证码、二维码等（保留）
 * - 页面渲染：重置密码页面等（保留）
 * - 健康检查：Docker 容器健康检查（保留）
 * - 业务逻辑：已全部迁移至 /api/v1/*（已迁移）
 */
'use strict';

module.exports = app => {
  const { router, controller } = app;

  // ==================== 系统工具 API（保留）====================

  // 验证码生成
  router.get('/api/getImgCode', controller.page.home.getImgCode);

  // 二维码生成
  router.get('/api/createQRCode', controller.page.home.createQRCode);

  // ==================== 页面渲染路由（保留）====================

  // 重置密码链接页面（非 API，用于渲染页面）
  router.get('/api/user/reset_pass', controller.api.regUser.reSetPass);

  // ==================== 健康检查 API（保留）====================

  // Docker 健康检查端点
  router.get('/api/health', controller.api.health.check);
  router.get('/api/health/alive', controller.api.health.alive);
  router.get('/api/health/ready', controller.api.health.ready);

  // ==================== 已迁移至 /api/v1/* 的 API ====================

  /**
   * 🔥 以下 API 已迁移至 /api/v1/* 路由，请使用新版本：
   *
   * 模板主题 API:
   *   GET  /api/v1/template/active           → controller.api.template.getActiveTheme
   *   GET  /api/v1/template                  → controller.api.template.getThemes
   *   GET  /api/v1/template/:slug            → controller.api.template.getThemeDetail
   *   GET  /api/v1/template/:slug/config     → controller.api.template.getThemeConfig
   *   GET  /api/v1/template/:slug/stats      → controller.api.template.getThemeStats
   *   POST /api/v1/template/:id/download     → controller.api.template.incrementDownload
   *   POST /api/v1/template/:id/rate         → controller.api.template.rateTheme
   *
   * 管理员认证 API:
   *   POST /api/v1/admin/login               → controller.api.admin.loginUser
   *   GET  /api/v1/admin/init/status         → controller.api.admin.getInitStatus
   *   POST /api/v1/admin/init                → controller.api.admin.initSuperAdmin
   *
   * 系统配置 API:
   *   GET  /api/v1/system/config             → controller.api.systemConfig.list
   *
   * 用户认证 API:
   *   POST /api/v1/auth/login                → controller.api.regUser.loginAction
   *   POST /api/v1/auth/register             → controller.api.regUser.regAction
   *   POST /api/v1/auth/logout               → controller.api.regUser.logOut
   *   POST /api/v1/auth/reset-password       → controller.api.regUser.resetMyPassword
   *   POST /api/v1/auth/send-code            → controller.api.regUser.sendVerificationCode
   *
   * 内容管理 API:
   *   GET  /api/v1/content                   → controller.api.content.list
   *   GET  /api/v1/content/:id               → controller.api.content.getOneContent
   *   POST /api/v1/content                   → controller.api.content.addContent
   *   PUT  /api/v1/content/:id               → controller.api.content.updateContent
   *   POST /api/v1/content/:id/like          → controller.api.content.likeContent
   *   POST /api/v1/content/:id/favorite      → controller.api.content.favoriteContent
   *
   * 分类标签 API:
   *   GET  /api/v1/categories                → controller.api.contentCategory.list
   *   GET  /api/v1/categories/tree           → controller.api.contentCategory.treelist
   *   GET  /api/v1/categories/:id             → controller.api.contentCategory.getOne
   *   GET  /api/v1/tags                       → controller.api.contentTag.list
   *   GET  /api/v1/tags/hot                   → controller.api.contentTag.hot
   *   POST /api/v1/tags/findOrCreate          → controller.api.contentTag.findOrCreateByNames
   *
   * 留言评论 API:
   *   GET  /api/v1/messages                  → controller.api.contentMessage.list
   *   POST /api/v1/messages                  → controller.api.contentMessage.postMessages
   *   POST /api/v1/messages/:id/like         → controller.api.contentMessage.praiseMessage
   *   DELETE /api/v1/messages/:id/like       → controller.api.contentMessage.unpraiseMessage
   *   POST /api/v1/messages/:id/dislike      → controller.api.contentMessage.despiseMessage
   *   DELETE /api/v1/messages/:id/dislike    → controller.api.contentMessage.undespiseMessage
   *
   * 文件上传 API:
   *   POST /api/v1/files                      → controller.api.uploadFile.create
   *   POST /api/v1/files/path                 → controller.api.uploadFile.createFileByPath
   *
   * 广告 API:
   *   GET  /api/v1/ads/:id                   → controller.api.ads.getOne
   *
   * 用户信息 API:
   *   GET  /api/v1/users/me                  → controller.api.regUser.getUserInfoBySession
   *   PUT  /api/v1/users/me                  → controller.api.regUser.updateUser
   *   POST /api/v1/users/me/password         → controller.api.regUser.modifyMyPsd
   *
   * 邮件模板 API:
   *   GET  /api/v1/mail-templates             → controller.api.mailTemplate.list
   *   GET  /api/v1/mail-templates/:id         → controller.api.mailTemplate.getOne
   *   POST /api/v1/mail/send                 → controller.api.mailTemplate.sendEmail
   *
   * API Key 管理:
   *   GET    /api/v1/user/api-keys           → controller.api.apiKey.list
   *   POST   /api/v1/user/api-keys           → controller.api.apiKey.create
   *   GET    /api/v1/user/api-keys/:id       → controller.api.apiKey.detail
   *   PUT    /api/v1/user/api-keys/:id       → controller.api.apiKey.update
   *   DELETE /api/v1/user/api-keys/:id       → controller.api.apiKey.delete
   *   PUT    /api/v1/user/api-keys/:id/enable  → controller.api.apiKey.enable
   *   PUT    /api/v1/user/api-keys/:id/disable → controller.api.apiKey.disable
   *   POST   /api/v1/user/api-keys/:id/rotate  → controller.api.apiKey.rotate
   *
   * 完整的 v1 API 列表请参考：server/app/router/api/v1.js
   */
};
