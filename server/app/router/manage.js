/**
 * 管理后台路由 (兼容层)
 *
 * 🔥 重要说明：
 *
 * 1. 所有 RESTful API 已迁移至 /manage/v1/* 路由（见 router/manage/v1.js）
 * 2. 本文件仅保留页面渲染路由和特殊功能路由
 * 3. 未来新功能应在 /manage/v1/* 中实现，不建议在此添加新路由
 *
 * 路由分类：
 * - 页面渲染：管理后台页面渲染（保留）
 * - 特殊功能：模板自动生成等未迁移到 v1 的功能（保留）
 * - CRUD API：已全部迁移至 /manage/v1/*（已迁移）
 */
'use strict';

module.exports = app => {
  const { router, controller } = app;

  // ==================== 页面渲染路由（保留）====================

  // 管理后台页面路由（用于渲染 SPA）
  router.get(
    ['/admin-center', '/admin-center/:page', '/admin-center/:page/:page1', '/admin-center/:page/:page1/:id'],
    controller.page.manage.getDataForAdminCenterIndex
  );

  // ==================== 已迁移至 /manage/v1/* 的 API ====================

  /**
   * 🔥 以下 API 已迁移至 /manage/v1/* 路由，请使用新版本：
   *
   * 管理员管理 (Admin):
   *   GET    /manage/v1/admins               → controller.manage.admin.getList
   *   POST   /manage/v1/admins               → controller.manage.admin.addOne
   *   PUT    /manage/v1/admins/:id           → controller.manage.admin.updateOne
   *   DELETE /manage/v1/admins/:id           → controller.manage.admin.deleteUser
   *   GET    /manage/v1/admins/me            → controller.manage.admin.getUserInfo
   *   GET    /manage/v1/admins/:id/routes    → controller.manage.admin.getUserRoutes
   *   POST   /manage/v1/admins/logout       → controller.manage.admin.logOutAction
   *   POST   /manage/v1/admins/login         → controller.api.admin.loginUser
   *   GET    /manage/v1/admins/init/status   → controller.api.admin.getInitStatus
   *   POST   /manage/v1/admins/init          → controller.api.admin.initSuperAdmin
   *
   * 内容管理 (Content):
   *   GET    /manage/v1/content              → controller.manage.content.list
   *   GET    /manage/v1/content/:id          → controller.manage.content.getOne
   *   POST   /manage/v1/content              → controller.manage.content.create
   *   PUT    /manage/v1/content/:id          → controller.manage.content.update
   *   DELETE /manage/v1/content/:id          → controller.manage.content.removes
   *   PUT    /manage/v1/content/batch         → controller.manage.content.updateContents
   *   PUT    /manage/v1/content/:id/top       → controller.manage.content.updateContentToTop
   *   PUT    /manage/v1/content/:id/pin       → controller.manage.content.roofPlacement
   *   POST   /manage/v1/content/:id/assignments → controller.manage.content.redictContentToUsers
   *   PUT    /manage/v1/content/:id/editor   → controller.manage.content.updateContentEditor
   *   PUT    /manage/v1/content/:id/category → controller.manage.content.moveCate
   *
   * 广告管理 (Ads):
   *   GET    /manage/v1/ads                  → controller.manage.ads.list
   *   GET    /manage/v1/ads/:id              → controller.manage.ads.getOne
   *   POST   /manage/v1/ads                  → controller.manage.ads.create
   *   PUT    /manage/v1/ads/:id              → controller.manage.ads.update
   *   DELETE /manage/v1/ads/:id              → controller.manage.ads.removes
   *
   * 分类管理 (Categories):
   *   GET    /manage/v1/categories           → controller.manage.contentCategory.list
   *   GET    /manage/v1/categories/:id       → controller.manage.contentCategory.getOne
   *   POST   /manage/v1/categories           → controller.manage.contentCategory.create
   *   PUT    /manage/v1/categories/:id       → controller.manage.contentCategory.update
   *   DELETE /manage/v1/categories/:id       → controller.manage.contentCategory.removes
   *
   * 标签管理 (Tags):
   *   GET    /manage/v1/tags                 → controller.manage.contentTag.list
   *   GET    /manage/v1/tags/:id             → controller.manage.contentTag.getOne
   *   POST   /manage/v1/tags                 → controller.manage.contentTag.create
   *   PUT    /manage/v1/tags/:id             → controller.manage.contentTag.update
   *   DELETE /manage/v1/tags/:id             → controller.manage.contentTag.removes
   *
   * 留言管理 (Messages):
   *   GET    /manage/v1/messages             → controller.manage.contentMessage.list
   *   GET    /manage/v1/messages/:id         → controller.manage.contentMessage.getOne
   *   POST   /manage/v1/messages             → controller.manage.contentMessage.create
   *   DELETE /manage/v1/messages/:id         → controller.manage.contentMessage.removes
   *   PUT    /manage/v1/messages/batch/state → controller.manage.contentMessage.batchUpdateState
   *   GET    /manage/v1/messages/stats       → controller.manage.contentMessage.getStats
   *   PUT    /manage/v1/messages/:id/audit    → controller.manage.contentMessage.auditMessage
   *   PUT    /manage/v1/messages/batch/audit → controller.manage.contentMessage.batchAuditMessages
   *
   * 用户管理 (Users):
   *   GET    /manage/v1/users                → controller.manage.regUser.list
   *   GET    /manage/v1/users/:id            → controller.manage.regUser.getOne
   *   PUT    /manage/v1/users/:id            → controller.manage.regUser.update
   *   DELETE /manage/v1/users/:id            → controller.manage.regUser.removes
   *
   * 菜单管理 (Menus):
   *   GET    /manage/v1/menus                → controller.manage.menu.getList
   *   POST   /manage/v1/menus                → controller.manage.menu.addOne
   *   PUT    /manage/v1/menus/:id            → controller.manage.menu.updateOne
   *   DELETE /manage/v1/menus/:id            → controller.manage.menu.deleteMenu
   *   PUT    /manage/v1/menus/reorder        → controller.manage.menu.updateOrder
   *   PUT    /manage/v1/menus/batch/status   → controller.manage.menu.batchUpdateStatus
   *
   * 角色管理 (Roles):
   *   GET    /manage/v1/roles                → controller.manage.role.getList
   *   GET    /manage/v1/roles/all            → controller.manage.role.getAllList
   *   POST   /manage/v1/roles                → controller.manage.role.addOne
   *   PUT    /manage/v1/roles/:id            → controller.manage.role.updateOne
   *   DELETE /manage/v1/roles/:id            → controller.manage.role.deleteRole
   *
   * 系统配置 (System Config):
   *   GET    /manage/v1/system/config        → controller.manage.systemConfig.list
   *   POST   /manage/v1/system/config        → controller.manage.systemConfig.update
   *   DELETE /manage/v1/system/config/:id    → controller.manage.systemConfig.removes
   *
   * 邮件模板 (Mail Templates):
   *   GET    /manage/v1/mail-templates        → controller.manage.mailTemplate.list
   *   GET    /manage/v1/mail-templates/types  → controller.manage.mailTemplate.typelist
   *   GET    /manage/v1/mail-templates/:id    → controller.manage.mailTemplate.getOne
   *   POST   /manage/v1/mail-templates        → controller.manage.mailTemplate.create
   *   PUT    /manage/v1/mail-templates/:id    → controller.manage.mailTemplate.update
   *   DELETE /manage/v1/mail-templates/:id    → controller.manage.mailTemplate.removes
   *
   * 模板主题 (Templates):
   *   GET    /manage/v1/templates             → controller.manage.template.list
   *   GET    /manage/v1/templates/:id         → controller.manage.template.getOne
   *   GET    /manage/v1/templates/active      → controller.manage.template.getActiveTheme
   *   POST   /manage/v1/templates             → controller.manage.template.addOne
   *   PUT    /manage/v1/templates/:id         → controller.manage.template.updateOne
   *   DELETE /manage/v1/templates/:id         → controller.manage.template.deleteOne
   *   DELETE /manage/v1/templates/batch      → controller.manage.template.deleteMany
   *   PUT    /manage/v1/templates/:id/activate → controller.manage.template.activate
   *   PUT    /manage/v1/templates/:id/deactivate → controller.manage.template.deactivate
   *   POST   /manage/v1/templates/install/remote → controller.manage.template.installFromRemote
   *   POST   /manage/v1/templates/install     → controller.manage.template.install
   *   DELETE /manage/v1/templates/:id/install → controller.manage.template.uninstall
   *   GET    /manage/v1/templates/:id/export   → controller.manage.template.export
   *   GET    /manage/v1/templates/:id/check    → controller.manage.template.checkIntegrity
   *   GET    /manage/v1/templates/:id/files    → controller.manage.template.getTemplates
   *   PUT    /manage/v1/templates/:id/stats    → controller.manage.template.updateStats
   *   PUT    /manage/v1/templates/batch/status → controller.manage.template.batchUpdateStatus
   *   GET    /manage/v1/templates/stats        → controller.manage.template.getStats
   *   GET    /manage/v1/templates/market      → controller.manage.template.getTempsFromShop
   *   GET    /manage/v1/templates/:id/preview  → controller.manage.template.preview
   *
   * 插件管理 (Plugins):
   *   GET    /manage/v1/plugins              → controller.manage.plugin.list
   *   POST   /manage/v1/plugins/install      → controller.manage.plugin.installPlugin
   *   DELETE /manage/v1/plugins/:id          → controller.manage.plugin.unInstallPlugin
   *   PUT    /manage/v1/plugins/:id/update    → controller.manage.plugin.updatePlugin
   *   PUT    /manage/v1/plugins/:id/enable    → controller.manage.plugin.enablePlugin
   *   GET    /manage/v1/plugins/heartbeat    → controller.manage.plugin.pluginHeartBeat
   *   GET    /manage/v1/plugins/market       → controller.manage.plugin.getPluginShopList
   *   GET    /manage/v1/plugins/market/:id    → controller.manage.plugin.getPluginShopItem
   *   POST   /manage/v1/plugins/invoices     → controller.manage.plugin.createInvoice
   *   POST   /manage/v1/plugins/invoices/check → controller.manage.plugin.checkInvoice
   *
   * 日志管理 (Logs):
   *   GET    /manage/v1/logs                  → controller.manage.systemOptionLog.list
   *   DELETE /manage/v1/logs/:id              → controller.manage.systemOptionLog.removes
   *   DELETE /manage/v1/logs/all              → controller.manage.systemOptionLog.removeAll
   *
   * 文件上传 (Files):
   *   GET    /manage/v1/files                 → controller.manage.uploadFile.list
   *   PUT    /manage/v1/files/:id             → controller.manage.uploadFile.update
   *   DELETE /manage/v1/files/:id             → controller.manage.uploadFile.removes
   *
   * 缓存管理 (Cache):
   *   GET    /manage/v1/cache/stats           → controller.manage.cacheMonitor.getCacheStats
   *   GET    /manage/v1/cache/config          → controller.manage.cacheMonitor.getCacheConfig
   *   GET    /manage/v1/cache/hotspots       → controller.manage.cacheMonitor.getCacheHotspots
   *   POST   /manage/v1/cache/warmup         → controller.manage.cacheMonitor.warmupCache
   *   DELETE /manage/v1/cache                → controller.manage.cacheMonitor.clearCache
   *   DELETE /manage/v1/cache/stats          → controller.manage.cacheMonitor.resetCacheStats
   *
   * Sitemap 管理:
   *   GET    /manage/v1/sitemap/status        → controller.manage.sitemap.getStatus
   *   POST   /manage/v1/sitemap/refresh       → controller.manage.sitemap.refresh
   *   DELETE /manage/v1/sitemap/cache        → controller.manage.sitemap.clearCache
   *   GET    /manage/v1/sitemap/preview       → controller.manage.sitemap.preview
   *   GET    /manage/v1/sitemap/config         → controller.manage.sitemap.getConfig
   *   PUT    /manage/v1/sitemap/config         → controller.manage.sitemap.updateConfig
   *   GET    /manage/v1/sitemap/test           → controller.manage.sitemap.testAccess
   *
   * 完整的 v1 API 列表请参考：server/app/router/manage/v1.js
   */
};
