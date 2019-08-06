/*
 * @Author: doramart 
 * @Date: 2019-07-16 09:21:36 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-30 14:52:17
 */

const express = require('express')
const router = express.Router()
router.caseSensitive = true
router.strict = true


const {
  AdminUserController,
  AdminGroupController,
  AdminResourceController,
  ContentCategoryController,
  ContentController,
  ContentTagController,
  UserController,
  MessageController,
  SystemConfigController,
  DataOptionLogController,
  SystemOptionLogController,
  UserNotifyController,
  NotifyController,
  AdsController,
  ContentTemplateController,
  SiteMessageController,
  HelpCenterController,
  VersionManageController,
  //MgRoutersController
} = require('../lib/controller/manage/index')
const settings = require('@configs/settings');

// 管理员退出
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('admin_' + settings.auth_cookie_name, {
    path: '/'
  });
  res.send({
    status: 200
  });
});

// 获取管理员信息
router.get('/getUserSession', (req, res, next) => {
  if (req.session.adminlogined) {
    next()
  } else {
    res.send({
      data: {
        state: false,
        userInfo: {}
      }
    });
  }
}, AdminUserController.getUserSession)

// 获取后台基础信息
router.get('/getSitBasicInfo', AdminUserController.getBasicSiteInfo)

/**
 * 管理员管理
 */
router.get('/adminUser/getList', AdminUserController.list)

router.get('/adminUser/getOne', AdminUserController.getOne)

router.post('/adminUser/addOne', AdminUserController.create)

router.post('/adminUser/updateOne', AdminUserController.update)

router.get('/adminUser/deleteUser', AdminUserController.removes)


/**
 * 角色管理
 */
router.get('/adminGroup/getList', AdminGroupController.list)

router.get('/adminGroup/getOne', AdminGroupController.getOne)

router.post('/adminGroup/addOne', AdminGroupController.create)

router.post('/adminGroup/updateOne', AdminGroupController.update)

router.get('/adminGroup/deleteGroup', AdminGroupController.removes)


/**
 * 资源管理
 * 
 */

router.get('/adminResource/getList', AdminResourceController.list)

router.get('/adminResource/getOne', AdminResourceController.getOne)

router.post('/adminResource/addOne', AdminResourceController.create)

router.post('/adminResource/updateOne', AdminResourceController.update)

router.get('/adminResource/deleteResource', AdminResourceController.removes)

/**
 * 系统配置
 * 此api名称尽量不要改
 */
router.get('/systemConfig/getConfig', SystemConfigController.list)

router.post('/systemConfig/updateConfig', SystemConfigController.update)


/**
 * 文档类别管理
 * 
 */

router.get('/contentCategory/getList', ContentCategoryController.list)

router.get('/contentCategory/getOne', ContentCategoryController.getOne)

router.post('/contentCategory/addOne', ContentCategoryController.create)

router.post('/contentCategory/updateOne', ContentCategoryController.update)

router.get('/contentCategory/deleteCategory', ContentCategoryController.removes)

/**
 * 文档管理
 * 
 */

router.get('/content/getList', ContentController.list)

router.get('/content/getContent', ContentController.getOne)

router.post('/content/addOne', ContentController.create)

router.post('/content/updateOne', ContentController.update)

router.post('/content/topContent', ContentController.updateContentToTop)

router.post('/content/roofContent', ContentController.roofPlacement)

router.get('/content/deleteContent', ContentController.removes)
// 给文章分配用户
router.post('/content/redictContentToUsers', ContentController.redictContentToUsers)

/**
 * tag管理
 */
router.get('/contentTag/getList', ContentTagController.list)

router.get('/contentTag/getOne', ContentTagController.getOne)

router.post('/contentTag/addOne', ContentTagController.create)

router.post('/contentTag/updateOne', ContentTagController.update)

router.get('/contentTag/deleteTag', ContentTagController.removes)


/**
 * 留言管理
 */
router.get('/contentMessage/getList', MessageController.list)

router.get('/contentMessage/getOne', MessageController.getOne)

router.post('/contentMessage/addOne', MessageController.create)

