'use strict';
module.exports = (app) => {
  const { router, controller } = app;

  const authPage = app.middleware.authPage({});

  // 用户登录
  router.get('/users/login', controller.page.user.getDataForUserLogin);

  // 用户注册
  router.get('/users/reg', controller.page.user.getDataForUserReg);

  // 用户中心
  router.get(
    '/users/userCenter',
    authPage,
    controller.page.user.getDataForUserIndex
  );

  // 修改用户密码页面
  router.get(
    '/users/setUserPsd',
    authPage,
    controller.page.user.getDataForSetUserPwd
  );

  router.get(
    '/users/personInfo',
    authPage,
    controller.page.user.getDataForUserInfo
  );

  // 用户相关主界面
  router.get(
    '/users/userContents',
    authPage,
    controller.page.user.getDataForUserCenter
  );

  // 参与评论
  router.get(
    '/users/joinComments',
    authPage,
    controller.page.user.getDataForJoinComments
  );

  // 系统消息
  router.get(
    '/users/notify',
    authPage,
    controller.page.user.getDataForUserNotify
  );

  // 用户投稿主界面
  router.get(
    '/users/userAddContent',
    authPage,
    controller.page.user.getDataForUserAddContent
  );

  router.get(
    '/users/editContent/:id',
    authPage,
    controller.page.user.getDataForEditContent
  );

  // 找回密码
  router.get(
    '/users/confirmEmail',
    controller.page.user.getDataForResetPsdPage
  );
};
