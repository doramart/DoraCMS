'use strict';
module.exports = app => {
  const { router, controller } = app;
  const authApiToken = app.middleware.authApiToken({});

  // 健康检查端点（用于Docker健康检查）
  router.get('/api/health', controller.api.health.check);
  router.get('/api/health/alive', controller.api.health.alive);
  router.get('/api/health/ready', controller.api.health.ready);

  router.get('/api/getImgCode', controller.page.home.getImgCode);
  router.get('/api/createQRCode', controller.page.home.createQRCode);

  /**
   * 模板主题相关API
   */
  // 获取当前激活的主题信息
  router.get('/api/template/getActiveTheme', controller.api.template.getActiveTheme);

  // 获取主题列表（公开）
  router.get('/api/template/getThemes', controller.api.template.getThemes);

  // 获取主题详情
  router.get('/api/template/getThemeDetail/:slug', controller.api.template.getThemeDetail);

  // 获取主题配置
  router.get('/api/template/getThemeConfig/:slug?', controller.api.template.getThemeConfig);

  // 获取主题统计信息
  router.get('/api/template/getThemeStats', controller.api.template.getThemeStats);

  // 增加主题下载次数
  router.post('/api/template/incrementDownload/:id', controller.api.template.incrementDownload);

  // 主题评分
  router.post('/api/template/rateTheme/:id', controller.api.template.rateTheme);

  // 检查主题更新
  router.get('/api/template/checkUpdate/:slug', controller.api.template.checkUpdate);
  // router.get(['/dr-admin', '/admin/login'], controller.api.admin.login);
  // router.post(`/api/admin/doLogin`, controller.api.admin.loginAction);
  router.post('/api/admin/login', controller.api.admin.loginUser);
  router.get('/api/admin/init/status', controller.api.admin.getInitStatus);
  router.post('/api/admin/init', controller.api.admin.initSuperAdmin);
  router.get('/api/systemConfig/getConfig', controller.api.systemConfig.list);

  // ApiRouters
  // 获取单条广告
  router.get('/api/ads/getOne', controller.api.ads.getOne);

  // 获取收藏的文档列表
  router.get('/api/content/getMyFavoriteContents', authApiToken, controller.api.content.getMyFavoriteContents);

  // 获取用户的文档列表
  router.get('/api/content/getUserContents', authApiToken, controller.api.content.list);

  // 获取文档列表
  router.get('/api/content/getList', controller.api.content.list);

  // 获取随机文档列表
  router.get('/api/content/getRadomContents', controller.api.content.getRadomContents);

  // 获取随机文档首图
  router.get('/api/content/getRandomContentImg', controller.api.content.getRandomContentImg);

  // 获取单个文档信息
  router.get('/api/content/getContent', controller.api.content.getOneContent);

  // 获取Word文档Html信息
  router.post('/api/content/getWordHtmlContent', controller.api.content.getWordHtmlContent);

  // 新增文档
  router.post('/api/content/addOne', authApiToken, controller.api.content.addContent);

  // 更新文档
  router.post('/api/content/updateOne', authApiToken, controller.api.content.updateContent);

  // 相关内容
  router.get('/api/content/getNearbyContent', controller.api.content.getNearbyContent);

  // 上一篇/下一篇文章
  router.get('/api/content/getPrevNextPosts', controller.api.content.getPrevNextPosts);

  // 上传封面
  router.post('/api/content/uploadCover', controller.api.content.uploadPreviewImgByBase64);

  // 根据分类获取分类下文档总数
  router.get('/api/content/getContentCountsByCateId', controller.api.content.getContentCountsByCateId);

  // 获取热门标签id列表
  router.get('/api/content/getHotTagIds', controller.api.content.getHotTagIds);

  // 获取类别列表
  router.get('/api/contentCategory/getList', controller.api.contentCategory.list);

  // 获取带树形结构的类别列表
  router.get('/api/contentCategory/getTreelist', controller.api.contentCategory.treelist);

  // 根据id获取分类
  router.get('/api/contentCategory/getCurrentCategoriesById', controller.api.contentCategory.getCurrentCategoriesById);

  // 获取单条类别信息
  router.get('/api/contentCategory/getOne', controller.api.contentCategory.getOne);

  // 发表留言
  router.post('/api/contentMessage/postMessages', authApiToken, controller.api.contentMessage.postMessages);

  // 获取留言列表
  router.get('/api/contentMessage/getMessages', controller.api.contentMessage.list);

  // 🔥 新增：点赞留言
  router.post('/api/contentMessage/praiseMessage', authApiToken, controller.api.contentMessage.praiseMessage);

  // 🔥 新增：取消点赞留言
  router.post('/api/contentMessage/unpraiseMessage', authApiToken, controller.api.contentMessage.unpraiseMessage);

  // 🔥 新增：踩留言
  router.post('/api/contentMessage/despiseMessage', authApiToken, controller.api.contentMessage.despiseMessage);

  // 🔥 新增：取消踩留言
  router.post('/api/contentMessage/undespiseMessage', authApiToken, controller.api.contentMessage.undespiseMessage);

  // 获取标签列表
  router.get('/api/contentTag/getList', controller.api.contentTag.list);

  // 获取热门标签列表
  router.get('/api/contentTag/getHotList', controller.api.contentTag.hot);

  // 根据标签名称搜索标签
  router.post('/api/contentTag/searchByNames', controller.api.contentTag.searchByNames);

  // 🔥 AI标签智能处理：查找或创建标签
  router.post('/api/contentTag/findOrCreateByNames', controller.api.contentTag.findOrCreateByNames);

  // 创建标签
  router.post('/api/contentTag/addOne', authApiToken, controller.api.contentTag.create);

  // 获取邮件模板列表
  router.get('/api/mailTemplate/getList', controller.api.mailTemplate.list);

  // 获取邮件模板列表
  router.get('/api/mailTemplate/getOne', controller.api.mailTemplate.getOne);

  // 获取邮件模板类别列表
  router.get('/api/mailTemplate/getTypeList', controller.api.mailTemplate.typelist);

  // 发送邮件
  router.post('/api/mailTemplate/sendEmail', controller.api.mailTemplate.sendEmail);

  // 发送验证码
  router.post('/api/user/sendVerificationCode', controller.api.regUser.sendVerificationCode);

  // 用户登录
  router.post('/api/user/doLogin', controller.api.regUser.loginAction);

  // 游客登录
  router.post('/api/user/touristLogin', controller.api.regUser.touristLoginAction);

  // 用户注册
  router.post('/api/user/doReg', controller.api.regUser.regAction);

  // 信息绑定
  router.post('/api/user/bindInfo', authApiToken, controller.api.regUser.bindEmailOrPhoneNum);

  // 重设密码
  router.post('/api/user/resetPassword', controller.api.regUser.resetMyPassword);

  // 修改密码
  router.post('/api/user/modifyMyPsd', authApiToken, controller.api.regUser.modifyMyPsd);

  // 获取用户信息
  router.get('/api/user/userInfo', authApiToken, controller.api.regUser.getUserInfoBySession);

  // 关注作者
  router.get('/api/user/followCreator', authApiToken, controller.api.regUser.followCreator);

  // 关注标签
  router.get('/api/user/addTags', authApiToken, controller.api.regUser.addTags);



  // 踩帖
  router.get('/api/user/despiseContent', authApiToken, controller.api.regUser.despiseContent);

  // ========== 🔥 新增：RESTful 风格路由 ==========
  
  // 点赞/取消点赞内容 - RESTful 风格
  // 用法: POST /api/content/:id/like?action=like 或 POST /api/content/:id/like?action=unlike
  router.post('/api/content/:id/like', authApiToken, controller.api.content.likeContent);

  // 收藏/取消收藏内容 - RESTful 风格
  // 用法: POST /api/content/:id/favorite?action=add 或 POST /api/content/:id/favorite?action=remove
  router.post('/api/content/:id/favorite', authApiToken, controller.api.content.favoriteContent);

  // 检测手机号是否存在
  router.get('/api/user/checkPhoneNumExist', controller.api.regUser.checkPhoneNumExist);

  // 检测是否已设置登录密码
  router.get('/api/user/checkHadSetLoginPassword', authApiToken, controller.api.regUser.checkHadSetLoginPassword);

  // 更新用户信息
  router.post('/api/user/updateInfo', authApiToken, controller.api.regUser.updateUser);

  // 获取我关注的信息
  router.get('/api/user/getMyFollowInfos', authApiToken, controller.api.regUser.getMyFollowInfos);

  // 退出登录
  router.get('/api/user/logOut', authApiToken, controller.api.regUser.logOut);

  // 发送确认邮件
  router.post('/api/user/sentConfirmEmail', controller.api.regUser.sentConfirmEmail);

  // 设置新密码
  router.post('/api/user/updateNewPsd', controller.api.regUser.updateNewPsd);

  // 重设密码链接
  router.get('/api/user/reset_pass', controller.api.regUser.reSetPass);

  // 文件上传
  router.post('/api/upload/files', controller.api.uploadFile.create);

  // 文件上传(根据路径)
  router.post('/api/upload/filePath', controller.api.uploadFile.createFileByPath);

  // 文件上传初始化配置
  router.get('/api/upload/ueditor', controller.api.uploadFile.ueditor);

  // 文件上传
  router.post('/api/upload/ueditor', controller.api.uploadFile.ueditor);

  // API Key 管理
  router.get('/api/user/api-key/list', authApiToken, controller.api.apiKey.list);

  // 创建 API Key
  router.post('/api/user/api-key/create', authApiToken, controller.api.apiKey.create);

  // 更新 API Key
  router.put('/api/user/api-key/update/:id', authApiToken, controller.api.apiKey.update);

  // 删除 API Key
  router.post('/api/user/api-key/delete', authApiToken, controller.api.apiKey.delete);

  // 启用 API Key
  router.put('/api/user/api-key/enable/:id', authApiToken, controller.api.apiKey.enable);

  // 禁用 API Key
  router.put('/api/user/api-key/disable/:id', authApiToken, controller.api.apiKey.disable);

  // 轮换 API Key
  router.put('/api/user/api-key/rotate/:id', authApiToken, controller.api.apiKey.rotate);

  // 获取 API Key 详情
  router.get('/api/user/api-key/detail/:id', authApiToken, controller.api.apiKey.detail);
};
