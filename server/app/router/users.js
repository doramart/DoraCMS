'use strict';
module.exports = app => {
  const { router, controller } = app;

  // const authPage = app.middleware.authPage({});

  // 重设密码链接
  router.get('/user-center/reset-password', controller.api.regUser.reSetPass);

  // 用户中心
  router.get(
    ['/user-center', '/user-center/:page', '/user-center/:page/:page1', '/user-center/:page/:page1/:id'],
    controller.page.user.getDataForUserIndex
  );
};
