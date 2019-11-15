module.exports = app => {
    const {
        router,
        controller
    } = app;

    const authPage = app.middleware.authPage({});

    //用户登录
    router.get('/users/login', controller.page.home.getDataForUserLogin);

    //用户注册
    router.get('/users/reg', controller.page.home.getDataForUserReg);

    //用户中心
    router.get('/users/userCenter', authPage, controller.page.home.getDataForUserIndex);

    // 修改用户密码页面
    router.get('/users/setUserPsd', authPage, controller.page.home.getDataForSetUserPwd);

    router.get('/users/personInfo', authPage, controller.page.home.getDataForUserInfo);

    // 用户相关主界面
    router.get('/users/userContents', authPage, controller.page.home.getDataForUserCenter);

    // 参与评论
    router.get('/users/joinComments', authPage, controller.page.home.getDataForJoinComments);

    // 系统消息
    router.get('/users/notify', authPage, controller.page.home.getDataForUserNotify);


    // 用户投稿主界面
    router.get('/users/userAddContent', authPage, controller.page.home.getDataForUserAddContent);

    router.get('/users/editContent/:id', authPage, controller.page.home.getDataForEditContent);

    // 找回密码
    router.get('/users/confirmEmail', controller.page.home.getDataForResetPsdPage)

    router.get("/phone-user.html", authPage, controller.page.home.getDataForPhoneUser);


}