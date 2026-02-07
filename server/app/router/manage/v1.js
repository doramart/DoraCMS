/**
 * 管理后台 API v1 路由
 * 所有管理后台的 RESTful API 路由定义
 *
 * 路径格式：/manage/v1/resource
 */
'use strict';

module.exports = app => {
  const { router, controller } = app;
  const prefix = '/manage/v1';

  // ==================== 管理员认证 ====================
  // @desc 管理员登录
  router.post(`${prefix}/admins/login`, controller.api.admin.loginUser);
  // @desc 获取初始化状态
  router.get(`${prefix}/admins/init/status`, controller.api.admin.getInitStatus);
  // @desc 初始化超级管理员
  router.post(`${prefix}/admins/init`, controller.api.admin.initSuperAdmin);
  // @desc 获取当前管理员信息
  router.get(`${prefix}/admins/me`, controller.manage.admin.getUserInfo);
  // @desc 获取管理员路由权限
  router.get(`${prefix}/admins/me/routes`, controller.manage.admin.getUserRoutes);
  // @desc 管理员登出
  router.post(`${prefix}/admins/logout`, controller.manage.admin.logOutAction);

  // ==================== 管理员管理 ====================
  // @desc 获取管理员列表
  router.get(`${prefix}/admins`, controller.manage.admin.getList);
  // @desc 创建管理员
  router.post(`${prefix}/admins`, controller.manage.admin.addOne);
  // @desc 更新管理员信息
  router.put(`${prefix}/admins/:id`, controller.manage.admin.updateOne);
  // @desc 删除管理员
  router.delete(`${prefix}/admins/:id`, controller.manage.admin.deleteUser);

  // ==================== 内容管理 ====================
  // @desc 获取内容列表
  router.get(`${prefix}/content`, controller.manage.content.list);
  // @desc 批量更新内容
  router.put(`${prefix}/content/batch`, controller.manage.content.updateContents);

  // @desc 获取内容详情（参数化路由，必须在特定路由之后）
  router.get(`${prefix}/content/:id`, controller.manage.content.getOne);
  // @desc 创建内容
  router.post(`${prefix}/content`, controller.manage.content.create);
  // @desc 更新内容
  router.put(`${prefix}/content/:id`, controller.manage.content.update);
  // @desc 删除内容
  router.delete(`${prefix}/content/:id`, controller.manage.content.removes);
  // @desc 置顶内容
  router.put(`${prefix}/content/:id/top`, controller.manage.content.updateContentToTop);
  // @desc 固定内容
  router.put(`${prefix}/content/:id/pin`, controller.manage.content.roofPlacement);
  // @desc 分配内容给用户
  router.post(`${prefix}/content/:id/assignments`, controller.manage.content.redictContentToUsers);
  // @desc 更新内容编辑器
  router.put(`${prefix}/content/:id/editor`, controller.manage.content.updateContentEditor);
  // @desc 移动内容分类
  router.put(`${prefix}/content/:id/category`, controller.manage.content.moveCate);

  // ==================== 广告管理 ====================
  // @desc 获取广告列表
  router.get(`${prefix}/ads`, controller.manage.ads.list);
  // @desc 获取广告详情
  router.get(`${prefix}/ads/:id`, controller.manage.ads.getOne);
  // @desc 创建广告
  router.post(`${prefix}/ads`, controller.manage.ads.create);
  // @desc 更新广告
  router.put(`${prefix}/ads/:id`, controller.manage.ads.update);
  // @desc 删除广告
  router.delete(`${prefix}/ads/:id`, controller.manage.ads.removes);

  // ==================== 分类管理 ====================
  // @desc 获取分类列表
  router.get(`${prefix}/categories`, controller.manage.contentCategory.list);
  // @desc 获取分类详情
  router.get(`${prefix}/categories/:id`, controller.manage.contentCategory.getOne);
  // @desc 创建分类
  router.post(`${prefix}/categories`, controller.manage.contentCategory.create);
  // @desc 更新分类
  router.put(`${prefix}/categories/:id`, controller.manage.contentCategory.update);
  // @desc 删除分类
  router.delete(`${prefix}/categories/:id`, controller.manage.contentCategory.removes);

  // ==================== 标签管理 ====================
  // @desc 获取标签列表
  router.get(`${prefix}/tags`, controller.manage.contentTag.list);
  // @desc 获取标签详情
  router.get(`${prefix}/tags/:id`, controller.manage.contentTag.getOne);
  // @desc 创建标签
  router.post(`${prefix}/tags`, controller.manage.contentTag.create);
  // @desc 更新标签
  router.put(`${prefix}/tags/:id`, controller.manage.contentTag.update);
  // @desc 删除标签
  router.delete(`${prefix}/tags/:id`, controller.manage.contentTag.removes);

  // ==================== 留言管理 ====================
  // @desc 获取留言列表
  router.get(`${prefix}/messages`, controller.manage.contentMessage.list);
  // @desc 获取留言统计
  router.get(`${prefix}/messages/stats`, controller.manage.contentMessage.getStats);
  // @desc 批量更新留言状态
  router.put(`${prefix}/messages/batch/state`, controller.manage.contentMessage.batchUpdateState);
  // @desc 批量审核留言
  router.put(`${prefix}/messages/batch/audit`, controller.manage.contentMessage.batchAuditMessages);

  // @desc 获取留言详情（参数化路由，必须在特定路由之后）
  router.get(`${prefix}/messages/:id`, controller.manage.contentMessage.getOne);
  // @desc 创建留言
  router.post(`${prefix}/messages`, controller.manage.contentMessage.create);
  // @desc 删除留言
  router.delete(`${prefix}/messages/:id`, controller.manage.contentMessage.removes);
  // @desc 审核留言
  router.put(`${prefix}/messages/:id/audit`, controller.manage.contentMessage.auditMessage);

  // ==================== 用户管理 ====================
  // @desc 获取用户列表
  router.get(`${prefix}/users`, controller.manage.regUser.list);
  // @desc 获取用户详情
  router.get(`${prefix}/users/:id`, controller.manage.regUser.getOne);
  // @desc 更新用户信息
  router.put(`${prefix}/users/:id`, controller.manage.regUser.update);
  // @desc 删除用户
  router.delete(`${prefix}/users/:id`, controller.manage.regUser.removes);

  // ==================== 菜单管理 ====================
  // @desc 获取菜单列表
  router.get(`${prefix}/menus`, controller.manage.menu.getList);
  // @desc 重新排序菜单
  router.put(`${prefix}/menus/reorder`, controller.manage.menu.updateOrder);
  // @desc 批量更新菜单状态
  router.put(`${prefix}/menus/batch/status`, controller.manage.menu.batchUpdateStatus);

  // @desc 创建菜单
  router.post(`${prefix}/menus`, controller.manage.menu.addOne);
  // @desc 更新菜单（参数化路由，必须在特定路由之后）
  router.put(`${prefix}/menus/:id`, controller.manage.menu.updateOne);
  // @desc 删除菜单
  router.delete(`${prefix}/menus/:id`, controller.manage.menu.deleteMenu);

  // ==================== 角色管理 ====================
  // @desc 获取角色列表
  router.get(`${prefix}/roles`, controller.manage.role.getList);
  // @desc 获取所有角色
  router.get(`${prefix}/roles/all`, controller.manage.role.getAllList);
  // @desc 创建角色
  router.post(`${prefix}/roles`, controller.manage.role.addOne);
  // @desc 更新角色
  router.put(`${prefix}/roles/:id`, controller.manage.role.updateOne);
  // @desc 删除角色
  router.delete(`${prefix}/roles/:id`, controller.manage.role.deleteRole);

  // ==================== 系统配置 ====================
  // @desc 获取系统配置列表
  router.get(`${prefix}/system/config`, controller.manage.systemConfig.list);
  // @desc 更新系统配置
  router.put(`${prefix}/system/config`, controller.manage.systemConfig.update);
  // @desc 删除系统配置
  router.delete(`${prefix}/system/config/:id`, controller.manage.systemConfig.removes);

  // ==================== 邮件模板 ====================
  // @desc 获取邮件模板列表
  router.get(`${prefix}/mail-templates`, controller.manage.mailTemplate.list);
  // @desc 获取邮件模板类型列表
  router.get(`${prefix}/mail-templates/types`, controller.manage.mailTemplate.typelist);
  // @desc 获取邮件模板详情
  router.get(`${prefix}/mail-templates/:id`, controller.manage.mailTemplate.getOne);
  // @desc 创建邮件模板
  router.post(`${prefix}/mail-templates`, controller.manage.mailTemplate.create);
  // @desc 更新邮件模板
  router.put(`${prefix}/mail-templates/:id`, controller.manage.mailTemplate.update);
  // @desc 删除邮件模板
  router.delete(`${prefix}/mail-templates/:id`, controller.manage.mailTemplate.removes);

  // ==================== 模板主题 ====================
  // @desc 获取模板列表
  router.get(`${prefix}/templates`, controller.manage.template.list);
  // @desc 获取当前激活的主题
  router.get(`${prefix}/templates/active`, controller.manage.template.getActiveTheme);
  // @desc 获取模板统计信息
  router.get(`${prefix}/templates/stats`, controller.manage.template.getStats);
  // @desc 从市场获取模板列表
  router.get(`${prefix}/templates/market`, controller.manage.template.getTempsFromShop);
  // @desc 从远程安装模板
  router.post(`${prefix}/templates/install/remote`, controller.manage.template.installFromRemote);
  // @desc 安装模板
  router.post(`${prefix}/templates/install`, controller.manage.template.install);
  // @desc 批量删除模板
  router.delete(`${prefix}/templates/batch`, controller.manage.template.deleteMany);
  // @desc 批量更新模板状态
  router.put(`${prefix}/templates/batch/status`, controller.manage.template.batchUpdateStatus);

  // @desc 获取模板详情（参数化路由，必须在特定路由之后）
  router.get(`${prefix}/templates/:id`, controller.manage.template.getOne);
  // @desc 创建模板
  router.post(`${prefix}/templates`, controller.manage.template.addOne);
  // @desc 更新模板
  router.put(`${prefix}/templates/:id`, controller.manage.template.updateOne);
  // @desc 删除模板
  router.delete(`${prefix}/templates/:id`, controller.manage.template.deleteOne);
  // @desc 激活模板
  router.put(`${prefix}/templates/:id/activate`, controller.manage.template.activate);
  // @desc 停用模板
  router.put(`${prefix}/templates/:id/deactivate`, controller.manage.template.deactivate);
  // @desc 卸载模板
  router.delete(`${prefix}/templates/:id/install`, controller.manage.template.uninstall);
  // @desc 导出模板
  router.get(`${prefix}/templates/:id/export`, controller.manage.template.export);
  // @desc 检查模板完整性
  router.get(`${prefix}/templates/:id/check`, controller.manage.template.checkIntegrity);
  // @desc 获取模板文件列表
  router.get(`${prefix}/templates/:id/files`, controller.manage.template.getTemplates);
  // @desc 更新模板统计
  router.put(`${prefix}/templates/:id/stats`, controller.manage.template.updateStats);
  // @desc 预览模板
  router.get(`${prefix}/templates/:id/preview`, controller.manage.template.preview);

  // ==================== 插件管理 ====================
  // @desc 获取插件列表
  router.get(`${prefix}/plugins`, controller.manage.plugin.list);
  // @desc 安装插件
  router.post(`${prefix}/plugins/install`, controller.manage.plugin.installPlugin);
  // @desc 插件心跳检测
  router.get(`${prefix}/plugins/heartbeat`, controller.manage.plugin.pluginHeartBeat);
  // @desc 获取插件市场列表
  router.get(`${prefix}/plugins/market`, controller.manage.plugin.getPluginShopList);
  // @desc 创建插件发票
  router.post(`${prefix}/plugins/invoices`, controller.manage.plugin.createInvoice);
  // @desc 检查插件发票
  router.post(`${prefix}/plugins/invoices/check`, controller.manage.plugin.checkInvoice);

  // @desc 卸载插件（参数化路由，必须在特定路由之后）
  router.delete(`${prefix}/plugins/:id`, controller.manage.plugin.unInstallPlugin);
  // @desc 更新插件
  router.put(`${prefix}/plugins/:id/update`, controller.manage.plugin.updatePlugin);
  // @desc 启用插件
  router.put(`${prefix}/plugins/:id/enable`, controller.manage.plugin.enablePlugin);
  // @desc 获取插件市场详情
  router.get(`${prefix}/plugins/market/:id`, controller.manage.plugin.getPluginShopItem);

  // ==================== 日志管理 ====================
  // @desc 获取日志列表
  router.get(`${prefix}/logs`, controller.manage.systemOptionLog.list);
  // @desc 清空所有日志
  router.delete(`${prefix}/logs/all`, controller.manage.systemOptionLog.removeAll);

  // @desc 删除日志（参数化路由，必须在特定路由之后）
  router.delete(`${prefix}/logs/:id`, controller.manage.systemOptionLog.removes);

  // ==================== 文件上传 ====================
  // @desc 上传文件
  router.post(`${prefix}/files`, controller.api.uploadFile.create);
  // @desc 获取文件列表
  router.get(`${prefix}/files`, controller.manage.uploadFile.list);
  // @desc 更新文件信息
  router.put(`${prefix}/files/:id`, controller.manage.uploadFile.update);
  // @desc 删除文件
  router.delete(`${prefix}/files/:id`, controller.manage.uploadFile.removes);

  // ==================== 缓存管理 ====================
  // @desc 获取缓存统计
  router.get(`${prefix}/cache/stats`, controller.manage.cacheMonitor.getCacheStats);
  // @desc 获取缓存配置
  router.get(`${prefix}/cache/config`, controller.manage.cacheMonitor.getCacheConfig);
  // @desc 获取缓存热点
  router.get(`${prefix}/cache/hotspots`, controller.manage.cacheMonitor.getCacheHotspots);
  // @desc 预热缓存
  router.post(`${prefix}/cache/warmup`, controller.manage.cacheMonitor.warmupCache);
  // @desc 清空缓存
  router.delete(`${prefix}/cache`, controller.manage.cacheMonitor.clearCache);
  // @desc 重置缓存统计
  router.delete(`${prefix}/cache/stats`, controller.manage.cacheMonitor.resetCacheStats);

  // ==================== Sitemap 管理 ====================
  // @desc 获取 Sitemap 状态
  router.get(`${prefix}/sitemap/status`, controller.manage.sitemap.getStatus);
  // @desc 刷新 Sitemap
  router.post(`${prefix}/sitemap/refresh`, controller.manage.sitemap.refresh);
  // @desc 清空 Sitemap 缓存
  router.delete(`${prefix}/sitemap/cache`, controller.manage.sitemap.clearCache);
  // @desc 预览 Sitemap
  router.get(`${prefix}/sitemap/preview`, controller.manage.sitemap.preview);
  // @desc 获取 Sitemap 配置
  router.get(`${prefix}/sitemap/config`, controller.manage.sitemap.getConfig);
  // @desc 更新 Sitemap 配置
  router.put(`${prefix}/sitemap/config`, controller.manage.sitemap.updateConfig);
  // @desc 测试 Sitemap 访问
  router.get(`${prefix}/sitemap/test`, controller.manage.sitemap.testAccess);

  // ==================== Webhook 管理 ====================
  // @desc 获取 Webhook 列表
  router.get(`${prefix}/webhooks`, controller.manage.webhook.list);
  // @desc 获取用户的 Webhook 统计信息
  router.get(`${prefix}/webhooks/stats`, controller.manage.webhook.getStats);
  // @desc 获取所有支持的事件列表
  router.get(`${prefix}/webhooks/events`, controller.manage.webhook.getEvents);
  // @desc 批量更新 Webhook 状态
  router.put(`${prefix}/webhooks/batch/status`, controller.manage.webhook.batchUpdateStatus);

  // @desc 获取 Webhook 详情（参数化路由，必须在特定路由之后）
  router.get(`${prefix}/webhooks/:id`, controller.manage.webhook.getOne);
  // @desc 创建 Webhook
  router.post(`${prefix}/webhooks`, controller.manage.webhook.create);
  // @desc 更新 Webhook
  router.put(`${prefix}/webhooks/:id`, controller.manage.webhook.update);
  // @desc 删除 Webhook
  router.delete(`${prefix}/webhooks/:id`, controller.manage.webhook.removes);
  // @desc 启用 Webhook
  router.put(`${prefix}/webhooks/:id/enable`, controller.manage.webhook.enable);
  // @desc 禁用 Webhook
  router.put(`${prefix}/webhooks/:id/disable`, controller.manage.webhook.disable);
  // @desc 重新生成 Webhook Secret
  router.post(`${prefix}/webhooks/:id/regenerate-secret`, controller.manage.webhook.regenerateSecret);
  // @desc 获取 Webhook 统计信息
  router.get(`${prefix}/webhooks/:id/stats`, controller.manage.webhook.getWebhookStats);

  // @desc 获取 Webhook 日志列表
  router.get(`${prefix}/webhooks/:id/logs`, controller.manage.webhook.getLogs);
  // @desc 获取 Webhook 日志详情
  router.get(`${prefix}/webhooks/:id/logs/:logId`, controller.manage.webhook.getLogDetail);
  // @desc 手动重试失败的 Webhook
  router.post(`${prefix}/webhooks/:id/logs/:logId/retry`, controller.manage.webhook.retryWebhook);
};