router.get('/contentMessage/deleteMessage', MessageController.removes)

/**
 * 注册用户管理
 */
router.get('/regUser/getList', UserController.list)

router.get('/regUser/getOne', UserController.getOne)

router.post('/regUser/updateOne', UserController.update)

router.get('/regUser/deleteUser', UserController.removes)


/**
 * 数据备份
 */

//获取备份数据列表
router.get('/backupDataManage/getBakList', DataOptionLogController.list);

//备份数据库执行
router.post('/backupDataManage/backUp', DataOptionLogController.backUpData);

//删除备份数据
router.get('/backupDataManage/deleteDataItem', DataOptionLogController.removes);

/**
 * 系统操作日志
 */

router.get('/systemOptionLog/getList', SystemOptionLogController.list);

//删除操作日志
router.get('/systemOptionLog/deleteLogItem', SystemOptionLogController.removes);

// 清空日志
router.get('/systemOptionLog/deleteAllLogItem', SystemOptionLogController.removeAll);


/**
 * 系统消息
 */

router.get('/systemNotify/getList', UserNotifyController.list);

//删除操作日志
router.get('/systemNotify/deleteNotifyItem', UserNotifyController.removes);

// 设为已读消息
router.get('/systemNotify/setHasRead', UserNotifyController.setMessageHasRead);


/**
 * 系统公告
 */
router.get('/systemAnnounce/getList', NotifyController.list);

// 删除公告
router.get('/systemAnnounce/deleteItem', NotifyController.removes);

//发布系统公告
router.post('/systemAnnounce/addOne', NotifyController.create);


/**
 * 广告管理
 */

router.get('/ads/getList', AdsController.list);

// 获取单个广告
router.get('/ads/getOne', AdsController.getOne);

// 新增广告
router.post('/ads/addOne', AdsController.create);

// 更新单个广告
router.post('/ads/updateOne', AdsController.update);

// 删除广告
router.get('/ads/delete', AdsController.removes);


/**
 * 模板管理
 */
// 获取模板文件列表
router.get('/template/getTemplateForderList', ContentTemplateController.getContentDefaultTemplate);

// 读取文件内容
router.get('/template/getTemplateFileText', ContentTemplateController.getFileInfo);

// 更新文件内容
router.post('/template/updateTemplateFileText', ContentTemplateController.updateFileInfo);

// 获取已安装的模板列表
router.get('/template/getMyTemplateList', ContentTemplateController.getMyTemplateList);

// 新增模板单元
router.post('/template/addTemplateItem', ContentTemplateController.addTemplateItem);

// 删除模板单元
router.get('/template/delTemplateItem', ContentTemplateController.delTemplateItem);

// 获取默认模板的模板单元列表
router.get('/template/getTemplateItemlist', ContentTemplateController.getTempItemForderList);

// 获取模板市场中的模板列表
router.get('/template/getTempsFromShop', ContentTemplateController.getTempsFromShop);

// 安装模板
router.get('/template/installTemp', ContentTemplateController.installTemp);

//上传自定义模板
router.post('/template/uploadCMSTemplate', ContentTemplateController.uploadCMSTemplate);

// 启用模板
router.get('/template/enableTemp', ContentTemplateController.enableTemp);

// 卸载模板
router.get('/template/uninstallTemp', ContentTemplateController.uninstallTemp);

/**
 * 消息推送
 */
router.post('/siteMessage/getList', SiteMessageController.list);

router.get('/siteMessage/delete', SiteMessageController.removes);


/**
 * 帮助中心
 */
router.get('/helpCenter/getList', HelpCenterController.list);

router.get('/helpCenter/getOne', HelpCenterController.getOne);

router.post('/helpCenter/addOne', HelpCenterController.create);

router.post('/helpCenter/updateOne', HelpCenterController.update);

router.get('/helpCenter/delete', HelpCenterController.removes);


/**
 * APP版本管理
 */

router.get('/versionManage/getList', VersionManageController.list);

router.post('/versionManage/updateOne', VersionManageController.update);

//ManageRouters
module.exports = router