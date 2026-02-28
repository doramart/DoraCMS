/**
 * API v1 路由
 * 所有 v1 版本的 API 路由定义
 *
 * 路由格式：/api/v1/resource
 *
 * 注意：
 * 1. 保持向后兼容，不要破坏现有 API
 * 2. 新功能优先在 v1 中实现
 * 3. 未来版本（v2, v3）可以在此基础上扩展
 * 4. 健康检查接口不包含版本号，保留在 /api/health
 */
'use strict';

module.exports = app => {
  const { router, controller } = app;
  const authApiToken = app.middleware.authApiToken({});

  // ==================== 系统配置 ====================
  router.get('/api/v1/system/config', controller.api.systemConfig.list);

  // ==================== 内容管理 ====================
  // 获取内容列表
  router.get('/api/v1/content', controller.api.content.list);

  // 特定路由（必须在 :id 之前）
  router.get('/api/v1/content/random', controller.api.content.getRadomContents);
  router.get('/api/v1/content/random/images', controller.api.content.getRandomContentImg);
  router.get('/api/v1/content/hot-tag-ids', controller.api.content.getHotTagIds);
  router.post('/api/v1/content/word-to-html', controller.api.content.getWordHtmlContent);

  // 参数化路由（必须在特定路由之后）
  // 获取单个内容
  router.get('/api/v1/content/:id', controller.api.content.getOneContent);

  // 创建内容（需要认证）
  router.post('/api/v1/content', authApiToken, controller.api.content.addContent);

  // 更新内容（需要认证）
  router.put('/api/v1/content/:id', authApiToken, controller.api.content.updateContent);

  // 删除单个内容（需要认证）
  router.delete('/api/v1/content/:id', authApiToken, controller.api.content.deleteContent);

  // 批量删除内容（需要认证）
  router.delete('/api/v1/content', authApiToken, controller.api.content.deleteContents);

  // 点赞/取消点赞内容
  router.post('/api/v1/content/:id/like', authApiToken, controller.api.content.likeContent);

  // 收藏/取消收藏内容
  router.post('/api/v1/content/:id/favorite', authApiToken, controller.api.content.favoriteContent);

  // 获取附近内容
  router.get('/api/v1/content/:id/nearby', controller.api.content.getNearbyContent);

  // 获取上一篇/下一篇
  router.get('/api/v1/content/:id/navigation', controller.api.content.getPrevNextPosts);

  // 上传封面图
  router.post('/api/v1/content/:id/cover', authApiToken, controller.api.content.uploadPreviewImgByBase64);

  // ==================== 内容分类 ====================
  router.get('/api/v1/categories', controller.api.contentCategory.list);
  router.get('/api/v1/categories/tree', controller.api.contentCategory.treelist);
  router.get('/api/v1/categories/:id', controller.api.contentCategory.getOne);
  router.get('/api/v1/categories/:id/ancestors', controller.api.contentCategory.getCurrentCategoriesById);
  router.get('/api/v1/categories/:id/content-count', controller.api.content.getContentCountsByCateId);

  // ==================== 标签管理 ====================
  router.get('/api/v1/tags', controller.api.contentTag.list);
  // 特定路由（必须在 POST /tags 之前）
  router.get('/api/v1/tags/hot', controller.api.contentTag.hot);
  router.post('/api/v1/tags/search', controller.api.contentTag.searchByNames);
  router.post('/api/v1/tags/findOrCreate', controller.api.contentTag.findOrCreateByNames);
  // 创建标签（集合 POST，必须在特定路由之后）
  router.post('/api/v1/tags', authApiToken, controller.api.contentTag.create);

  // ==================== 留言评论 ====================
  router.get('/api/v1/messages', controller.api.contentMessage.list);
  router.post('/api/v1/messages', authApiToken, controller.api.contentMessage.postMessages);
  router.post('/api/v1/messages/:id/like', authApiToken, controller.api.contentMessage.praiseMessage);
  router.delete('/api/v1/messages/:id/like', authApiToken, controller.api.contentMessage.unpraiseMessage);
  router.post('/api/v1/messages/:id/dislike', authApiToken, controller.api.contentMessage.despiseMessage);
  router.delete('/api/v1/messages/:id/dislike', authApiToken, controller.api.contentMessage.undespiseMessage);

  // ==================== 邮件模板 ====================
  router.get('/api/v1/mail-templates', controller.api.mailTemplate.list);
  router.get('/api/v1/mail-templates/:id', controller.api.mailTemplate.getOne);
  router.get('/api/v1/mail-templates/types', controller.api.mailTemplate.typelist);
  // 注意：邮件发送功能仅通过内部 service 调用（注册验证码、密码重置等），不对外暴露 API 端点

  // ==================== 广告管理 ====================
  router.get('/api/v1/ads/:id', controller.api.ads.getOne);

  // ==================== 文件上传 ====================
  router.post('/api/v1/files', authApiToken, controller.api.uploadFile.create);
  // 注意：/api/v1/files/path 接口存在严重安全漏洞（任意文件读取+删除），已删除
  // 注意：UEditor 上传接口已废弃，前端使用 /api/v1/files

  // ==================== 用户认证 ====================
  router.post('/api/v1/auth/login', controller.api.regUser.loginAction);
  router.post('/api/v1/auth/register', controller.api.regUser.regAction);
  router.post('/api/v1/auth/logout', authApiToken, controller.api.regUser.logOut);
  router.post('/api/v1/auth/refresh', authApiToken, controller.api.regUser.refreshToken);
  router.post('/api/v1/auth/reset-password', controller.api.regUser.updateNewPsd);
  router.post('/api/v1/auth/send-code', controller.api.regUser.sendVerificationCode);

  // ==================== 用户信息 ====================
  router.get('/api/v1/users/me', authApiToken, controller.api.regUser.getUserInfoBySession);
  router.put('/api/v1/users/me', authApiToken, controller.api.regUser.updateUser);
  router.post('/api/v1/users/me/password', authApiToken, controller.api.regUser.modifyMyPsd);
  router.get('/api/v1/users/me/has-password', authApiToken, controller.api.regUser.checkHadSetLoginPassword);
  router.post('/api/v1/users/me/bindings', authApiToken, controller.api.regUser.bindEmailOrPhoneNum);
  router.post('/api/v1/users/:userId/following/:creatorId', authApiToken, controller.api.regUser.followCreator);
  router.post('/api/v1/users/:userId/tags', authApiToken, controller.api.regUser.addTags);
  router.get('/api/v1/users/me/following', authApiToken, controller.api.regUser.getMyFollowInfos);
  router.post('/api/v1/users/me/confirm-email', controller.api.regUser.sentConfirmEmail);
  router.get('/api/v1/users/check-phone', controller.api.regUser.checkPhoneNumExist);
  router.post('/api/v1/content/:id/dislike', authApiToken, controller.api.regUser.despiseContent);
  // 获取用户内容列表
  router.get('/api/v1/users/:userId/contents', authApiToken, controller.api.content.list);
  // 获取我的收藏
  router.get('/api/v1/users/me/favorites', authApiToken, controller.api.content.getMyFavoriteContents);
  // 游客登录
  router.post('/api/v1/auth/login/guest', controller.api.regUser.touristLoginAction);

  // ==================== API Key 管理 ====================
  router.get('/api/v1/user/api-keys', authApiToken, controller.api.apiKey.list);
  router.post('/api/v1/user/api-keys', authApiToken, controller.api.apiKey.create);
  router.get('/api/v1/user/api-keys/:id', authApiToken, controller.api.apiKey.detail);
  router.put('/api/v1/user/api-keys/:id', authApiToken, controller.api.apiKey.update);
  router.delete('/api/v1/user/api-keys/:id', authApiToken, controller.api.apiKey.delete);
  router.put('/api/v1/user/api-keys/:id/enable', authApiToken, controller.api.apiKey.enable);
  router.put('/api/v1/user/api-keys/:id/disable', authApiToken, controller.api.apiKey.disable);
  router.post('/api/v1/user/api-keys/:id/rotate', authApiToken, controller.api.apiKey.rotate);

  // ==================== 模板主题 ====================
  // 集合路由
  router.get('/api/v1/template', controller.api.template.getThemes);
  // 特定路由（必须在 :slug 之前）
  router.get('/api/v1/template/active', controller.api.template.getActiveTheme);
  // 参数化路由（必须在特定路由之后）
  router.get('/api/v1/template/:slug', controller.api.template.getThemeDetail);
  router.get('/api/v1/template/:slug/config', controller.api.template.getThemeConfig);
  router.get('/api/v1/template/:slug/stats', controller.api.template.getThemeStats);
  router.post('/api/v1/template/:id/download', controller.api.template.incrementDownload);
  router.post('/api/v1/template/:id/rate', controller.api.template.rateTheme);

  // ==================== 文件上传 ====================
  router.post('/api/v1/upload/files', authApiToken, controller.api.uploadFile.create);
  router.post('/api/v1/upload/path', authApiToken, controller.api.uploadFile.createFileByPath);

  // ==================== 管理员认证 ====================
  router.post('/api/v1/admin/login', controller.api.admin.loginUser);
  router.get('/api/v1/admin/init/status', controller.api.admin.getInitStatus);
  router.post('/api/v1/admin/init', controller.api.admin.initSuperAdmin);
};
