'use strict';
module.exports = app => {
  const { router, controller } = app;

  router.get(
    ['/admin-center', '/admin-center/:page', '/admin-center/:page/:page1', '/admin-center/:page/:page1/:id'],
    controller.page.manage.getDataForAdminCenterIndex
  );

  /**
   * 系统配置
   * 此api名称尽量不要改
   */
  router.get('/manage/systemConfig/getConfig', controller.manage.systemConfig.list);

  router.post('/manage/systemConfig/addOne', controller.manage.systemConfig.update);

  router.post('/manage/systemConfig/updateConfig', controller.manage.systemConfig.update);

  router.post('/manage/systemConfig/deleteConfig', controller.manage.systemConfig.removes);

  /**
   * 模板主题管理
   */
  // 获取模板主题列表
  router.get('/manage/template/getList', controller.manage.template.list);

  // 获取单个模板主题详情
  router.get('/manage/template/getOne/:id', controller.manage.template.getOne);

  // 创建模板主题
  router.post('/manage/template/addOne', controller.manage.template.addOne);

  // 更新模板主题
  router.post('/manage/template/updateOne/:id', controller.manage.template.updateOne);

  // 删除模板主题
  router.post('/manage/template/deleteOne', controller.manage.template.deleteOne);

  // 批量删除模板主题
  router.post('/manage/template/deleteMany', controller.manage.template.deleteMany);

  // 激活模板主题
  router.post('/manage/template/activate/:id', controller.manage.template.activate);

  // 停用模板主题
  router.post('/manage/template/deactivate/:id', controller.manage.template.deactivate);

  // 获取当前激活的主题
  router.get('/manage/template/getActiveTheme', controller.manage.template.getActiveTheme);

  // 安装主题包
  router.post('/manage/template/installFromRemote', controller.manage.template.installFromRemote);

  // 模板安装主题包
  router.post('/manage/template/install', controller.manage.template.install);

  // 卸载主题
  router.post('/manage/template/uninstall/:id', controller.manage.template.uninstall);

  // 导出主题
  router.get('/manage/template/export/:id', controller.manage.template.export);

  // 检查主题完整性
  router.get('/manage/template/checkIntegrity/:id', controller.manage.template.checkIntegrity);

  // 获取主题模板文件列表
  router.get('/manage/template/getTemplates/:id', controller.manage.template.getTemplates);

  // 更新主题统计信息
  router.post('/manage/template/updateStats/:id', controller.manage.template.updateStats);

  // 批量更新主题状态
  router.post('/manage/template/batchUpdateStatus', controller.manage.template.batchUpdateStatus);

  // 获取主题统计信息
  router.get('/manage/template/getStats', controller.manage.template.getStats);

  // 获取主题市场列表
  router.get('/manage/template/getTempsFromShop', controller.manage.template.getTempsFromShop);

  // 预览主题
  router.get('/manage/template/preview/:id', controller.manage.template.preview);

  // 🎨 模板自动生成相关接口
  // 自动生成主题模板布局变体
  router.post('/manage/template/generateLayouts/:id', controller.manage.template.generateLayouts);

  // 批量生成主题模板
  router.post('/manage/template/batchGenerate/:id', controller.manage.template.batchGenerate);

  // 检查并生成缺失的模板文件
  router.post('/manage/template/checkMissingTemplates/:id', controller.manage.template.checkMissingTemplates);

  // 获取主题生成选项和状态
  router.get('/manage/template/getGenerationStatus/:id', controller.manage.template.getGenerationStatus);

  /**
   * 插件管理
   */

  //  获取已安装插件列表
  router.get('/manage/plugin/getList', controller.manage.plugin.list);

  //  安装
  router.get('/manage/plugin/installPlugin', controller.manage.plugin.installPlugin);

  // 卸载
  router.get('/manage/plugin/unInstallPlugin', controller.manage.plugin.unInstallPlugin);

  // 升级
  router.get('/manage/plugin/updatePlugin', controller.manage.plugin.updatePlugin);

  // 启用插件
  router.post('/manage/plugin/enablePlugin', controller.manage.plugin.enablePlugin);

  // 心跳
  router.get('/manage/plugin/pluginHeartBeat', controller.manage.plugin.pluginHeartBeat);

  // 获取插件市场列表
  router.get('/manage/plugin/getPluginShopList', controller.manage.plugin.getPluginShopList);

  // 获取插件市场插件详情
  router.get('/manage/plugin/getOneShopPlugin', controller.manage.plugin.getPluginShopItem);

  // 预创建订单
  router.post('/manage/plugin/createInvoice', controller.manage.plugin.createInvoice);

  // 订单校验
  router.post('/manage/plugin/checkInvoice', controller.manage.plugin.checkInvoice);

  // Menu routes
  router.get('/manage/menu/getList', controller.manage.menu.getList);
  router.post('/manage/menu/addOne', controller.manage.menu.addOne);
  router.post('/manage/menu/updateOne', controller.manage.menu.updateOne);
  router.post('/manage/menu/deleteMenu', controller.manage.menu.deleteMenu);
  router.post('/manage/menu/updateOrder', controller.manage.menu.updateOrder);
  router.post('/manage/menu/batchUpdateStatus', controller.manage.menu.batchUpdateStatus);

  // Role routes
  router.get('/manage/role/getList', controller.manage.role.getList);
  router.get('/manage/role/getAllList', controller.manage.role.getAllList);
  router.post('/manage/role/addOne', controller.manage.role.addOne);
  router.post('/manage/role/updateOne', controller.manage.role.updateOne);
  router.post('/manage/role/deleteRole', controller.manage.role.deleteRole);

  // User routes
  router.get('/manage/admin/getList', controller.manage.admin.getList);
  router.post('/manage/admin/addOne', controller.manage.admin.addOne);
  router.post('/manage/admin/updateOne', controller.manage.admin.updateOne);
  router.post('/manage/admin/deleteUser', controller.manage.admin.deleteUser);
  router.get('/manage/admin/getUserInfo', controller.manage.admin.getUserInfo);
  router.get('/manage/admin/getUserRoutes', controller.manage.admin.getUserRoutes);
  router.get('/manage/admin/logOut', controller.manage.admin.logOutAction);

  // ManageRouters
  // 获取广告列表
  router.get('/manage/ads/getList', controller.manage.ads.list);

  // 获取单条广告信息
  router.get('/manage/ads/getOne', controller.manage.ads.getOne);

  // 添加单个广告
  router.post('/manage/ads/addOne', controller.manage.ads.create);

  // 更新广告信息
  router.post('/manage/ads/updateOne', controller.manage.ads.update);

  // 删除广告
  router.post('/manage/ads/delete', controller.manage.ads.removes);

  // 获取文档列表
  router.get('/manage/content/getList', controller.manage.content.list);

  // 获取单条文档信息
  router.get('/manage/content/getContent', controller.manage.content.getOne);

  // 添加单个文档
  router.post('/manage/content/addOne', controller.manage.content.create);

  // 更新文档信息
  router.post('/manage/content/updateOne', controller.manage.content.update);

  // 批量更新文档信息
  router.post('/manage/content/updateContents', controller.manage.content.updateContents);

  // 删除文档
  router.post('/manage/content/deleteContent', controller.manage.content.removes);

  // 文档推荐
  router.post('/manage/content/topContent', controller.manage.content.updateContentToTop);

  // 文档置顶
  router.post('/manage/content/roofContent', controller.manage.content.roofPlacement);

  // 分配用户
  router.post('/manage/content/redictContentToUsers', controller.manage.content.redictContentToUsers);

  // 绑定编辑
  router.post('/manage/content/updateContentEditor', controller.manage.content.updateContentEditor);

  // 更新类别
  router.post('/manage/content/moveCate', controller.manage.content.moveCate);

  // 获取类别列表
  router.get('/manage/contentCategory/getList', controller.manage.contentCategory.list);

  // 获取单条类别信息
  router.get('/manage/contentCategory/getOne', controller.manage.contentCategory.getOne);

  // 添加单个类别
  router.post('/manage/contentCategory/addOne', controller.manage.contentCategory.create);

  // 更新类别信息
  router.post('/manage/contentCategory/updateOne', controller.manage.contentCategory.update);

  // 删除类别
  router.post('/manage/contentCategory/deleteCategory', controller.manage.contentCategory.removes);

  // 获取留言列表
  router.get('/manage/contentMessage/getList', controller.manage.contentMessage.list);

  // 获取单条留言信息
  router.get('/manage/contentMessage/getOne', controller.manage.contentMessage.getOne);

  // 添加单个留言
  router.post('/manage/contentMessage/addOne', controller.manage.contentMessage.create);

  // 删除留言
  router.post('/manage/contentMessage/deleteMessage', controller.manage.contentMessage.removes);

  // 🔥 新增：批量更新留言状态
  router.post('/manage/contentMessage/batchUpdateState', controller.manage.contentMessage.batchUpdateState);

  // 🔥 新增：获取留言统计信息
  router.get('/manage/contentMessage/getStats', controller.manage.contentMessage.getStats);

  // 🔥 新增：审核留言
  router.post('/manage/contentMessage/auditMessage', controller.manage.contentMessage.auditMessage);

  // 🔥 新增：批量审核留言
  router.post('/manage/contentMessage/batchAuditMessages', controller.manage.contentMessage.batchAuditMessages);

  // 获取标签列表
  router.get('/manage/contentTag/getList', controller.manage.contentTag.list);

  // 获取单条标签信息
  router.get('/manage/contentTag/getOne', controller.manage.contentTag.getOne);

  // 添加单个标签
  router.post('/manage/contentTag/addOne', controller.manage.contentTag.create);

  // 更新标签信息
  router.post('/manage/contentTag/updateOne', controller.manage.contentTag.update);

  // 删除标签
  router.post('/manage/contentTag/deleteTag', controller.manage.contentTag.removes);

  // 获取邮件模板列表
  router.get('/manage/mailTemplate/getList', controller.manage.mailTemplate.list);

  // 获取邮件模板类别列表
  router.get('/manage/mailTemplate/getTypeList', controller.manage.mailTemplate.typelist);

  // 获取单条邮件模板信息
  router.get('/manage/mailTemplate/getOne', controller.manage.mailTemplate.getOne);

  // 添加单个邮件模板
  router.post('/manage/mailTemplate/addOne', controller.manage.mailTemplate.create);

  // 更新邮件模板信息
  router.post('/manage/mailTemplate/updateOne', controller.manage.mailTemplate.update);

  // 删除邮件模板
  router.post('/manage/mailTemplate/delete', controller.manage.mailTemplate.removes);

  // 获取会员列表
  router.get('/manage/regUser/getList', controller.manage.regUser.list);

  // 获取单条会员信息
  router.get('/manage/regUser/getOne', controller.manage.regUser.getOne);

  // 更新会员信息
  router.post('/manage/regUser/updateOne', controller.manage.regUser.update);

  // 删除会员
  router.post('/manage/regUser/deleteUser', controller.manage.regUser.removes);

  // 获取日志列表
  router.get('/manage/systemOptionLog/getList', controller.manage.systemOptionLog.list);

  // 删除单条日志
  router.post('/manage/systemOptionLog/deleteLogItem', controller.manage.systemOptionLog.removes);

  // 清空日志
  router.post('/manage/systemOptionLog/deleteAllLogItem', controller.manage.systemOptionLog.removeAll);

  // 获取文件上传列表
  router.get('/manage/uploadFile/getList', controller.manage.uploadFile.list);

  // 更新文件上传信息
  router.post('/manage/uploadFile/updateOne', controller.manage.uploadFile.update);

  // 删除文件上传
  router.post('/manage/uploadFile/delete', controller.manage.uploadFile.removes);

  // ============== 缓存监控管理 ==============

  // 获取缓存统计信息
  router.get('/manage/cache/stats', controller.manage.cacheMonitor.getCacheStats);

  // 获取缓存配置
  router.get('/manage/cache/config', controller.manage.cacheMonitor.getCacheConfig);

  // 获取缓存热点分析
  router.get('/manage/cache/hotspots', controller.manage.cacheMonitor.getCacheHotspots);

  // 手动触发缓存预热
  router.post('/manage/cache/warmup', controller.manage.cacheMonitor.warmupCache);

  // 清理缓存
  router.post('/manage/cache/clear', controller.manage.cacheMonitor.clearCache);

  // 重置缓存统计信息
  router.post('/manage/cache/resetStats', controller.manage.cacheMonitor.resetCacheStats);

  /**
   * 🔥 Sitemap 管理路由 (新增)
   */
  // 获取 Sitemap 状态
  router.get('/manage/sitemap/status', controller.manage.sitemap.getStatus);

  // 手动刷新 Sitemap
  router.post('/manage/sitemap/refresh', controller.manage.sitemap.refresh);

  // 清除 Sitemap 缓存
  router.post('/manage/sitemap/clearCache', controller.manage.sitemap.clearCache);

  // 预览 Sitemap
  router.get('/manage/sitemap/preview', controller.manage.sitemap.preview);

  // 获取 Sitemap 配置
  router.get('/manage/sitemap/config', controller.manage.sitemap.getConfig);

  // 更新 Sitemap 配置
  router.post('/manage/sitemap/config', controller.manage.sitemap.updateConfig);

  // 测试 Sitemap 访问
  router.get('/manage/sitemap/test', controller.manage.sitemap.testAccess);
};
