'use strict';
module.exports = (app) => {
  const { router, controller } = app;

  const authPage = app.middleware.authPage({});

  // 配置站点地图和robots抓取
  router.get('/sitemap.xml', controller.page.home.getSiteMapPage);

  router.get('/robots.txt', controller.page.home.getRobotsPage);

  router.get('/sitemap.html', controller.page.home.getDataForSiteMap);

  router.get(
    ['/', '/zh-CN', '/zh-TW', '/en'],
    controller.page.home.getDataForIndexPage
  );

  router.get('/page/:current.html', controller.page.home.getDataForIndexPage);

  // 内容详情入口
  router.get(
    '/details/:id.html',
    controller.page.home.getDataForContentDetails
  );

  // 类别入口
  router.get(
    [
      '/:cate1?___:typeId?',
      '/:cate1?___:typeId?/:current.html',
      '/:cate0/:cate1?___:typeId?',
      '/:cate0/:cate1?___:typeId?/:current.html',
    ],
    controller.page.home.getDataForCatePage
  );

  // 搜索
  router.get(
    ['/search/:searchkey', '/search/:searchkey/:current.html'],
    controller.page.home.getDataForSearchPage
  );
  // 标签
  router.get(
    ['/tag/:tagName', '/tag/:tagName/:current.html'],
    controller.page.home.getDataForTagPage
  );
  // 作者
  router.get(
    ['/author/:userId', '/author/:userId/:current.html'],
    controller.page.home.getDataForAuthorPage
  );

  // 移动端
  router.get(
    '/phone-fenlei.html',
    controller.page.home.getDataForPhoneCategory
  );
  router.get('/phone-list.html', controller.page.home.getDataForPhoneList);
  router.get(
    '/phone-user.html',
    authPage,
    controller.page.home.getDataForPhoneUser
  );
};
